import fs from 'fs';
import Debug from 'debug';
import { dirname, basename, extname, join, resolve } from 'path';

/**
 * Module variables.
 * @private
 */

const debug = Debug('express:view')

export class View {
    path: string;
    ext: string;
    name: string;
    root: string;
    engine: Function;
    defaultEngine: string;
    /**
 * Initialize a new `View` with the given `name`.
*
* Options:
*
*   - `defaultEngine` the default template engine name
*   - `engines` template engine require() cache
*   - `root` root path for view lookup
*
* @param {string} name
* @param {object} options
* @public
*/
    constructor(name: string, options: {
        defaultEngine: string;
        engines: {
            [x: string]: Function
        };
        root: string;
    }) {
        var opts = Object.assign({}, options);

        this.defaultEngine = opts.defaultEngine;
        this.ext = extname(name);
        this.name = name;
        this.root = opts.root;

        if (!this.ext && !this.defaultEngine) throw new Error('No default engine was specified and no extension was provided.');

        var fileName = name;

        if (!this.ext) {
            this.ext = this.defaultEngine[0] !== '.' ? '.' + this.defaultEngine : this.defaultEngine;

            fileName += this.ext;
        }

        if (!opts.engines[this.ext]) {
            var mod = this.ext.substr(1)
            debug('require "%s"', mod)

            var fn = require(mod).__express

            if (typeof fn !== 'function') throw new Error('Module "' + mod + '" does not provide a view engine.')

            opts.engines[this.ext] = fn
        }

        this.engine = opts.engines[this.ext];

        this.path = this.lookup(fileName);
    }
    /**
 * Lookup view by the given `name`
*
* @param {string} name
* @private
*/
    lookup(name: string) {
        var path;
        var roots = [this.root];

        debug('lookup "%s"', name);

        for (var i = 0; i < roots.length && !path; i++) {
            var root = roots[i];

            // resolve the path
            var loc = resolve(root, name);
            var dir = dirname(loc);
            var file = basename(loc);

            // resolve the file
            path = this.resolve(dir, file);
        }

        return path;
    }
    /**
 * Render with the given options.
 *
 * @param {object} options
 * @param {function} callback
 * @private
 */
    render(options: object, callback: Function) {
        debug('render "%s"', this.path);
        this.engine(this.path, options, callback);
    }
    /**
     * Resolve the file within the given directory.
     *
     * @param {string} dir
     * @param {string} file
     * @private
     */
    resolve(dir: string, file: string) {
        var ext = this.ext;

        var path = join(dir, file);
        var stat = tryStat(path);

        if (stat && stat.isFile()) return path;

        path = join(dir, basename(file, ext), 'index' + ext);
        stat = tryStat(path);

        if (stat && stat.isFile()) return path;
    }
}

export default View;

/**
 * Return a stat, maybe.
 *
 * @param {string} path
 * @return {fs.Stats}
 * @private
 */

function tryStat(path: string): fs.Stats {
    debug('stat "%s"', path);

    try {
        return fs.statSync(path);
    } catch (e) {
        return undefined;
    }
}