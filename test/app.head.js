const request = require("supertest");
const express = require("../src/express");

describe('HEAD', () => {
    it('should default to GET', (done) => {
        const app = express();

        app.head('/tobi', (req, res) => {
            res.send('tobi');
        });

        request(app)
            .head('/tobi')
            .expect(200, done);
    })
})

describe('app.head()', () => {
    it('should override', (done) => {
        let app = express()

        app.head('/tobi', (req, res) => {
            res.header('x-method', 'head')
            res.end()
        });

        request(app)
            .head('/tobi')
            .expect('x-method', 'head')
            .expect(200, () => {
                app = null;
                done()
            })
    })
})