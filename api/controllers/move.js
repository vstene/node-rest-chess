var Game = mongoose.model('Game'),
    Chess = require('chess.js').Chess;

function createMoveObject(body) {
    if (body.to && move.from) {
        var ret = {
            to: body.to,
            from: body.from,
            promotion: body.promotion || undefined
        };
    } else if (body.move) {
        return body.move.toString();
    }

    return null;
}

exports.read = function(req, res, next) {
    if (req.game.moves.find(function(i) { return i.number === req.params.moveNumber; }) !== undefined) {
        res.json(req.game.moves[req.params.moveNumber]);
    } else {
        return next(res.send(404, new Error('Move number ' + req.params.moveNumber + ' is not played.')));
    }
}

exports.create = function(req, res, next) {
    var chess = new Chess(req.game.fen)
      , moveObject = createMoveObject(req.body)
      , move, mongoMove;

    if (chess.turn() !== req.color) {
        return next(res.send(403, new Error('It is not your turn.')));
    } else if (req.game.moves.length !== req.params.moveNumber) {
        return next(res.send(400, new Error('Move number ' + req.params.moveNumber + ' is not the next move number.')));
    } else if (moveObject === null) {
        return next(res.send(400, new Error('A move is required.')));
    } else if (req.game.moves.find(function(i) { return i.number === req.params.moveNumber; }) !== undefined) {
        return next(res.json(409, req.game.moves[req.params.moveNumber]));
    }

    move = chess.move(moveObject);

    if (move === null) {
        return next(res.send(400, new Error('Move is not valid.')));
    }

    mongoMove = {
        number: parseInt(req.params.moveNumber, 10),
        san: move.san,
        move: { from: move.from, to: move.to, promotion: move.promotion || undefined },
        time: Date.now()
    };

    Game.findByIdAndUpdate(req.game._id, { fen: chess.fen(), $push: { moves: mongoMove } }, { upsert: true }, function(err, game) {
        if (err) {
            return next(res.send(503, new Error('Could not save move to database, try again later.')));
        }

        if (game === 0) {
            return next(res.send(500, new Error('Unknown server error.')));
        }

        res.send(mongoMove);
    });
}

