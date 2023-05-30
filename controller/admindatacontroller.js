import * as storageHelper from "./helper/storagehelper.js";
import { lastUpdate } from "./statuscontroller.js";
import * as loggingController from "./loggingcontroller.js"

export const getAdmindata = async context => {
    const fileName = context.params.fileName;

    const admindata = storageHelper.loadXML(storageHelper.directories.ADMINDATA, fileName);
    context.response.status = 200;
    context.response.body = admindata
};

export const setAdmindata = async (context, user) => {
    const fileName = context.params.fileName;

    // Admindata with the exact same modified date cannot be overwritten
    if (storageHelper.fileExist(fileName)) {
        context.response.status = 200;
        context.response.body = "Admindata instance already exists.";
        return;
    }

    const admindata = await context.request.body().value
    storageHelper.storeXML(storageHelper.directories.ADMINDATA, fileName, admindata);
    lastUpdate.admindata = storageHelper.getAdmindataModifiedFromFileName(fileName);
    loggingController.log([loggingController.LogEvent.EDIT, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.ADMINDATA], `${user.username}: Edited admindata file ${fileName}`);
    context.response.status = 201;
    context.response.body = "Admindata successfully stored.";
};

export const setAdminDataServer = (admindata, oldFileName) => {
    const fileName = "admindata__" + new Date().getTime()
    storageHelper.storeXML(storageHelper.directories.ADMINDATA, fileName, admindata);
    lastUpdate.admindata = storageHelper.getAdmindataModifiedFromFileName(fileName);
    storageHelper.removeFile(storageHelper.directories.ADMINDATA, oldFileName);
}

export const deleteAdmindata = async (context, user) => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.ADMINDATA, fileName);
    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.ADMINDATA], `${user.username}: Deleted admindata file ${fileName}`);
    context.response.status = 201;
    context.response.body = "Admindata successfully deleted.";
};
