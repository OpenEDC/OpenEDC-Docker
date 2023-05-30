import { Status } from "../models/statusmodel.js";
import { Update } from "../models/updatemodel.js";
import { users } from "./userscontroller.js";
import * as loggingController from "./loggingcontroller.js"

const serverVersion = "0.3.0";

export const lastUpdate = new Update();

export const getStatus = context => {
    const isInitialized = users.length > 0;
    const status = new Status(serverVersion, isInitialized);
    
    context.response.status = 200;
    context.response.body = status;
};

export const getLastUpdate = context => {
    context.response.status = 200;
    context.response.body = lastUpdate
}

export const initiateProjectDeletion = (context, user) => {
    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.CLINICALDATA, loggingController.LogEvent.METADATA], `${user.username}: Initiated project deletion`);
    return context.string("ok", 200);
}

export const initiateClinicalDataDeletion = (context, user) => {
    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.CLINICALDATA], `${user.username}: Initiated clinicaldata deletion`);
    return context.string("ok", 200);
}
