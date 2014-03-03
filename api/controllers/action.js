'use strict';

var Errors = require('../errors')
  , Chess = require('chess.js').Chess;

exports.update = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var moveExists = req.game.moves.find(function(i) {return i.moveNumber === req.params.moveNumber; })
          , chess, mongoAction;

        if (typeof moveExists === 'object') {
            return next(new Errors.BadRequest('Can not offer draw when the move is played, wait for your turn.'));
        }

        chess = new Chess(req.game.fen);

        if (chess.turn() !== req.color) {
            return next(new Errors.NotAuthorized('It is not your turn.'));
        } else if (req.game.moves.length !== req.params.moveNumber) {
            return next(new Errors.BadRequest('Requested move number is not the next move number.'));
        }

        mongoAction = {
            moveNumber: req.params.moveNumber,
            action: 'drawoffer',
            time: new Date()
        };

        Game.findByIdAndUpdate(req.game._id, { $push: { meta: mongoAction }} , { upsert: true }, function(err, game) {
            if (err) {
                return next(new Errors.ServiceUnavailable('Could not save move to database, try again later.'));
            }

            if (game === 0) {
                return next(new Errors.Internal('Unknown server error.'));
            }

            res.send(201, mongoAction);
        });
    };
};
