import { EventEmitter } from 'events';
import mixin from 'merge-descriptors';
import * as proto from './application';
import req from './request';
import res from './response';

/**
 * Expose `createApplication()`.
 */

export default createApplication;

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

export function createApplication() {
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

export const application = proto;
export const request = req;
export const response = res;

/**
 * Expose constructors.
 */
export { Route } from './router/route'
export { Router } from './router';

/**
 * Expose middleware
 */

export { json, raw, text, urlencoded } from 'body-parser'
export { query } from './middleware/query';
export * as stat from 'serve-static';