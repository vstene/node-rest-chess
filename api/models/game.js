'use strict';

var crypto = require('crypto');

module.exports = function(mongoose) {
    var Game = new mongoose.Schema({
        whiteToken: { type: String, select: false, index: true },
        blackToken: { type: String, select: false, index: true },
        moves: [{
            _id: false,
            number: Number,
            san: String,
            move: { from: String, to: String, promotion: String },
            time: Date,
            meta: Array
        }],
        fen: { type: String, default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
        result: String
    }, { versionKey: false });

    Game.pre('save', function(next) {
        this.set('whiteToken', crypto.randomBytes(20).toString('hex'));
        this.set('blackToken', crypto.randomBytes(20).toString('hex'));

        next();
    });

    mongoose.model('Game', Game);
};
