import qs from 'qs';
import Etag from 'etag';
import { mime } from 'send';
import proxyaddr from 'proxy-addr';
import querystring from 'querystring';
import contentType from 'content-type';

/**
 * Return strong ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

export const etag = createETagGenerator({ weak: false })

/**
 * Return weak ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

export const wetag = createETagGenerator({ weak: true })

/**
 * Check if `path` looks absolute.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

export function isAbsolute(path: string): boolean {
    if ('/' === path[0]) return true;
    if (':' === path[1] && ('\\' === path[2] || '/' === path[2])) return true; // Windows device path
    if ('\\\\' === path.substring(0, 2)) return true; // Microsoft Azure absolute path
};
/**
 * Normalize the given `type`, for example "html" becomes "text/html".
 *
 * @param {String} type
 * @return {Object}
 * @api private
 */
export function normalizeType(type: string) {
    return ~type.indexOf('/') ? acceptParams(type) : { value: mime.lookup(type), params: {} };
};

/**
 * Normalize `types`, for example "html" becomes "text/html".
 *
 * @param {Array} types
 * @return {Array}
 * @api private
 */

export function normalizeTypes(types: string[]) {
    var ret = [];

    for (var i = 0; i < types.length; ++i) ret.push(normalizeType(types[i]));

    return ret;
};

/**
 * Parse accept params `str` returning an
 * object with `.value`, `.quality` and `.params`.
 * also includes `.originalIndex` for stable sorting
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function acceptParams(str: string): {
    value: string;
    quality: number;
    params: {}
    originalIndex: any;
} {
    var parts = str.split(/ *; */);
    var ret = { value: parts[0], quality: 1, params: {}, originalIndex: undefined };

    for (var i = 1; i < parts.length; ++i) {
        var pms = parts[i].split(/ *= */);
        if ('q' === pms[0]) {
            ret.quality = parseFloat(pms[1]);
        } else {
            ret.params[pms[0]] = pms[1];
        }
    }

    return ret;
}

/**
 * Compile "etag" value to function.
 *
 * @param  {Boolean|String|Function} val
 * @return {Function}
 * @api private
 */

export function compileETag(val: Function | boolean | 'weak' | 'strong') {
    var fn;

    if (typeof val === 'function') return val;

    switch (val) {
        case true:
        case 'weak':
            fn = wetag;
            break;
        case false:
            break;
        case 'strong':
            fn = createETagGenerator({ weak: false });
            break;
        default:
            throw new TypeError('unknown value for etag function: ' + val);
    }

    return fn;
}

/**
 * Compile "query parser" value to function.
 *
 * @param  {String|Function} val
 * @return {Function}
 * @api private
 */

export function compileQueryParser(val: 'simple' | 'extended' | Function | boolean) {
    var fn;

    if (typeof val === 'function') return val;

    switch (val) {
        case true:
        case 'simple':
            fn = querystring.parse;
            break;
        case false:
            fn = newObject;
            break;
        case 'extended':
            fn = parseExtendedQueryString;
            break;
        default:
            throw new TypeError('unknown value for query parser function: ' + val);
    }

    return fn;
}

/**
 * Compile "proxy trust" value to function.
 *
 * @param  {Boolean|String|Number|Array|Function} val
 * @return {Function}
 * @api private
 */

export function compileTrust(val: boolean | string | number | any[] | Function) {
    if (typeof val === 'function') return val;

    if (val === true) {
        // Support plain true/false
        return function () { return true };
    }

    if (typeof val === 'number') {
        // Support trusting hop count
        return function (a, i) { return i < val };
    }

    if (typeof val === 'string') {
        // Support comma-separated values
        val = val.split(/ *, */);
    }

    return proxyaddr.compile(val || []);
}

/**
 * Set the charset in a given Content-Type string.
 *
 * @param {String} type
 * @param {String} charset
 * @return {String}
 * @api private
 */

export function setCharset(type: string, charset: string): string {
    if (!type || !charset) return type;

    // parse type
    var parsed = contentType.parse(type);

    // set charset
    parsed.parameters.charset = charset;

    // format type
    return contentType.format(parsed);
};

/**
 * Create an ETag generator function, generating ETags with
 * the given options.
 *
 * @param {object} options
 * @return {function}
 * @private
 */

function createETagGenerator(options) {
    return function generateETag(body, encoding) {
        var buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body

        return Etag(buf, options)
    }
}

/**
 * Parse an extended query string with qs.
 *
 * @return {Object}
 * @private
 */
function parseExtendedQueryString(str) {
    return qs.parse(str, {
        allowPrototypes: true
    });
}

/**
 * Return new empty object.
 *
 * @return {Object}
 * @api private
 */
function newObject() {
    return {};
}