const assert = require("assert");
const supertest = require("supertest");
const application = require("../src/express")

describe('Check exsistence', () => {
    it('should have a property in module.exports', () => {
        assert.strictEqual(!!application, true)
    });
    it('should have a application property', () => {
        assert.strictEqual(!!application.application, true)
    });
    it('should have a request property', () => {
        assert.strictEqual(!!application.request, true)
    });
    it('should have a response property', () => {
        assert.strictEqual(!!application.response, true)
    });
    it('should have a route property', () => {
        assert.strictEqual(!!application.Route, true)
    });
    it('should have a router property', () => {
        assert.strictEqual(!!application.Router, true)
    });
    it('should have a query property', () => {
        assert.strictEqual(!!application.query, true)
    });
    it('should have a raw property', () => {
        assert.strictEqual(!!application.raw, true)
    });
    it('should have a json property', () => {
        assert.strictEqual(!!application.json, true)
    });
    it('should have a text property', () => {
        assert.strictEqual(!!application.text, true)
    });
    it('should have a urlencoded property', () => {
        assert.strictEqual(!!application.urlencoded, true)
    });
    it('should have a static property', () => {
        assert.strictEqual(!!application.static, true)
    });
});

describe('Check types', () => {
    it('should have a typeof function in module.exports', () => {
        assert.strictEqual(typeof application, 'function')
    });
    it('should have a typeof object property application', () => {
        assert.strictEqual(typeof application.application, 'object')
    });
    it('should have a typeof object property request', () => {
        assert.strictEqual(typeof application.request, 'object')
    });
    it('should have a typeof object property response', () => {
        assert.strictEqual(typeof application.response, 'object')
    });
    it('should have a typeof function property route', () => {
        assert.strictEqual(typeof application.Route, 'function')
    });
    it('should have a typeof function property router', () => {
        assert.strictEqual(typeof application.Router, 'function')
    });
    it('should have a typeof function property query', () => {
        assert.strictEqual(typeof application.query, 'function')
    });
    it('should have a typeof function property raw', () => {
        assert.strictEqual(typeof application.raw, 'function')
    });
    it('should have a typeof function property json', () => {
        assert.strictEqual(typeof application.json, 'function')
    });
    it('should have a typeof function property text', () => {
        assert.strictEqual(typeof application.text, 'function')
    });
    it('should have a typeof function property urlencoded', () => {
        assert.strictEqual(typeof application.urlencoded, 'function')
    });
    it('should have a typeof function property static', () => {
        assert.strictEqual(typeof application.static, 'function')
    });
});

describe('Examples', () => {
    it('should be callable', () => {
        const app = application();
        assert.strictEqual(typeof app, 'function')
    });
    it('basic test', () => {
        let app = application();
        app.get('/', (req, res) => { res.send('Hello World!') });
        supertest(app).get('/')
            .expect(200)
            .expect('Content-Type', 'text/html; charset=utf-8')
            .expect('Content-Length', '12')
            .end((err, res) => {
                if (err) throw err;
            });
        app = null;
    });
    it('404 test', () => {
        let app = application();
        supertest(app)
            .get('/')
            .expect(404)
            .end((err, res) => {
                if (err) throw err;
            });
        app = null;
    });
});

describe('Mixes', () => {
    it('should work like event emmiter', (done) => {
        let app = application();
        app.on('foo', done);
        app.emit('foo');
        app = null;
    });
});