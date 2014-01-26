'use strict';

if (typeof process.env.NODE_ENV === 'undefined') {
    process.env.NODE_ENV = 'development';
}

module.exports = require('./api');
