import req from './request';
import res from './response';
import { EventEmitter } from 'events';
import * as proto from './application';
import { Express } from '../types/index';

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

export function createApplication(): Express.Application {
    var app = Object.assign(function () { },
        proto,
        Object.create(req, {
            app: { configurable: true, enumerable: true, writable: true, value: app }
        }),
        Object.create(res, {
            app: { configurable: true, enumerable: true, writable: true, value: app }
        }),
        EventEmitter.prototype
    );

    app.init();
    return app;
}

/**
 * Expose the prototypes.
 */

export const application: Express.Application = proto;
export const request: Express.Request = req;
export const response: Express.Response = res;

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