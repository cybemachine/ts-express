const qs = require('qs');
const merge = require('utils-merge');
const parseUrl = require('parseurl');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function query(options) {
    var opts = merge({}, options)
    var queryparse = qs.parse;

    if (typeof options === 'function') {
        queryparse = options;
        opts = undefined;
    }

    if (opts !== undefined && opts.allowPrototypes === undefined) {
        // back-compat for qs module
        opts.allowPrototypes = true;
    }

    return function query(req, res, next) {
        if (!req.query) {
            var val = parseUrl(req).query;
            req.query = queryparse(val, opts);
        }

        next();
    };
};