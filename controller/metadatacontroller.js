import * as storageHelper from "./helper/storagehelper.js";
import { lastUpdate } from "./statuscontroller.js";
import * as cryptoHelper from "./helper/cryptohelper.js"
import * as loggingController from "./loggingcontroller.js"

export const getMetadata = async context => {
    const fileName = context.params.fileName;
    const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, fileName);
    context.response.status = 200;
    context.response.body = metadata
};

export const getMetadataRaw = async (context, user) => {
    if(storageHelper.getSetting('disableEncryption')) {
        //already decrypted
        return getMetadata(context, user);
    }
    const fileName = context.params.fileName;
    const queryParams = await context.request.url.searchParams
    if(!queryParams?.get('password')) {
        context.response.status = 400;
        context.response.body = "Missing password"
    }
    const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, fileName);
    const decryptionKey = await cryptoHelper.AES.decrypt.withPassword(user.encryptedDecryptionKey, queryParams.get('password'));
    const xmlString = await cryptoHelper.AES.decrypt.withKey(metadata, decryptionKey);
    
    context.response.status = 200;
    context.response.body = xmlString;
};

export const setMetadata = async (context, user) => {
    const fileName = context.params.fileName.replaceAll("%20", " ");

    /* const authentication = context.request.headers.get("Authorization");
    let username;
    if (!authentication || !authentication.split(" ")[0] == "Basic") username = 'anonymous'
    else {
        const basicAuthParts = atob(authentication.split(" ")[1]).split(":");
        username = basicAuthParts[0];
    } */

    // Metadata with the exact same modified date cannot be overwritten
    if (storageHelper.fileExist(fileName)) {
        context.response.status = 400;
        context.response.body = "Metadata instance already exists.";
        return;
    }
    const metadata = await context.request.body().value;
    storageHelper.storeXML(storageHelper.directories.METADATA, fileName, metadata);
    //storageHelper.storeXML(storageHelper.directories.METADATA, constFileName, metadata);
    lastUpdate.metadata = storageHelper.getMetadataModifiedFromFileName(fileName);

 /*    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "commit", `--author="${username}<>"`, "-a", "-m", `auto commit by ${username} at ${getDateTimeStringFromTime(fileName.split('__')[1])} (${fileName.split('__')[1]})`] }
    );
    await p1.status(); */

    loggingController.log([loggingController.LogEvent.EDIT, loggingController.LogEvent.METADATA], `${user.username}: Edited metadata file ${fileName}`);
    context.response.status = 201;
    context.response.body = "Metadata successfully stored."
};

export const deleteMetadata = async (context, user) => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.METADATA, fileName);

    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.METADATA], `${user.username}: Deleted metadata file ${fileName}`);
    context.response.status = 201;
    context.response.body = "Metadata successfully deleted.";
};

function getDateTimeStringFromTime(time) {
    let currentdate = new Date(); 
    currentdate.setTime(time);
    let datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    return datetime;
}

