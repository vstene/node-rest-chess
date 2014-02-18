'use strict';

var Errors = require('../errors')
  , Chess = require('chess.js').Chess;

exports.update = function(mongoose) {
    var Game = mongoose.model('Game');

    return function(req, res, next) {
        var moveExists = req.game.moves.find(function(i) { return i.number === req.params.moveNumber; })
          , chess;

        if (typeof moveExists === 'object') {
            return next(new Errors.BadRequest('Can not offer draw when the move is played, wait for your turn.'));
        }

        chess = new Chess(req.game.fen);

        if (chess.turn() !== req.color) {
            return next(new Errors.NotAuthorized('It is not your turn.'));
        } else if (req.game.moves.length !== req.params.moveNumber) {
            return next(new Errors.BadRequest('Requested move number is not the next move number.'));
        }


        next();
    };
};
