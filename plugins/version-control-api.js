import Endpoint from "../models/endpoint.js";
import { rights as userRights } from "../controller/helper/authorizationhelper.js";
import * as requestHelper from "./version-control-plugin/requesthelper.js"

export default () => {
    return [
        new Endpoint(Endpoint.methods.GET, "/api/vc", getVersions, userRights.EDITMETADATA),
        new Endpoint(Endpoint.methods.GET, "/api/vc/version", getPreviousVersion, userRights.EDITMETADATA),
        new Endpoint(Endpoint.methods.POST, "/api/vc", saveVersion, userRights.EDITMETADATA),
        new Endpoint(Endpoint.methods.GET, "/api/vc/reset", resetToHash, userRights.EDITMETADATA),
        new Endpoint(Endpoint.methods.POST, "/api/vc/init", initGit, userRights.EDITMETADATA),
        new Endpoint(Endpoint.methods.GET, "/api/vc/init", checkGitStatus, userRights.EDITMETADATA),
    ];
}

const getVersions = async (context, user) => {
    const result = await requestHelper.getVersions().catch((error) => {throw error})
    return context.json(result, 200);
}

const saveVersion = async (context, user) => {
    const comment = await context.body;
    return requestHelper.saveVersion(context, comment)
}

const resetToHash = async (context, user) => {
    const hash = context.queryParams.hash;
    return await requestHelper.resetToHash(context, hash).catch((e) => {throw e})
}

const initGit = async (context, user) => {
    const comment = await context.body;
    return requestHelper.initGit(context, comment);
}

const checkGitStatus = async (context, user) => {
    return requestHelper.checkGitStatus(context);
}

const getPreviousVersion = async(context, user) => {
    const hash = context.queryParams.hash;
    return requestHelper.getPreviousVersion(context, hash);
}