import qs from 'qs';
import parseUrl from 'parseurl';

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */
export function query(options: Partial<{
    allowPrototypes: boolean;
}>): (req, res, next) => void {
    var opts = Object.assign({}, options)
    var queryparse = qs.parse;

    if (typeof options === 'function') {
        queryparse = options;
        opts = undefined;
    }

    if (opts !== undefined && opts.allowPrototypes === undefined) opts.allowPrototypes = true;

    return function query(req, res, next) {
        if (!req.query) {
            var val = parseUrl(req).query;
            if (typeof val !== "string") return;
            req.query = queryparse(val, opts);
        }

        next();
    };
};

export default query;