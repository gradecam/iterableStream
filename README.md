# nextable-stream
Wrapper around a node.js stream (only confirmed 0.8 style) to allow iteration with coroutines

Installing
==========

    npm install --save nextable-stream


Usage
=====

There are a number of possible uses for this, the use it was intended for was to allow easy lasy
iteration through entries in a mongodb database when using mongoose and `co` (requires `--harmony`
or node.js 4.x or later):

    var mongoose = require('mongoose');
    var db_connection_and_models = require('./db_config');
    var User = mongoose.model('User');
    var co = require('co');
    var nextable = require('nextable-stream');

    function closeMongoose() { mongoose.disconnect(); }

    co(function*() {
        var stream = nextable(User.find({}).stream());

        var current;

        while ((yield current = stream.next())) {
            console.log("Current user: ", user.name);
        }
    }).then(closeMongoose, closeMongoose);
