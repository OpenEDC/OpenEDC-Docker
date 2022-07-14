import { lastUpdate } from "../statuscontroller.js";

// Must match the fileNameSeparator defined in the webapp (defined in the webapp since it must work offline as well)
const fileNameSeparator = "__";

export let directories;

export const init = (instance, odmId) => {
    // Set file storage directories
    const root = instance ? "./data_" + instance : "./data";
    directories = {
        ROOT: root + "/",
        METADATA: root + "/metadata/",
        ADMINDATA: root + "/admindata/",
        CLINICALDATA: root + "/clinicaldata/",
        MISC: root + "/misc/",
        ARCHIVE: root + "/archive/"
    }

    // Ensures that all directories exist
    Array.from(Object.values(directories)).forEach(directory => {
        try {
            Deno.mkdirSync(directory);
        } catch {}
    });

    // Get the last updated date for metadata, admindata, and clinicaldata
    lastUpdate.metadata = getFileNamesOfDirectory(directories.METADATA).reduce((lastUpdated, fileName) => {
        const modifiedDate = getMetadataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    lastUpdate.admindata = getFileNamesOfDirectory(directories.ADMINDATA).reduce((lastUpdated, fileName) => {
        const modifiedDate = getAdmindataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    lastUpdate.clinicaldata = getFileNamesOfDirectory(directories.CLINICALDATA).reduce((lastUpdated, fileName) => {
        const modifiedDate = getClinicaldataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    
    if(lastUpdate.metadata == 0 && odmId) {
        loadFromMDMPortal(odmId);
    }
}

export const storeJSON = (directory, fileName, data) => {
    Deno.writeTextFileSync(directory + fileName, JSON.stringify(data, null, 2));
}

export const loadJSON = (directory, fileName) => {
    try {
        return JSON.parse(Deno.readTextFileSync(directory + fileName));
    } catch {}
}

export const storeXML = (directory, fileName, data) => {
    Deno.writeTextFileSync(directory + fileName, data);
}

export const loadXML = (directory, fileName) => {
    return Deno.readTextFileSync(directory + fileName);
}

export const removeFile = (directory, fileName) => {
    try {
        Deno.renameSync(directory + fileName, directories.ARCHIVE + fileName);
    } catch {}
}

export const fileExist = (directory, fileName) => {
    try {
        return Deno.readTextFileSync(directory + fileName) ? true : false;
    } catch {}
}

export function getFileNamesOfDirectory(directory) {
    const fileNames = [];
    for (const file of Deno.readDirSync(directory)) {
        fileNames.push(file.name);
    }

    return fileNames;
}

export function getMetadataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[1]) || null;
}

export function getAdmindataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[1]) || null;
}

export function getClinicaldataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[3]) || null;
}

async function loadFromMDMPortal(odmId) {
    const response = await fetch(`http://localhost:8080/api/v1/odmFree?modelId=${odmId}`);
    if (!response.ok) throw response.status;
    
    const odmXMLString = await response.text();
    //const odmXMLString = prepareODM(odmId, await response.text());
    let fileName = `metadata__${new Date().getTime()}`;
    storeXML(directories.METADATA, fileName, odmXMLString);
    lastUpdate.metadata = getMetadataModifiedFromFileName(fileName);
    
}

// Depending on the repository, prepare the downloaded ODM for further processing
const prepareODM = (modelParameter, odmXMLString) => {
    // The Portal of Medical Data Models often simply uses "ODM" as StudyEvent name which is therefore replaced with the study name for legibility
    // If there is more than one study event, the study name is appended
    // Moreover, the portal includes the model's id as study name prefix which is removed first
    const odm = new DOMParser().parseFromString(odmXMLString, "text/xml");
    const studyName = odm.querySelector("StudyName").textContent.replace(modelParameter + "_", "");
    odm.querySelector("StudyName").textContent = studyName;

    const studyEventDefs = odm.querySelectorAll("MetaDataVersion StudyEventDef");
    if (studyEventDefs.length == 1) studyEventDefs[0].setAttribute("Name", studyName);
    else studyEventDefs.forEach(studyEventDef => studyEventDef.setAttribute("Name", studyEventDef.getName() + " - " + studyName));

    odmXMLString = new XMLSerializer().serializeToString(odm);


    return odmXMLString;
}
