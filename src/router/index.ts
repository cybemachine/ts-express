import http from 'http';
import Debug from 'debug';
import Route from './route';
import Layer from './layer';
import Deprecate from 'depd';
import parseUrl from 'parseurl';
import setPrototypeOf from 'setprototypeof';

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
const slice = Array.prototype.slice;
const debug = Debug('express:router');
const deprecate = Deprecate('express');
const objectRegExp = /^\[object (\S+)\]$/;
const toString = Object.prototype.toString;
const methods = http.METHODS && http.METHODS.map(function lowerCaseMethod(method) {
    return method.toLowerCase()
})

const proto = {
    /**
 * Map the given param placeholder `name`(s) to the given callback.
 *
 * Parameter mapping is used to provide pre-conditions to routes
 * which use normalized placeholders. For example a _:user_id_ parameter
 * could automatically load a user's information from the database without
 * any additional code,
 *
 * The callback uses the same signature as middleware, the only difference
 * being that the value of the placeholder is passed, in this case the _id_
 * of the user. Once the `next()` function is invoked, just like middleware
 * it will continue on to execute the route, or subsequent parameter functions.
 *
 * Just like in middleware, you must either respond to the request or call next
 * to avoid stalling the request.
 *
 *  app.param('user_id', function(req, res, next, id){
 *    User.find(id, function(err, user){
 *      if (err) {
 *        return next(err);
 *      } else if (!user) {
 *        return next(new Error('failed to load user'));
 *      }
 *      req.user = user;
 *      next();
 *    });
 *  });
 *
 * @param {String} name
 * @param {Function} fn
 * @return {app} for chaining
 * @public
 */
    param: function param(name: string, fn: Function) {
        // param logic
        if (typeof name === 'function') {
            deprecate('router.param(fn): Refactor to use path params');
            this._params.push(name);
            return;
        }

        // apply param functions
        var params = this._params;
        var len = params.length;
        var ret;

        if (name[0] === ':') {
            deprecate('router.param(' + JSON.stringify(name) + ', fn): Use router.param(' + JSON.stringify(name.substr(1)) + ', fn) instead');
            name = name.substr(1);
        }

        for (var i = 0; i < len; ++i) if (ret = params[i](name, fn)) fn = ret;

        // ensure we end up with a middleware function
        if ('function' !== typeof fn) throw new Error('invalid param() call for ' + name + ', got ' + fn);

        (this.params[name] = this.params[name] || []).push(fn);
        return this;
    },
    /**
     * Dispatch a req, res into the router.
     * @private
     */
    handle: function handle(req, res, out) {
        var self = this;

        debug('dispatching %s %s', req.method, req.url);

        var idx = 0;
        var protohost = getProtohost(req.url) || ''
        var removed = '';
        var slashAdded = false;
        var paramcalled = {};

        // store options for OPTIONS request only used if OPTIONS request
        var options = [];

        // middleware and routes
        var stack = self.stack;

        // manage inter-router variables
        var parentParams = req.params;
        var parentUrl = req.baseUrl || '';
        var done = restore(out, req, 'baseUrl', 'next', 'params');

        // setup next layer
        req.next = next;

        // for options requests, respond with a default if nothing else responds
        if (req.method === 'OPTIONS') {
            done = wrap(done, function (old, err) {
                if (err || options.length === 0) return old(err);
                sendOptionsResponse(res, options, old);
            });
        }

        // setup basic req values
        req.baseUrl = parentUrl;
        req.originalUrl = req.originalUrl || req.url;

        next();

        function next(err?) {
            var layerError = err === 'route' ? null : err;

            // remove added slash
            if (slashAdded) {
                req.url = req.url.substr(1);
                slashAdded = false;
            }

            // restore altered req.url
            if (removed.length !== 0) {
                req.baseUrl = parentUrl;
                req.url = protohost + removed + req.url.substr(protohost.length);
                removed = '';
            }

            // signal to exit router
            if (layerError === 'router') {
                setImmediate(done)
                return
            }

            // no more matching layers
            if (idx >= stack.length) {
                setImmediate(done);
                return;
            }

            // get pathname of request
            var path = getPathname(req);

            if (path == null) return done();

            // find next matching layer
            var layer;
            var match;
            var route;

            while (match !== true && idx < stack.length) {
                layer = stack[idx++];
                match = matchLayer(layer, path);
                route = layer.route;

                if (typeof match !== 'boolean') layerError = layerError || match;

                if (match !== true) continue;

                if (!route) continue;

                if (layerError) {
                    // routes do not match with a pending error
                    match = false;
                    continue;
                }

                var method = req.method;
                var has_method = route._handles_method(method);

                // build up automatic options response
                if (!has_method && method === 'OPTIONS') appendMethods(options, route._options());

                // don't even bother matching route
                if (!has_method && method !== 'HEAD') {
                    match = false;
                    continue;
                }
            }

            // no match
            if (match !== true) return done();

            // store route for dispatch on change
            if (route) req.route = route;

            // Capture one-time layer values
            req.params = self.mergeParams ? mergeParams(layer.params, parentParams) : layer.params;
            var layerPath = layer.path;

            // this should be done for the layer
            self.process_params(layer, paramcalled, req, res, function (err) {
                if (err) return next(layerError || err);
                if (route) return layer.handle_request(req, res, next);
                trim_prefix(layer, layerError, layerPath, path);
            });
        }

        function trim_prefix(layer, layerError, layerPath, path) {
            if (layerPath.length !== 0) {
                // Validate path is a prefix match
                if (layerPath !== path.substr(0, layerPath.length)) return next(layerError), undefined

                // Validate path breaks on a path separator
                var c = path[layerPath.length]
                if (c && c !== '/' && c !== '.') return next(layerError)

                // Trim off the part of the url that matches the route
                // middleware (.use stuff) needs to have the path stripped
                debug('trim prefix (%s) from url %s', layerPath, req.url);
                removed = layerPath;
                req.url = protohost + req.url.substr(protohost.length + removed.length);

                // Ensure leading slash
                if (!protohost && req.url[0] !== '/') {
                    req.url = '/' + req.url;
                    slashAdded = true;
                }

                // Setup base URL (no trailing slash)
                req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
                    ? removed.substring(0, removed.length - 1)
                    : removed);
            }

            debug('%s %s : %s', layer.name, layerPath, req.originalUrl);

            if (layerError) layer.handle_error(layerError, req, res, next);
            else layer.handle_request(req, res, next);
        }
    },
    /**
     * Process any parameters for the layer.
     * @private
     */
    process_params: function process_params(layer, called, req, res, done) {
        var params = this.params;

        // captured parameters from the layer, keys and values
        var keys = layer.keys;

        // fast track
        if (!keys || keys.length === 0) {
            return done();
        }

        var i = 0;
        var name;
        var paramIndex = 0;
        var key;
        var paramVal;
        var paramCallbacks;
        var paramCalled;

        // process params in order
        // param callbacks can be async
        function param(err?) {
            if (err) return done(err);
            if (i >= keys.length) return done();

            paramIndex = 0;
            key = keys[i++];
            name = key.name;
            paramVal = req.params[name];
            paramCallbacks = params[name];
            paramCalled = called[name];

            if (paramVal === undefined || !paramCallbacks) return param();

            // param previously called with same value or error occurred
            if (paramCalled && (paramCalled.match === paramVal || (paramCalled.error && paramCalled.error !== 'route'))) {
                req.params[name] = paramCalled.value;
                return param(paramCalled.error);
            }

            called[name] = paramCalled = {
                error: null,
                match: paramVal,
                value: paramVal
            };

            paramCallback();
        }

        // single param callbacks
        function paramCallback(err?) {
            var fn = paramCallbacks[paramIndex++];

            // store updated value
            paramCalled.value = req.params[key.name];

            if (err) {
                // store error
                paramCalled.error = err;
                param(err);
                return;
            }

            if (!fn) return param();

            try {
                fn(req, res, paramCallback, paramVal, key.name);
            } catch (e) {
                paramCallback(e);
            }
        }

        param();
    },
    /**
     * Use the given middleware function, with optional path, defaulting to "/".
     *
     * Use (like `.all`) will run for any http METHOD, but it will not add
     * handlers for those methods so OPTIONS requests will not consider `.use`
     * functions even if they could respond.
     *
     * The other difference is that _route_ path is stripped and not visible
     * to the handler function. The main effect of this feature is that mounted
     * handlers can operate without any code changes regardless of the "prefix"
     * pathname.
     *
     * @public
     */
    use: function use(fn: Function | Array<Function>) {
        var offset = 0;
        var path: string | Function[] = '/';

        // default path to '/'
        // disambiguate router.use([fn])
        if (typeof fn !== 'function') {
            var arg: Function | Function[] = fn;

            while (Array.isArray(arg) && arg.length !== 0) arg = arg[0];

            // first arg is the path
            if (typeof arg !== 'function') {
                offset = 1;
                path = fn;
            }
        }

        //@ts-ignore
        var callbacks = flatten<Function[]>(fn);

        if (callbacks.length === 0) {
            throw new TypeError('Router.use() requires a middleware function')
        }

        for (var i = 0; i < callbacks.length; i++) {
            var fnu = callbacks[i];

            if (typeof fnu !== 'function') throw new TypeError('Router.use() requires a middleware function but got a ' + gettype(fn))

            // add the middleware
            debug('use %o %s', path, fnu.name || '<anonymous>')

            var layer = new Layer(path, {
                sensitive: this.caseSensitive,
                strict: false,
                end: false
            }, fnu);

            layer.route = undefined;

            this.stack.push(layer);
        }

        return this;
    },
    /**
     * Create a new Route for the given path.
     *
     * Each route contains a separate middleware stack and VERB handlers.
     *
     * See the Route api documentation for details on adding handlers
     * and middleware to routes.
     *
     * @param {String} path
     * @return {Route}
     * @public
     */
    route: function route(path: string) {
        var route = new Route(path);

        var layer = new Layer(path, {
            sensitive: this.caseSensitive,
            strict: this.strict,
            end: true
        }, route.dispatch.bind(route));

        layer.route = route;

        this.stack.push(layer);
        return route;
    }
}

