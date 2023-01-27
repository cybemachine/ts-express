import bodyParser from 'body-parser'
import { EventEmitter } from 'events';
import mixin from 'merge-descriptors';
var proto = require('./application');
var Route = require('./router/route');
var Router = require('./router');
var req = require('./request');
var res = require('./response');

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
    var app = Object.assign(function () { }, {
        request: Object.create(req, {
            app: { configurable: true, enumerable: true, writable: true, value: app }
        }),
        response: Object.create(res, {
            app: { configurable: true, enumerable: true, writable: true, value: app }
        })
    });

    mixin(app, EventEmitter.prototype, false);
    mixin(app, proto, false);

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

exports.json = bodyParser.json
exports.query = require('./middleware/query');
exports.raw = bodyParser.raw;
exports.static = require('serve-static');
exports.text = bodyParser.text;
exports.urlencoded = bodyParser.urlencoded;