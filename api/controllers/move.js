'use strict';

var Errors = require('../errors')
  , Chess = require('chess.js').Chess;

exports.read = function(req, res, next) {
    var moveExists = req.game.moves.find(function(i) { return i.number === req.params.moveNumber; });

    if (moveExists !== undefined) {
        res.json(req.game.moves[req.params.moveNumber]);
    } else {
        return next(new Errors.NotFound('Requested move number has not been played.'));
    }
};

exports.create = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var chess = new Chess(req.game.fen)
          , moveObject, move, mongoMove, options;

        if (typeof req.body === 'undefined') {
            return next(new Errors.BadRequest('Need to have a move payload.'));
        } else if (chess.turn() !== req.color) {
            return next(new Errors.NotAuthorized('It is not your turn.'));
        } else if (req.game.moves.length !== req.params.moveNumber) {
            return next(new Errors.BadRequest('Requested move number is not the next move number.'));
        }

        moveObject = exports.createMoveObject(req.body);

        if (moveObject === null) {
            return next(new Errors.BadRequest('A valid move payload is required.'));
        } else if (req.game.moves.find(function(i) { return i.number === req.params.moveNumber; }) !== undefined) {
            return next(new Errors.BadRequest('Move is already made, can not update.'));
        }

        move = chess.move(moveObject);

        if (move === null) {
            return next(new Errors.InvalidContent('Move is not valid.'));
        }

        mongoMove = {
            number: parseInt(req.params.moveNumber, 10),
            san: move.san,
            move: { from: move.from, to: move.to, promotion: move.promotion || undefined },
            time: Date.now(),
            action: []
        };

        options = { fen: chess.fen(), $push: { moves: mongoMove } };

        Game.findByIdAndUpdate(req.game._id, options, { upsert: true }, function(err, game) {
            if (err) {
                return next(new Errors.ServiceUnavailable('Could not save move to database, try again later.'));
            }

            if (game === 0) {
                return next(new Errors.Internal('Unknown server error.'));
            }

            res.send(mongoMove);
        });
    };
};

exports.createMoveObject = function(body) {
    if (body.from && body.to) {
        var ret = {
            from: body.from,
            to: body.to
        };

        if (body.promotion) {
            ret.promotion = body.promotion;
        }

        return ret;
    } else if (body.move && typeof body.move === 'string' && body.move.length >= 2) {
        return body.move.toString();
    }

    return null;
};
