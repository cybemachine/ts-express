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

declare module "ts-express-cybe" {
    export function createApplication(): Express;

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
    export const application: Application;
    export const request: Request;
    export const response: Response;

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
    }): Router

    /**
     * It serves static files and is based on serve-static.
     */
    export const stat: serverStatic.RequestHandlerConstructor<Response>

    interface Application extends Express.Application, core.Application { }
    interface CookieOptions extends core.CookieOptions { }
    interface Errback extends core.Errback { }
    interface ErrorRequestHandler<
        P = core.ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = core.Query,
        Locals extends Record<string, any> = Record<string, any>
    > extends core.ErrorRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> { }
    interface Express extends core.Express { }
    interface Handler extends core.Handler { }
    interface IRoute extends core.IRoute { }
    interface IRouter extends core.IRouter { }
    interface IRouterHandler<T> extends core.IRouterHandler<T> { }
    interface IRouterMatcher<T> extends core.IRouterMatcher<T> { }
    interface MediaType extends core.MediaType { }
    interface NextFunction extends core.NextFunction { }
    interface Locals extends core.Locals { }
    interface Request<
        P = core.ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = core.Query,
        Locals extends Record<string, any> = Record<string, any>
    > extends Express.Request, core.Request<P, ResBody, ReqBody, ReqQuery, Locals> { }
    interface RequestHandler<
        P = core.ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = core.Query,
        Locals extends Record<string, any> = Record<string, any>
    > extends core.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> { }
    interface RequestParamHandler extends core.RequestParamHandler { }
    interface Response<
        ResBody = any,
        Locals extends Record<string, any> = Record<string, any>
    > extends Express.Response, core.Response<ResBody, Locals> { }
    interface Router extends core.Router { }
    interface Send extends core.Send { }
}