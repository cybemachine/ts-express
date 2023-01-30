import http from 'http';
import Debug from 'debug';
import Layer from './layer';

type PickValue<T> = T extends ReadonlyArray<any> ? { [K in Extract<keyof T, number>]: PickValue<T[K]>; }[number] : T;
type FlatArray<T extends ArrayLike<any>> = Array<PickValue<T[number]>>;
function flatten<T extends ArrayLike<any>>(array: T): FlatArray<T> {
    const result: FlatArray<T> = [];
    $flatten<T>(array, result);
    return result;
}
function $flatten<T extends ArrayLike<any>>(
    array: T,
    result: FlatArray<T>
): void {
    for (let i = 0; i < array.length; i++) {
        const value = array[i];

        if (Array.isArray(value)) $flatten(value as any, result);
        else result.push(value);
    }
}

/**
 * Module variables.
 * @private
 */
const debug = Debug('express:router:route')
const slice = Array.prototype.slice;
const toString = Object.prototype.toString;
const methods = http.METHODS && http.METHODS.map(function lowerCaseMethod(method) {
    return method.toLowerCase()
})
/**
 * Module exports.
 * @public
 */

/**
 * Initialize `Route` with the given `path`,
 *
 * @param {String} path
 * @public
 */
export const Route = Object.assign(function Route(path: string) {
    this.path = path;
    this.stack = [];

    debug('new %o', path)

    // route handlers for various http methods
    this.methods = {};
}, {
    /**
 * Determine if the route handles a given method.
 * @private
 */
    _handle: function _handles_method(method) {
        if (this.methods._all) return true;

        var name = method.toLowerCase();

        if (name === 'head' && !this.methods['head']) name = 'get';

        return Boolean(this.methods[name]);
    },
    /**
 * @return {Array} supported HTTP methods
 * @private
 */
    _options: function _options() {
        var methods = Object.keys(this.methods);

        // append automatic head
        if (this.methods.get && !this.methods.head) methods.push('head');

        for (var i = 0; i < methods.length; i++) methods[i] = methods[i].toUpperCase();

        return methods;
    },
    /**
     * dispatch req, res into this route
     * @private
     */
    dispatch: function dispatch(req, res, done) {
        var idx = 0;
        var stack = this.stack;
        if (stack.length === 0) return done();
        var method = req.method.toLowerCase();
        if (method === 'head' && !this.methods['head']) method = 'get';

        req.route = this;

        next();

        function next(err?) {
            // signal to exit route
            if (err && err === 'route') return done();

            // signal to exit router
            if (err && err === 'router') return done(err)

            var layer = stack[idx++];
            if (!layer) return done(err);

            if (layer.method && layer.method !== method) return next(err);

            if (err) layer.handle_error(err, req, res, next);
            else layer.handle_request(req, res, next);
        }
    },
    /**
     * Add a handler for all HTTP verbs to this route.
     *
     * Behaves just like middleware and can respond or call `next`
     * to continue processing.
     *
     * You can use multiple `.all` call to add multiple handlers.
     *
     *   function check_something(req, res, next){
     *     next();
     *   };
     *
     *   function validate_user(req, res, next){
     *     next();
     *   };
     *
     *   route
     *   .all(validate_user)
     *   .all(check_something)
     *   .get(function(req, res, next){
     *     res.send('hello world');
     *   });
     *
     * @param {function} handler
     * @return {Route} for chaining
     * @api public
     */
    all: function all() {
        var handles = flatten(slice.call(arguments));

        for (var i = 0; i < handles.length; i++) {
            var handle = handles[i];

            if (typeof handle !== 'function') {
                var type = toString.call(handle);
                var msg = 'Route.all() requires a callback function but got a ' + type
                throw new TypeError(msg);
            }

            var layer = Layer('/', {}, handle);
            layer.method = undefined;

            this.methods._all = true;
            this.stack.push(layer);
        }

        return this;
    },
});

methods.forEach(function (method) {
    Route.prototype[method] = function () {
        var handles = flatten(slice.call(arguments));

        for (var i = 0; i < handles.length; i++) {
            var handle = handles[i];

            if (typeof handle !== 'function') {
                var type = toString.call(handle);
                var msg = 'Route.' + method + '() requires a callback function but got a ' + type
                throw new Error(msg);
            }

            debug('%s %o', method, this.path)

            var layer = Layer('/', {}, handle);
            layer.method = method;

            this.methods[method] = true;
            this.stack.push(layer);
        }

        return this;
    };
});