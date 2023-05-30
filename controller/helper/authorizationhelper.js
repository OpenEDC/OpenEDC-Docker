import { users } from "../userscontroller.js";
import * as cryptoHelper from "./cryptohelper.js"
import * as storageHelper from "./storagehelper.js"
import * as userController from "../userscontroller.js"
import { sha256 } from "../../denodependencies/sha256.bundle.js";
import * as configHelper from "./configHelper.js"

// Must match the userRights defined in the webapp (defined in the webapp since it must work offline as well)
export const rights = {
    PROJECTOPTIONS: "project-options",
    EDITMETADATA: "edit-metadata",
    MANAGESUBJECTS: "manage-subjects",
    VALIDATEFORMS: "validate-forms",
    ADDSUBJECTDATA: "add-subject-data",
    EXPORTDATA: "allow-export-data"
};

const ishLoginStatus = {
    SUCCESSFUL: "successful",
    PARAMETERS_INCOMPLETE: "Not all parameters have been set.",
    PARAMETERS_INVALID: "The parameters are invalid",
    EXPIRED_TIMESTAMP: "timestamp expired" 
}

export const authorizationMiddleware = async (context, next, requiredAuthorization, requiresPassword) => {
    const queryParams = await context.request.url.searchParams;

    //if password is required, we need to have username and password parameter
    if(requiresPassword && (!queryParams.get('password') ||queryParams.get('password') == "")) return wrongAuthentication(context);

    let username = queryParams?.get('username');
    let password = queryParams?.get('password');
    let authenticationKey = "";
    const authentication = context.request.headers.get("Authorization");

    if(username) {
        //if query parameters username and password are present, we take it from the parameters
        if(password) authenticationKey = await cryptoHelper.PBKDF2.generateAuthenticationKey(username.toLowerCase(), queryParams.get('password'));
    } else if(authentication) {
        //if a authentication header is pressent, we take the information about username and password from there
        //authentication header is prioritized over parameters
        if (!authentication.split(" ")[0] == "Basic") return malformedAuthenticationHeader(context);
        const basicAuthParts = atob(authentication.split(" ")[1]).split(":");
        username = basicAuthParts[0];
        authenticationKey = basicAuthParts[1];
    } else if(await context.state.session.get('username')) {
        username = await context.state.session.get('username') || ''
        authenticationKey = await context.state.session.get('authenticationKey') || ''
    }

    if(!username) return noAuthentication(context);
    let user = users.find(user => user.username && user.username.toLowerCase() == username.toLowerCase());
    keyAuthentication: if (!user || user.authenticationKey != authenticationKey) {
        const isPublic = storageHelper.getSetting('instancePublic');
        if(!isPublic) return badAuthentication(context);

        const secretKey = storageHelper.getSetting('secretKey');
        if(secretKey && authenticationKey) {
            const authKey = await cryptoHelper.PBKDF2.generateAuthenticationKey(username.toLowerCase(), secretKey);
            if(authenticationKey != authKey) return badAuthentication(context);
            break keyAuthentication;
        }
    }


    if(!user) user = userController.addUser(username, authenticationKey);
    
    // TODO: if-statement not required if user.hasAuthorizationFor() is improved to return true if requiredAuthorization is true
    if (requiredAuthorization && Array.isArray(requiredAuthorization)) {
        for(let authorization of requiredAuthorization) {
            if (!user.hasAuthorizationFor(authorization)) return noAuthorization(context);
        }
    }
    await next(context, user);
};

const malformedAuthenticationHeader = context => {
    context.response.status = 401;
    context.response.body = "Malformed authorization header present."
}

const noAuthentication= context => {
    context.response.status = 401;
    context.response.body = "Neither authorization header nor userdata present in the request."
}

const badAuthentication = context => {
    context.response.status = 401;
    context.response.body = "User not found or wrong password entered."
}

const noAuthorization = context => {
    context.response.status = 403;
    context.response.body = "Not authorized for the requested resource."
}

const wrongAuthentication = context => {
    context.response.status = 403;
    context.response.body = "This operations requires password parameter.";
}

const ishLoginError = (context, message) => {
    context.response.status = 401;
    context.response.body = message;
}
