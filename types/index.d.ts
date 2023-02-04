/// <reference types="node" />
/// <reference types="./core" />

import qs from 'qs'
import * as core from './core';
import * as bodyParser from 'body-parser';
import * as serverStatic from 'serve-static';

declare namespace Express {
    interface Application { }
    interface Request { }
    interface Response { }
}

declare function createApplication(): core.Express;

/**
 * JSON handler for express
 */
export const json: typeof bodyParser.json;
/**
 * RAW handler for express
 */
export const raw: typeof bodyParser.raw;
/**
 * TEXT handler for express
 */
export const text: typeof bodyParser.text;
/**
 * urlencoded handler for express
 */
export const urlencoded: typeof bodyParser.urlencoded
/**
 * querypareser handler for express
 */
export function query(options: qs.IParseOptions | typeof qs.parse): core.Handler

/**
* These are the exposed prototypes.
*/
export const application: core.Application;
export const request: core.Request;
export const response: core.Response;

/**
 * A router object is an isolated instance of middleware and routes. You can think of it as a “mini-application,” capable only of performing middleware and routing functions. Every Express application has a built-in app router.
 * A router behaves like middleware itself, so you can use it as an argument to app.use() or as the argument to another router’s use() method.
 * The top-level express object has a Router() method that creates a new router object.
 * Once you’ve created a router object, you can add middleware and HTTP method routes (such as get, put, post, and so on) to it just like an application. 
 * @param options 
 */
export function Router(options?: {
    /**
     * Enable case sensitivity.
     */
    caseSensitive?: boolean | undefined;

    /**
     * Preserve the req.params values from the parent router.
     * If the parent and the child have conflicting param names, the child’s value take precedence.
     *
     * @default false
     * @since 4.5.0
     */
    mergeParams?: boolean | undefined;

    /**
     * Enable strict routing.
     */
    strict?: boolean | undefined;
}): core.Router

export default createApplication;