var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/chess-rest', function(err) {
    if (err) {
        throw new Error(err);
    }
});

// Load all models
require("fs").readdirSync(__dirname + "/models").forEach(function(file) {
    require("./models/" + file)(mongoose);
});

module.exports = mongoose;