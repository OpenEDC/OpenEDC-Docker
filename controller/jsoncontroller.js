import * as storageHelper from "./helper/storagehelper.js";
import * as loggingController from "./loggingcontroller.js"

export const getJSON = async context => {
    const fileName = context.params.fileName;
    const content = storageHelper.loadJSON(storageHelper.directories.MISC, fileName);
    if (content) {
        context.response.status = 200;
        context.response.body = content;
    } else {
        context.response.status = 204;
    }
};

export const setJSON = async (context, user) => {
    const fileName = context.params.fileName;
    const content = await context.request.body().value;

    storageHelper.storeJSON(storageHelper.directories.MISC, fileName, content);

    loggingController.log([loggingController.LogEvent.JSON_AND_SETTINGS], `${user.username}: Changed json entry ${fileName}`);
    context.response.status = 201;
    context.response.body = "JSON successfully stored.";
};

export const deleteJSON = async (context, user) => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.MISC, fileName);

    loggingController.log([loggingController.LogEvent.JSON_AND_SETTINGS], `${user.username}: Deleted json entry ${fileName}`);
    context.response.status = 201;
    context.response.body = "JSON successfully deleted.";
};
