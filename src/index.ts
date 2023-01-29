import req from './request';
import res from './response';
import { EventEmitter } from 'events';
import * as proto from './application';

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
        }),
        EE: EventEmitter.prototype,
        proto
    });

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