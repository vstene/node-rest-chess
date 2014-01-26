var InvalidCredentials  = require('restify').InvalidCredentialsError
  , BadRequest          = require('restify').InvalidContentError
  , ServiceUnavailable  = require('../errors/').ServiceUnavailable;

exports.verify = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        // Check if a token is provided
        if (typeof req.headers['x-auth-token'] === 'undefined') {
            return next(new InvalidCredentials('No authentication token was provided'));
        }

        req.token = req.headers['x-auth-token'];

        // Verify token and get game
        Game.findById(req.params.gameId).select('+whiteToken +blackToken').exec(function(err, game) {
            if (err) {
                return next(new ServiceUnavailable('Could not fetch game, try again later.'));
            }

            if (game === null) {
                return next(new BadRequest('Could not find game.'));
            }

            if (game.whiteToken === req.token) {
                req.color = 'w';
            } else if (game.blackToken === req.token) {
                req.color = 'b';
            } else {
                return next(new InvalidCredentials('The provided authentication token was not valid.'));
            }

            req.game = game;

            next();
        });
    }
}