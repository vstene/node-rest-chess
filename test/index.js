var request = require('supertest')
  , should  = require('should')
  , app     = require('../app')
  , config  = require('../config/' + process.env.NODE_ENV)
  , mongoose = require('mongoose');

var ServiceUnavailable = require('../api/errors/').ServiceUnavailable

describe('Game Controller', function() {
    var connection = mongoose.createConnection(config.db)
      , game;

    before(function (done) {
        connection.db.dropDatabase(function(err) {
            // Create a game
            request(app).post('/game').end(function(err, result) {
                should.not.exists(err);
                game = result.body;
                done();
            });
        });
    });

    describe('#customError', function() {
        it('Service Unavailable Error should give status code 503', function(done) {
            var errorMessage = 'Service Unavailable error message'
              , serviceUnavailable = new ServiceUnavailable(errorMessage);

              serviceUnavailable.should.have.status(503);
              serviceUnavailable.message.should.be.exactly(errorMessage);

              done();
        });
    });

    describe('GET /game/:gameId', function() {
        it('Should have status 400 if gameId is not a valid ObjectId', function(done) {
            request(app)
            .get('/game/non-existing-game-id')
            .expect(400, done);
        });

        it('Should have status 404 if gameId is a valid ObjetId but does not exist', function(done) {
            request(app)
            .get('/game/52e30a2a4e8b8e901928318a')
            .expect(404, done);
        });
    });

    describe('POST /game', function() {
        it('Should create a new game', function(done) {
            request(app)
            .post('/game')
            .end(function(err, result) {
                should.not.exists(err);
                result.body.should.have.keys(['blackToken', 'whiteToken', '_id', 'fen', 'moves']);

                // Save id for next test
                gameId = result.body._id;

                done();
            });
        });
    });

    describe('Token', function() {
        it('Should have status 401 if no token header is provided', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .expect(401, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('No authentication token was provided');
                done();
            });
        });

        // Not 404 because we have a invalid token or invalid game id
        it('Should have status 401 if token does not match whiteToken or blackToken', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .set('X-Auth-Token', 'Invalid token')
            .expect(401, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('The provided authentication token was not valid.');
                done();
            });
        });
    });

    describe('Move', function() {
        it('Should have status 400 if gameId is not a valid ObjectId', function(done) {
            request(app)
            .post('/game/non-existing-game-id/move/0')
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Invalid Game Id');
                done();
            });
        });

        it('Should have status 400 if move number is not a number', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/aaaa')
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Invalid Move Number');
                done();
            });
        });

        it('Should have status 400 if game does not exists', function(done) {
            request(app)
            .post('/game/52e4447ad862976f3e574c75/move/0')
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Could not find game.');
                done();
            });
        });

        it('Should have status 400 if there is no move payload', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Need to have a move payload.');
                done();
            });
        });

        it('Should have status 403 if the turn is not mine', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .send({ move: '' })
            .set('X-Auth-Token', game.blackToken)
            .expect(403, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('It is not your turn.');
                done();
            });
        });

        it('Should have status 400 if next move number is inconsistent with next move number', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/99')
            .send({ move: '' })
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Requested move number is not the next move number.');
                done();
            });
        });

        it('Should only accept a valid move payload', function(done) {
            var createMoveObject = require('../api/controllers/move').createMoveObject;

            var errorPayloads   = [{ move: null }, { move: [] }, { move: 'a' },  {move: { from: 'a2'}}, { move: { to: 'a4'}}];
            var successPayloads = [{ move: 'e4'}, {from: 'e2', to: 'e4'}, {from: 'e2', to: 'e4', promotion: 'b'}];
            var successResults  = ['e4', {from: 'e2', to: 'e4'}, {from: 'e2', to: 'e4', promotion: 'b'}];

            errorPayloads.forEach(function(element, index) {
                var moveObject = createMoveObject(element);

                should(moveObject).be.exactly(null);
            });

            successPayloads.forEach(function(element, index) {
                var moveObject = createMoveObject(element);

                moveObject.should.be.eql(successResults[index]);
            });

            done();
        });

        it('Should have status 400 if payload is not valid', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .send({ move: 'a' })
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('A valid move payload is required.');
                done();
            });
        });

        it('Should have status 400 if move is not a valid move', function(done) {
            request(app)
            .post('/game/' + game._id + '/move/0')
            .send({ move: 'beer' })
            .set('X-Auth-Token', game.whiteToken)
            .expect(400, function(err, result) {
                should.not.exists(err);
                result.body.message.should.be.exactly('Move is not valid.');
                done();
            });
        });

        it('Should receive a move json response if move is valid', function(done) {
            var moveNumber = 0
              , sanMove = 'e4';

            request(app)
            .post('/game/' + game._id + '/move/' + moveNumber)
            .send({ move: sanMove })
            .set('X-Auth-Token', game.whiteToken)
            .expect(200, function(err, result) {
                should.not.exists(err);
                result.body.should.have.keys(['number', 'san', 'move', 'time']);
                result.body.number.should.be.exactly(moveNumber);
                result.body.san.should.be.exactly(sanMove);

                done();
            });
        });

        it('Should receive a move json response if move is valid', function(done) {
            var moveNumber = 1
              , moveObject = { from: 'g8', to: 'f6' };

            request(app)
            .post('/game/' + game._id + '/move/' + moveNumber)
            .send(moveObject)
            .set('X-Auth-Token', game.blackToken)
            .expect(200, function(err, result) {
                should.not.exists(err);
                result.body.should.have.keys(['number', 'san', 'move', 'time']);
                result.body.number.should.be.exactly(moveNumber);
                result.body.move.from.should.be.exactly(moveObject.from);
                result.body.move.to.should.be.exactly(moveObject.to);

                done();
            });
        });

        it('Should have status 404 if move is not yet played', function(done) {
            request(app)
            .get('/game/' + game._id + '/move/99')
            .set('X-Auth-Token', game.whiteToken)
            .expect(404, done);
        });

        it('Should receive a move json response if move exists', function(done) {
            request(app)
            .get('/game/' + game._id + '/move/1')
            .set('X-Auth-Token', game.whiteToken)
            .expect(200, function(err, result) {
                should.not.exists(err);
                result.body.should.have.keys(['number', 'san', 'move', 'time']);
                result.body.number.should.be.exactly(1);
                result.body.move.from.should.be.exactly('g8');
                result.body.move.to.should.be.exactly('f6');
                result.body.san.should.be.exactly('Nf6');

                done();
            });
        });
    });
});