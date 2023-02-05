export function init(app) {
    return function expressInit(req, res, next) {
        if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Express');
        req.res = res;
        res.req = req;
        req.next = next;

        Object.setPrototypeOf(req, app.request)
        Object.setPrototypeOf(res, app.response)

        res.locals = res.locals || Object.create(null);

        next();
    };
};

export default init;