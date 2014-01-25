exports.verify = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var id, game;

        // Check if a token is provided
        if (typeof req.headers['x-auth-token'] === 'undefined') {
            return next(res.send(401, new Error('No authentication token was provided')));
        }

        req.token = req.headers['x-auth-token'];

        // Verify parameters
        try {
            id = new mongoose.Types.ObjectId(req.params.gameId);
        } catch (err) {
            return next(res.send(400, new Error('Invalid Game Id')));
        }

        if (isNaN(req.params.moveNumber)) {
            return next(res.send(400, new Error('Invalid Move Number')));
        }

        req.params.moveNumber = parseInt(req.params.moveNumber, 10);

        // Verify token and get game
        Game.findById(id).select('+whiteToken +blackToken').exec(function(err, game) {
            if (err) {
                console.log(err);
                return next(res.send(400, new Error('Could not fetch game, try again later.')));
            }

            if (game === null) {
                return next(res.send(400, new Error('Could not find game.')));
            }

            if (game.whiteToken === req.token) {
                req.color = 'w';
            } else if (game.blackToken === req.token) {
                req.color = 'b';
            } else {
                return next(res.send(401, new Error('The provided authentication token was not valid.')));
            }

            req.game = game;

            next();
        });
    }
}