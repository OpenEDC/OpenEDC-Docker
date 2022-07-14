import * as storageHelper from "./helper/storagehelper.js";
import { lastUpdate } from "./statuscontroller.js";

export const getAdmindata = async context => {
    const fileName = context.params.fileName;

    const admindata = storageHelper.loadXML(storageHelper.directories.ADMINDATA, fileName);
    return context.string(admindata, 200);
};

export const setAdmindata = async context => {
    const fileName = context.params.fileName;

    // Admindata with the exact same modified date cannot be overwritten
    if (storageHelper.fileExist(fileName)) return context.string("Admindata instance already exists.", 400);

    const admindata = await context.body;
    storageHelper.storeXML(storageHelper.directories.ADMINDATA, fileName, admindata);
    lastUpdate.admindata = storageHelper.getAdmindataModifiedFromFileName(fileName);
    return context.string("Admindata successfully stored.", 201);
};

export const deleteAdmindata = async context => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.ADMINDATA, fileName);
    return context.string("Admindata successfully deleted.", 201);
};