/**
 * Initialize a new `Router` with the given `options`.
 *
 * @param {Object} [options]
 * @return {Router} which is an callable function
 * @public
 */

export default function (options: Partial<{
    caseSensitive: boolean,
    mergeParams: string;
    strict: boolean
}> = {}) {
    var opts = options || {};

    const router = Object.assign(proto, function router(req, res, next) {
        this.handle(req, res, next);
    }, {
        params: {},
        _params: [],
        caseSensitive: opts.caseSensitive,
        mergeParams: opts.mergeParams,
        strict: opts.strict,
        stack: []
    })

    // mixin Router class functions
    setPrototypeOf(router, proto)

    return router;
};

// create Router#VERB functions
methods.concat('all').forEach(function (method) {
    proto[method] = function (path) {
        var route = this.route(path)
        route[method].apply(route, slice.call(arguments, 1));
        return this;
    };
});

// append methods to a list of methods
function appendMethods(list, addition) {
    for (var i = 0; i < addition.length; i++) {
        var method = addition[i];
        if (list.indexOf(method) === -1) list.push(method);
    }
}

// get pathname of request
function getPathname(req) {
    try {
        return parseUrl(req).pathname;
    } catch (err) {
        return undefined;
    }
}

// Get get protocol + host for a URL
function getProtohost(url) {
    if (typeof url !== 'string' || url.length === 0 || url[0] === '/') return undefined

    var searchIndex = url.indexOf('?')
    var fqdnIndex = url.substr(0, (searchIndex !== -1 ? searchIndex : url.length)).indexOf('://')

    return fqdnIndex !== -1 ? url.substr(0, url.indexOf('/', 3 + fqdnIndex)) : undefined
}

