import { authorizationMiddleware } from "../controller/helper/authorizationhelper.js";

export default class Endpoint {
    static methods = {
        GET: "get",
        POST: "post",
        PUT: "put",
        DELETE: "delete"
    };

    constructor(method, path, logic, authorization = true) {
        this.method = method;
        this.path = path;
        this.logic = logic;
        this.authorization = authorization;
    }

    get middleware() {
        return this.authorization ? () => authorizationMiddleware(this.logic, this.authorization) : () => this.logic;
    }
}
