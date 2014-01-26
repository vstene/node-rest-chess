'use strict';

var Errors = require('../errors');

exports.read = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var id;

        try {
            id = new mongoose.Types.ObjectId(req.params.gameId);
        } catch (err) {
            return next(new Errors.BadRequest('The game id is not valid.'));
        }

        Game.findById(id, function(err, game) {
            if (err) {
                return next(new Errors.ServiceUnavailable('Could not fetch game, try again later.'));
            }

            if (game === null) {
                return next(new Errors.NotFound('Could not find game.'));
            }

            res.json(game);
        });
    };
};

exports.create = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var game = new Game();

        game.save(function(err, data) {
            if (err) {
                return next(res.send(503, new Errors.ServiceUnavailable('Could not create game.')));
            }

            res.json(data);
        });
    };
};