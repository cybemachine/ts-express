/// <reference types="node" />
/// <reference types="./core" />

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
* These are the exposed prototypes.
*/
export const application: core.Application;
export const request: core.Request;
export const response: core.Response;

export default createApplication;