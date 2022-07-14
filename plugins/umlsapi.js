// Importing user rights is optional since omitting the last Endpoint constructor argument will require the API consumer simply to be logged in
// Passing a particular user right will enfore this authorization, passing false opens the endpoint for everyone
// If a path parameter (name in the example below) is not required, it should be removed

import Endpoint from "../models/endpoint.js";
import { rights as userRights } from "../controller/helper/authorizationhelper.js";
import * as umlsconfig from "./umlsapi/umlsconfig.js"

export default () => {
    return [
        new Endpoint(Endpoint.methods.GET, "/api/umls/:code", getConcepts, userRights.EDITMETADATA)
        // new Endpoint(Endpoint.methods.POST, ...)
    ];
}

const getConcepts = async (context, user) => {
    const code = context.params.code;
    const result = getUMLSData(code).catch((error) => {throw error})
    return context.json(result, 200);
}

async function getUMLSData(code) {
    const url = `${umlsconfig.UMLS_SERVER_URL}/${code}`;
    let headers = [];
    headers["Authorization"] = umlsconfig.UMLS_AUTHENTICATION;
    const result = await fetch(url, {headers}).catch(() => {throw new Error("No connection to UMLS server")});
    return await result.json();
}
