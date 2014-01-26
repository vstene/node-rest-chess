var TokenController = require('./controllers/token')
  , GameController  = require('./controllers/game')
  , MoveController  = require('./controllers/move');

var BadRequest = require('./errors/').BadRequest;

exports.init = function(server, mongoose) {

    server.get('/game/:gameId', GameController.read(mongoose));
    server.post('/game', GameController.create(mongoose));

    // Verify parameters
    server.use(function(req, res, next) {
        if (!req.params.gameId || !req.params.moveNumber) {
            return next(new BadRequest('Game Id and Move Number is requried'));
        }

        try {
            new mongoose.Types.ObjectId(req.params.gameId);
        } catch (err) {
            return next(new BadRequest('Invalid Game Id'));
        }

        if (isNaN(req.params.moveNumber)) {
            return next(new BadRequest('Invalid Move Number'));
        }

        req.params.moveNumber = parseInt(req.params.moveNumber, 10);

        next();
    })

    server.use(TokenController.verify(mongoose));

    server.get('/game/:gameId/move/:moveNumber', MoveController.read(mongoose));
    server.post('/game/:gameId/move/:moveNumber', MoveController.create(mongoose));
}
