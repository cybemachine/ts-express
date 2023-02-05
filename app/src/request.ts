import http from 'http';
import fresh from 'fresh';
import { isIP } from 'net';
import Deprecate from 'depd';
import typeis from 'type-is';
import parse from 'parseurl';
import accepts from 'accepts';
import proxyaddr from 'proxy-addr';
import parseRange from 'range-parser';

/**
 * Request prototype.
 * @public
 */
const deprecate = Deprecate('express');
export const req = Object.assign(http.IncomingMessage.prototype, {
    /**
 * Return request header.
 *
 * The `Referrer` header field is special-cased,
 * both `Referrer` and `Referer` are interchangeable.
 *
 * Examples:
 *
 *     req.get('Content-Type');
 *     // => "text/plain"
 *
 *     req.get('content-type');
 *     // => "text/plain"
 *
 *     req.get('Something');
 *     // => undefined
 *
 * @param {String} name
 * @return {String}
 * @public
 */
    get: function get(name: string): string | undefined {
        if (!name) throw new TypeError('name argument is required to req.get');
        if (typeof name !== 'string') throw new TypeError('name must be a string to req.get');

        const lc = name.toLowerCase();

        switch (lc) {
            case 'referer':
            case 'referrer':
                return this.headers.referrer || this.headers.referer;
            default:
                return this.headers[lc];
        }
    },
    /**
 * To do: update docs.
 *
 * Check if the given `type(s)` is acceptable, returning
 * the best match when true, otherwise `undefined`, in which
 * case you should respond with 406 "Not Acceptable".
 *
 * The `type` value may be a single MIME type string
 * such as "application/json", an extension name
 * such as "json", a comma-delimited list such as "json, html, text/plain",
 * an argument list such as `"json", "html", "text/plain"`,
 * or an array `["json", "html", "text/plain"]`. When a list
 * or array is given, the _best_ match, if any is returned.
 *
 * Examples:
 *
 *     // Accept: text/html
 *     req.accepts('html');
 *     // => "html"
 *
 *     // Accept: text/*, application/json
 *     req.accepts('html');
 *     // => "html"
 *     req.accepts('text/html');
 *     // => "text/html"
 *     req.accepts('json, text');
 *     // => "json"
 *     req.accepts('application/json');
 *     // => "application/json"
 *
 *     // Accept: text/*, application/json
 *     req.accepts('image/png');
 *     req.accepts('png');
 *     // => undefined
 *
 *     // Accept: text/*;q=.5, application/json
 *     req.accepts(['html', 'json']);
 *     req.accepts('html', 'json');
 *     req.accepts('html, json');
 *     // => "json"
 *
 * @param {String|Array} type(s)
 * @return {String|Array|Boolean}
 * @public
 */

    accepts: function (...args: Array<string>): string | Array<string> | boolean {
        var accept = accepts(this);
        return accept.types.apply(accept, args);
    },
    /**
 * Check if the given `encoding`s are accepted.
 *
 * @param {String} ...encoding
 * @return {String|Array}
 * @public
 */
    acceptsEncodings: function (...encoding): string | Array<string> {
        var accept = accepts(this);
        return accept.encodings.apply(accept, encoding);
    },

    /**
 * Check if the given `charset`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {String} ...charset
 * @return {String|Array}
 * @public
 */
    acceptsCharsets: function (...charset: Array<string>): string | Array<string> {
        var accept = accepts(this);
        return accept.charsets.apply(accept, charset);
    },
    /**
 * Check if the given `lang`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {String} ...lang
 * @return {String|Array}
 * @public
 */
    acceptsLanguages: function (...lang: Array<string>): string | Array<string> {
        var accept = accepts(this);
        return accept.languages.apply(accept, lang);
    },
    /**
 * Parse Range header field, capping to the given `size`.
 *
 * Unspecified ranges such as "0-" require knowledge of your resource length. In
 * the case of a byte range this is of course the total number of bytes. If the
 * Range header field is not given `undefined` is returned, `-1` when unsatisfiable,
 * and `-2` when syntactically invalid.
 *
 * When ranges are returned, the array has a "type" property which is the type of
 * range that is required (most commonly, "bytes"). Each array element is an object
 * with a "start" and "end" property for the portion of the range.
 *
 * The "combine" option can be set to `true` and overlapping & adjacent ranges
 * will be combined into a single range.
 *
 * NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
 * should respond with 4 users when available, not 3.
 *
 * @param {number} size
 * @param {object} [options]
 * @param {boolean} [options.combine=false]
 * @return {number|array}
 * @public
 */

    range: function range(size: number, options: parseRange.Options): parseRange.Ranges | parseRange.Result {
        var range = this.get('Range');
        if (!range) return;
        return parseRange(size, range, options);
    },
    /**
     * Return the value of param `name` when present or `defaultValue`.
     *
     *  - Checks route placeholders, ex: _/user/:id_
     *  - Checks body params, ex: id=12, {"id":12}
     *  - Checks query string params, ex: ?id=12
     *
     * To utilize request bodies, `req.body`
     * should be an object. This can be done by using
     * the `bodyParser()` middleware.
     *
     * @param {String} name
     * @param {Mixed} [defaultValue]
     * @return {String}
     * @public
     */
    param: function param(name: string, defaultValue?: any): string {
        var params = this.params || {};
        var body = this.body || {};
        var query = this.query || {};

        var args = arguments.length === 1
            ? 'name'
            : 'name, default';
        deprecate('req.param(' + args + '): Use req.params, req.body, or req.query instead');

        if (null != params[name] && params.hasOwnProperty(name)) return params[name];
        if (null != body[name]) return body[name];
        if (null != query[name]) return query[name];

        return defaultValue;
    },
    /**
     * Check if the incoming request contains the "Content-Type"
     * header field, and it contains the given mime `type`.
     *
     * Examples:
     *
     *      // With Content-Type: text/html; charset=utf-8
     *      req.is('html');
     *      req.is('text/html');
     *      req.is('text/*');
     *      // => true
     *
     *      // When Content-Type is application/json
     *      req.is('json');
     *      req.is('application/json');
     *      req.is('application/*');
     *      // => true
     *
     *      req.is('html');
     *      // => false
     *
     * @param {String|Array} types...
     * @return {String|false|null}
     * @public
     */

    is: function is(...types: Array<string>) {
        var arr = types;

        if (!Array.isArray(types)) {
            arr = new Array(arguments.length);
            for (var i = 0; i < arr.length; i++) arr[i] = arguments[i];
        }

        return typeis(this, arr);
    },
    /**
     * Return the protocol string "http" or "https"
     * when requested with TLS. When the "trust proxy"
     * setting trusts the socket address, the
     * "X-Forwarded-Proto" header field will be trusted
     * and used if present.
     *
     * If you're running behind a reverse proxy that
     * supplies https for you this may be enabled.
     *
     * @return {String}
     * @public
     */
    get protocol(): string {
        let proto = 'http';
        if (this.connection) if (Reflect.has(this.connection, 'encrypted')) {
            proto = 'https'
        }
        var trust = this.app.get('trust proxy fn');

        if (!trust(this.connection.remoteAddress, 0)) return proto;

        var header = this.get('X-Forwarded-Proto') || proto
        var index = header.indexOf(',')

        return index !== -1 ? header.substring(0, index).trim() : header.trim()
    },
    /**
     * Short-hand for:
     *
     *    req.protocol === 'https'
     *
     * @return {Boolean}
     * @public
     */
    get secure(): boolean {
        return this.protocol === 'https';
    },
    /**
     * Return the remote address from the trusted proxy.
     *
     * The is the remote address on the socket unless
     * "trust proxy" is set.
     *
     * @return {String}
     * @public
     */

    get ip(): string {
        var trust = this.app.get('trust proxy fn');
        return proxyaddr(this, trust);
    },
    /**
     * When "trust proxy" is set, trusted proxy addresses + client.
     *
     * For example if the value were "client, proxy1, proxy2"
     * you would receive the array `["client", "proxy1", "proxy2"]`
     * where "proxy2" is the furthest down-stream and "proxy1" and
     * "proxy2" were trusted.
     *
     * @return {Array}
     * @public
     */
    get ips(): Array<string> {
        var trust = this.app.get('trust proxy fn');
        var addrs = proxyaddr.all(this, trust).reverse();
        addrs.pop()
        return addrs
    },
    /**
     * Return subdomains as an array.
     *
     * Subdomains are the dot-separated parts of the host before the main domain of
     * the app. By default, the domain of the app is assumed to be the last two
     * parts of the host. This can be changed by setting "subdomain offset".
     *
     * For example, if the domain is "tobi.ferrets.example.com":
     * If "subdomain offset" is not set, req.subdomains is `["ferrets", "tobi"]`.
     * If "subdomain offset" is 3, req.subdomains is `["tobi"]`.
     *
     * @return {Array}
     * @public
     */
    get subdomains(): Array<string> {
        var hostname = this.hostname;

        if (!hostname) return [];

        var offset = this.app.get('subdomain offset');
        var subdomains = !isIP(hostname) ? hostname.split('.').reverse() : [hostname];

        return subdomains.slice(offset);
    },
    /**
     * Short-hand for `url.parse(req.url).pathname`.
     *
     * @return {String}
     * @public
     */
    get path(): string {
        return parse(this).pathname;
    },
    /**
     * Parse the "Host" header field to a hostname.
     *
     * When the "trust proxy" setting trusts the socket
     * address, the "X-Forwarded-Host" header field will
     * be trusted.
     *
     * @return {String}
     * @public
     */
    get hostname(): string {
        var trust = this.app.get('trust proxy fn');
        var host = this.get('X-Forwarded-Host');

        if (!host || !trust(this.connection.remoteAddress, 0)) {
            host = this.get('Host');
        } else if (host.indexOf(',') !== -1) {
            host = host.substring(0, host.indexOf(',')).trimRight()
        }

        if (!host) return;

        var offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
        var index = host.indexOf(':', offset);

        return index !== -1 ? host.substring(0, index) : host;
    },
    /**
     * Check if the request is fresh, aka
     * Last-Modified and/or the ETag
     * still match.
     *
     * @return {Boolean}
     * @public
     */
    get fresh(): boolean {
        var method = this.method;
        var res = this.res
        var status = res.statusCode

        // GET or HEAD for weak freshness validation only
        if ('GET' !== method && 'HEAD' !== method) return false;

        // 2xx or 304 as per rfc2616 14.26
        if ((status >= 200 && status < 300) || 304 === status) return fresh(this.headers, {
            'etag': res.get('ETag'),
            'last-modified': res.get('Last-Modified')
        })

        return false;
    },
    /**
     * Check if the request is stale, aka
     * "Last-Modified" and / or the "ETag" for the
     * resource has changed.
     *
     * @return {Boolean}
     * @public
     */
    get stale(): boolean {
        return !this.fresh;
    },
    /**
     * Check if the request was an _XMLHttpRequest_.
     *
     * @return {Boolean}
     * @public
     */
    get xhr(): boolean {
        return (this.get('X-Requested-With') || '').toLowerCase() === 'xmlhttprequest';
    }
})

export default req;