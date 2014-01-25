var mongoose = require('./mongoose')
  , routes   = require('./routes')
  , restify  = require('restify');

require('array.prototype.find');

var server = restify.createServer({
    name: 'node-chess-api'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

routes.init(server, mongoose);

server.on('error', function(err) {
    console.log(err);
});

server.listen(9999, '127.0.0.1', function() {
    console.log('%s listening at %s', server.name, server.url);
});

