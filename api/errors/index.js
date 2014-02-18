'use strict';

var restify = require('restify'),
    util = require('util');

function ServiceUnavailable(message) {
    restify.RestError.call(this, {
        restCode: 'ServiceUnavailable',
        statusCode: 503,
        message: message,
        constructorOpt: ServiceUnavailable
    });

    this.name = 'ServiceUnavailable';
}

util.inherits(ServiceUnavailable, restify.RestError);

module.exports = {
    BadRequest         : restify.InvalidContentError,
    NotFound           : restify.ResourceNotFoundError,
    NotAuthorized      : restify.NotAuthorizedError,
    InvalidContent     : restify.InvalidContentError,
    InvalidCredentials : restify.InvalidCredentialsError,
    Internal           : restify.InternalError,
    ServiceUnavailable : ServiceUnavailable
};
