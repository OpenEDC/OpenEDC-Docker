import * as storageHelper from "./helper/storagehelper.js";

export const getJSON = async context => {
    const fileName = context.params.fileName;
    const content = storageHelper.loadJSON(storageHelper.directories.MISC, fileName);

    if (content) {
        return context.json(content, 200);
    } else {
        return context.string("JSON could not be found.", 204);
    }
};

export const setJSON = async context => {
    const fileName = context.params.fileName;
    const content = await context.body;

    storageHelper.storeJSON(storageHelper.directories.MISC, fileName, content);
    return context.string("JSON successfully stored.", 201);
};

export const deleteJSON = async context => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.MISC, fileName);
    return context.string("JSON successfully deleted.", 201);
};
