const SS = require('serve-static');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');

const req = require('./request');
const res = require('./response');
const Router = require('./router');
const proto = require('./application');
const Route = require('./router/route');
const query = require('./middleware/query');

/**
 * Expose `createApplication()`.
 */

exports = module.exports = createApplication;

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
    const app = Object.assign(function (req, res, next) {
        app.handle(req, res, next);
    }, EventEmitter.prototype, proto);

    // expose the prototype that will get set on requests
    app.request = Object.create(req, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    // expose the prototype that will get set on responses
    app.response = Object.create(res, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    app.init();
    return app;
}

/**
 * Expose the prototypes.
 */

exports.application = proto;
exports.request = req;
exports.response = res;

/**
 * Expose constructors.
 */

exports.Route = Route;
exports.Router = Router;

/**
 * Expose middleware
 */

exports.static = SS;
exports.query = query;
exports.raw = bodyParser.raw;
exports.json = bodyParser.json;
exports.text = bodyParser.text;
exports.urlencoded = bodyParser.urlencoded;