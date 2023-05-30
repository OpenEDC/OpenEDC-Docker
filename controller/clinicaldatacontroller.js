import * as storageHelper from "./helper/storagehelper.js";
import { rights } from "./helper/authorizationhelper.js";
import { lastUpdate } from "./statuscontroller.js";
import * as cryptoHelper from "./helper/cryptohelper.js"
import * as loggingController from "./loggingcontroller.js"
// Must match the fileNameSeparator defined in the webapp (defined in the webapp since it must work offline as well)
const fileNameSeparator = "__";

// Must match the fileNameSeparator defined in the webapp (defined in the webapp since it must work offline as well)
const dataStatusTypes = {
    EMPTY: 1,
    INCOMPLETE: 2,
    COMPLETE: 3,
    VALIDATED: 4,
    CONFLICT: 5
};

export const getSubjects = context => {
    context.response.status = 200;
    context.response.body = storageHelper.getFileNamesOfDirectory(storageHelper.directories.CLINICALDATA);
}

export const getClinicaldata = async (context, user) => {
    const fileName = context.params.fileName.replaceAll("%20", " ");

    if (user.site && user.site != getSubjectSiteFromFileName(fileName)) {
        context.response.status = 403;
        context.response.body = "You are not allowed to get clinical data from a subject that is assigned to another site than you.";
        return;
    }

    const clinicaldata = storageHelper.loadXML(storageHelper.directories.CLINICALDATA, fileName);
    context.response.status = 200;
    context.response.body = clinicaldata;
};

export const getClinicalDataRaw = async (context, user) => {
    if(storageHelper.getSetting('disableEncryption')) {
        //already decrypted
        return getClinicaldata(context, user);
    }
    const queryParams = await context.request.url.searchParams;
    if(!queryParams?.get('password')) {
        context.response.status = 400;
        context.response.body = "Missing password";
        return;
    }
    const fileName = context.params.fileName.replaceAll("%20", " ");

    if (user.site && user.site != getSubjectSiteFromFileName(fileName)) {
        context.response.status = 403;
        context.response.body = "You are not allowed to get clinical data from a subject that is assigned to another site than you.";
        return;
    }


    const clinicaldata = storageHelper.loadXML(storageHelper.directories.CLINICALDATA, fileName);
    const decryptionKey = await cryptoHelper.AES.decrypt.withPassword(user.encryptedDecryptionKey, queryParams.get('password'));
    const xmlString = await cryptoHelper.AES.decrypt.withKey(clinicaldata, decryptionKey);
    context.response.status = 200;
    context.response.body = xmlString;
    return;
};

export const setClinicaldata = async (context, user) => {
    const fileName = context.params.fileName.replaceAll("%20", " ");

    // A subject with the exact same modified date cannot be overwritten
    if (storageHelper.fileExist(fileName)) {
        context.response.status = 400;
        context.response.body = "Clinical data instance already exists.";
        return;
    }

    if (user.site && user.site != getSubjectSiteFromFileName(fileName)) {
        context.response.status = 403;
        context.response.body = "You are not allowed to set clinical data for a subject that is assigned to another site than you.";
        return;
    }

    // Users without the validate form right may not update a subject with a validated status
    const subjectKey = getSubjectKeyFromFileName(fileName);
    const existingSubject = storageHelper.getFileNamesOfDirectory(storageHelper.directories.CLINICALDATA).find(clinicaldataFileName => subjectKey == getSubjectKeyFromFileName(clinicaldataFileName));
    if (existingSubject && getSubjectStatusFromFileName(existingSubject) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) {
        context.response.status = 403;
        context.response.body = "Not authorized to change data for a validated subject.";
        return;
    }

    // Users without the validate form right may not validate a subject
    if (getSubjectStatusFromFileName(fileName) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) {
        context.response.status = 403;
        context.response.body = "Not authorized to validate a subject.";
        return;
    }

    const clinicaldata = await context.request.body().value;
    storageHelper.storeXML(storageHelper.directories.CLINICALDATA, fileName, clinicaldata);
    lastUpdate.clinicaldata = storageHelper.getClinicaldataModifiedFromFileName(fileName);

    loggingController.log([loggingController.LogEvent.EDIT, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.CLINICALDATA], `${user.username}: Edited clinicaldata file ${fileName}`);
    context.response.status = 201;
    context.response.body = "Clinicaldata successfully stored.";
};

export const deleteClinicaldata = async (context, user) => {
    const fileName = context.params.fileName.replaceAll("%20", " ");

    // Users with the ADDSUBJECTDATA right might archive an expired clinical subject data version
    // However, they need the MANAGESUBJECTS right to archive the last available version as well
    const subjectKey = getSubjectKeyFromFileName(fileName);
    let occurrences = 0;
    for (const clinicaldataFileName of storageHelper.getFileNamesOfDirectory(storageHelper.directories.CLINICALDATA)) {
        if (subjectKey == getSubjectKeyFromFileName(clinicaldataFileName)) occurrences++;
        if (occurrences > 1) break;
    }
    if (occurrences == 1 && !user.hasAuthorizationFor(rights.MANAGESUBJECTS)) {
        context.response.status = 403;
        context.response.body = "Not authorized to remove clinical data.";
        return;
    }

    // Users without the validate form right may not delete a subject with a validated status
    if (getSubjectStatusFromFileName(fileName) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) {
        context.response.status = 403;
        context.response.body = "Not authorized to remove a validated subject.";
        return;
    }

    storageHelper.removeFile(storageHelper.directories.CLINICALDATA, fileName);

    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.CLINICALDATA], `${user.username}: Deleted clinicaldata file ${fileName}`);
    context.response.status = 200;
    context.response.body = "Clinicaldata successfully deleted.";
};

function getSubjectKeyFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return fileNameParts[0];
}

export function getSubjectSiteFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return fileNameParts[1] || null;
}

function getSubjectStatusFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return fileNameParts[4] || null;
}
