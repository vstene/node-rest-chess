var TokenController = require('./controllers/token')
  , GameController  = require('./controllers/game')
  , MoveController  = require('./controllers/move');

exports.init = function(server, mongoose) {

    server.get('/game/:gameId', GameController.read(mongoose));
    server.post('/game', GameController.create(mongoose));

    server.use(TokenController.verify(mongoose));

    server.get('/game/:gameId/move/:moveNumber', MoveController.read(mongoose));
    server.post('/game/:gameId/move/:moveNumber', MoveController.create(mongoose));
}
