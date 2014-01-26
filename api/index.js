'use strict';

var config   = require('../config/' + process.env.NODE_ENV)
  , mongoose = require('./mongoose')(config.db)
  , routes   = require('./routes')
  , restify  = require('restify');

require('array.prototype.find');

// Set up server
var server = restify.createServer({
    name: 'node-rest-chess'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

routes.init(server, mongoose);

server.on('error', function(err) {
    console.log(err);
});

server.listen(config.port, '127.0.0.1', function() {
    console.log('%s listening at %s', server.name, server.url);
});


module.exports = server;