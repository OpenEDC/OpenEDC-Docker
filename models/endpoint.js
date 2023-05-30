import { authorizationMiddleware } from "../controller/helper/authorizationhelper.js";

export default class Endpoint {
    static methods = {
        GET: "get",
        POST: "post",
        PUT: "put",
        DELETE: "delete"
    };

    constructor(method, path, logic, authorization = true, requiresPassword = false) {
        this.method = method;
        this.path = path;
        this.logic = logic;
        this.authorization = authorization;
        this.requiresPassword = requiresPassword;
    }

    get middleware() {
        return this.authorization ? (context) => authorizationMiddleware(context, this.logic, this.authorization, this.requiresPassword) : this.logic;
    }
}
