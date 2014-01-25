var TokenController = require('./controllers/token')
  , GameController  = require('./controllers/game')
  , MoveController  = require('./controllers/move');

exports.init = function(server, mongoose) {

    server.get('/game/:gameId', GameController.read);
    server.post('/game', GameController.create);

    server.use(TokenController.verify);

    server.get('/game/:gameId/move/:moveNumber', MoveController.read);
    server.post('/game/:gameId/move/:moveNumber', MoveController.create);
}
