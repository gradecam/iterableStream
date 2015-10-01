var P = global.Promise;

// use iterableStream.setPromiseLibrary to provide any ECMASCRIPT 6-compatible promise constructor
// with .resolve and .reject functions on it to have this library use your own promises
function setPromiseLibrary(lib) {
    P = lib;
}
function defer() {
    var resolve, reject;
    var dfd = new P(function(res, rej) {
        resolve = res;
        reject = rej;
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: dfd
    };
}

function iterableStream(stream) {
    /*jshint validthis: true */
    if (!(this instanceof iterableStream)) {
        return new iterableStream(stream);
    }

    var nextQ = [], pending = [], error = null, done = false;

    stream.on('data', function(doc) {
        if (pending.length) {
            var dfd = pending.shift();
            dfd.resolve(doc);
        } else {
            nextQ.push(doc);
            stream.pause();
        }
    }).on('error', function(err) {
        // If we get an error, reject any pending fetches
        error = err;
        while (pending.length) {
            var dfd = pending.shift();
            dfd.reject(err);
        }
    }).on('close', function() {
        process.nextTick(function() {
            if (pending.length) {
                done = true;
                while (pending.length) {
                    var dfd = pending.shift();
                    dfd.resolve(null);
                }
            } else {
                nextQ.push(null);
            }
        });
    });

    this.next = function() {
        if (error) {
            // Once an error occurs, reject any further calls
            return P.reject(error);
        } else if (done) {
            // Once we're done, resolve each response to null
            return P.resolve(null);
        } else if (nextQ.length) {
            // If items are already in the queue return the next
            // one
            var item = nextQ.shift();
            if (!item) { done = true; }
            return P.resolve(item);
        } else {
            // If we're out of queued items, queue up a Deferred
            // and return a promise to it; resume the stream so we get
            // something to fulfill it.
            var dfd = defer();
            pending.push(dfd);
            stream.resume();
            return dfd.promise;
        }
    };
    this.destroy = function() {
        stream.destroy();
    };
}

iterableStream.setPromiseLibrary = setPromiseLibrary;

module.exports = iterableStream;
