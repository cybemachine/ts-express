const request = require("supertest");
const express = require("../src/express");

describe('app.all()', () => {
    it('should add a router per method', (done) => {
        const app = express();

        app.all('/tobi', (req, res) => {
            res.end('PUT');
        });

        request(app)
            .put('/tobi')
            .expect(200, 'PUT', done)
    })

    it('should run the callback for a method just once', (done) => {
        var app = express()

        app.all('/*', (req, res) => {
            res.end()
        });

        request(app)
            .del('/tobi')
            .expect(200, done);
    })
})