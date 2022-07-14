// Importing user rights is optional since omitting the last Endpoint constructor argument will require the API consumer simply to be logged in
// Passing a particular user right will enfore this authorization, passing false opens the endpoint for everyone
// If a path parameter (name in the example below) is not required, it should be removed

import Endpoint from "../models/endpoint.js";
import { rights as userRights } from "../controller/helper/authorizationhelper.js";

export default () => {
    return [
        new Endpoint(Endpoint.methods.GET, "/api/example/:name", helloWorld, userRights.PROJECTOPTIONS)
        // new Endpoint(Endpoint.methods.POST, ...)
    ];
}

const helloWorld = (context, user) => {
    // Get the request body with await context.body;
    // Get the name path parameter with context.params.name;
    // Get query parameters with const { param1, param2 } = context.queryParams;
    
    return context.string(`Hello, ${user.username}!`, 200);
}