// get type for error message
function gettype(obj) {
    var type = typeof obj;

    if (type !== 'object') return type;

    return toString.call(obj).replace(objectRegExp, '$1');
}

/**
 * Match path to a layer.
 *
 * @param {Layer} layer
 * @param {string} path
 * @private
 */

function matchLayer(layer, path) {
    try {
        return layer.match(path);
    } catch (err) {
        return err;
    }
}

// merge params with parent params
function mergeParams(params, parent) {
    if (typeof parent !== 'object' || !parent) return params;

    // make copy of parent for base
    var obj = Object.assign({}, parent);

    // simple non-numeric merging
    if (!(0 in params) || !(0 in parent)) {
        return Object.assign(obj, params);
    }

    var i = 0;
    var o = 0;

    // determine numeric gaps
    while (i in params) i++;
    while (o in parent) o++;

    // offset numeric indices in params before merge
    for (i--; i >= 0; i--) {
        params[i + o] = params[i];

        // create holes for the merge when necessary
        if (i < o) delete params[i];
    }

    return Object.assign(obj, params);
}

// restore obj props after function
function restore(fn, obj, baseUrl, next, params) {
    var props = new Array(3);
    var vals = new Array(3);

    for (var i = 0; i < props.length; i++) {
        props[i] = arguments[i + 2];
        vals[i] = obj[props[i]];
    }

    return function () {
        for (var i = 0; i < props.length; i++) obj[props[i]] = vals[i];
        return fn.apply(this, arguments);
    };
}

// send an OPTIONS response
function sendOptionsResponse(res, options, next) {
    try {
        var body = options.join(',');
        res.set('Allow', body);
        res.send(body);
    } catch (err) {
        next(err);
    }
}

// wrap a function
function wrap(old, fn) {
    return function proxy() {
        var args = new Array(arguments.length + 1);
        args[0] = old;
        for (var i = 0, len = arguments.length; i < len; i++) args[i + 1] = arguments[i];
        fn.apply(this, args);
    };
}