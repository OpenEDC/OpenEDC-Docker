import * as storageHelper from "./helper/storagehelper.js";
import { lastUpdate } from "./statuscontroller.js";

export const getMetadata = async context => {
    const fileName = context.params.fileName;
    const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, fileName);
    return context.string(metadata, 200);
};


export const setMetadata = async context => {
    const fileName = context.params.fileName;
    /* const authentication = context.request.headers.get("Authorization");
    let username;
    if (!authentication || !authentication.split(" ")[0] == "Basic") username = 'anonymous'
    else {
        const basicAuthParts = atob(authentication.split(" ")[1]).split(":");
        username = basicAuthParts[0];
    } */

    // Metadata with the exact same modified date cannot be overwritten
    if (storageHelper.fileExist(fileName)) return context.string("Metadata instance already exists.", 400);

    const metadata = await context.body;
    storageHelper.storeXML(storageHelper.directories.METADATA, fileName, metadata);
    //storageHelper.storeXML(storageHelper.directories.METADATA, constFileName, metadata);
    lastUpdate.metadata = storageHelper.getMetadataModifiedFromFileName(fileName);

 /*    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "commit", `--author="${username}<>"`, "-a", "-m", `auto commit by ${username} at ${getDateTimeStringFromTime(fileName.split('__')[1])} (${fileName.split('__')[1]})`] }
    );
    await p1.status(); */
    
    return context.string("Metadata successfully stored.", 201);
};

export const deleteMetadata = async context => {
    const fileName = context.params.fileName;

    storageHelper.removeFile(storageHelper.directories.METADATA, fileName);
    return context.string("Metadata successfully deleted.", 201);
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

