var Error = require('../errors');

var Chess = require('chess.js').Chess;

exports.read = function(mongoose) {
    return function(req, res, next) {
        var moveExists = req.game.moves.find(function(i) { return i.number === req.params.moveNumber; });

        if (moveExists !== undefined) {
            res.json(req.game.moves[req.params.moveNumber]);
        } else {
            return next(new Error.NotFound('Requested move number has not been played.'));
        }
    }
}

exports.create = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var chess = new Chess(req.game.fen)
          , moveObject, moveExists, move, mongoMove;

        if (typeof req.body === 'undefined') {
            return next(new Error.BadRequest('Need to have a move payload.'));
        } else if (chess.turn() !== req.color) {
            return next(new Error.NotAuthorized('It is not your turn.'));
        } else if (req.game.moves.length !== req.params.moveNumber) {
            return next(new Error.BadRequest('Requested move number is not the next move number.'));
        }

        moveObject = exports.createMoveObject(req.body);

        if (moveObject === null) {
            return next(new Error.BadRequest('A valid move payload is required.'));
        } else if (req.game.moves.find(function(i) { return i.number === req.params.moveNumber; }) !== undefined) {
            return next(new Error.BadRequest('Move is already made, can not update.'));
        }

        move = chess.move(moveObject);

        if (move === null) {
            return next(new Error.InvalidContent('Move is not valid.'));
        }

        mongoMove = {
            number: parseInt(req.params.moveNumber, 10),
            san: move.san,
            move: { from: move.from, to: move.to, promotion: move.promotion || undefined },
            time: Date.now()
        };

        Game.findByIdAndUpdate(req.game._id, { fen: chess.fen(), $push: { moves: mongoMove } }, { upsert: true }, function(err, game) {
            if (err) {
                return next(new Error.ServiceUnavailable('Could not save move to database, try again later.'));
            }

            if (game === 0) {
                return next(new Error.Internal('Unknown server error.'));
            }

            res.send(mongoMove);
        });
    }
}

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
}

