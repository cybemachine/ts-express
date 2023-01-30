/**
 * Module dependencies.
 * @private
 */

import Debug from 'debug';
import pathRegexp from 'path-to-regexp';

/**
 * Module variables.
 * @private
 */
const debug = Debug('express:router:layer')
var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Module exports.
 * @public
 */

export class Layer {
    handle: Function;
    name: string;
    params: {
        [x: string]: string
    }
    path: string;
    regexp: RegExp & {
        fast_star?: boolean;
        fast_slash?: boolean
    };
    keys: any;
    constructor(path: string, options: Partial<{
        sensitive: boolean,
        strict: boolean,
        end: boolean
    }>, fn: Function) {
        debug('new %o', path)
        var opts = options || {};

        this.handle = fn;
        this.name = fn.name || '<anonymous>';
        this.params = undefined;
        this.path = undefined;
        this.regexp = pathRegexp.pathToRegexp(path, this.keys = [], opts);

        // set fast path flags
        this.regexp.fast_star = path === '*'
        this.regexp.fast_slash = path === '/' && opts.end === false
    }
    /**
     * Handle the error for the layer.
     *
     * @param {Error} error
     * @param {Request} req
     * @param {Response} res
     * @param {function} next
     * @api private
     */
    handle_error(error: Error, req, res, next: Function) {
        var fn = this.handle;

        if (fn.length !== 4) return next(error);

        try {
            fn(error, req, res, next);
        } catch (err) {
            next(err);
        }
    }
    /**
     * Handle the request for the layer.
     *
     * @param {Request} req
     * @param {Response} res
     * @param {function} next
     * @api private
     */
    handle_request(req, res, next: Function) {
        var fn = this.handle;

        if (fn.length > 3) return next();

        try {
            fn(req, res, next);
        } catch (err) {
            next(err);
        }
    };
    /**
     * Check if this route matches `path`, if so
     * populate `.params`.
     *
     * @param {String} path
     * @return {Boolean}
     * @api private
     */
    match(path: string): boolean {
        var match

        if (path != null) {
            // fast path non-ending match for / (any path matches)
            if (this.regexp.fast_slash) {
                this.params = {}
                this.path = ''
                return true
            }

            // fast path for * (everything matched in a param)
            if (this.regexp.fast_star) {
                this.params = { '0': decode_param(path) }
                this.path = path
                return true
            }

            // match the path
            match = this.regexp.exec(path)
        }

        if (!match) {
            this.params = undefined;
            this.path = undefined;
            return false;
        }

        this.params = {};
        this.path = match[0]

        var keys = this.keys;
        var params = this.params;

        for (var i = 1; i < match.length; i++) {
            var key = keys[i - 1];
            var prop = key.name;
            var val = decode_param(match[i])

            if (val !== undefined || !(hasOwnProperty.call(params, prop))) params[prop] = val;
        }

        return true;
    }
}

export default Layer;

function decode_param(val: string): string {
    if (typeof val !== 'string' || val.length === 0) return val;

    try {
        return decodeURIComponent(val);
    } catch (err) {
        if (err instanceof URIError) {
            err = Object.assign(err, {
                message: 'Failed to decode param \'' + val + '\'',
                status: 400,
                statusCode: 400
            })
        }

        throw err;
    }
}