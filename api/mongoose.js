var mongoose = require('mongoose');

module.exports = function(mongoPath) {

    mongoose.connect(mongoPath, function(err) {
        if (err) {
            throw new Error(err);
        }
    });

    // Load all models
    require("fs").readdirSync(__dirname + "/models").forEach(function(file) {
        require("./models/" + file)(mongoose);
    });

    return mongoose;
}