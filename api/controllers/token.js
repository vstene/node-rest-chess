var Error = require('../errors');

exports.verify = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        // Check if a token is provided
        if (typeof req.headers['x-auth-token'] === 'undefined') {
            return next(new Error.InvalidCredentials('No authentication token was provided'));
        }

        req.token = req.headers['x-auth-token'];

        // Verify token and get game
        Game.findById(req.params.gameId).select('+whiteToken +blackToken').exec(function(err, game) {
            if (err) {
                return next(new Error.ServiceUnavailable('Could not fetch game, try again later.'));
            }

            if (game === null) {
                return next(new Error.BadRequest('Could not find game.'));
            }

            if (game.whiteToken === req.token) {
                req.color = 'w';
            } else if (game.blackToken === req.token) {
                req.color = 'b';
            } else {
                return next(new Error.InvalidCredentials('The provided authentication token was not valid.'));
            }

            req.game = game;

            next();
        });
    }
}