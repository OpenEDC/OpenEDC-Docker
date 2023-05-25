
import * as storageHelper from "./helper/storagehelper.js";
import * as statusController from "./statuscontroller.js";
import * as clinicalDataController from "./clinicaldatacontroller.js"
import { parse, stringify  } from "../denodependencies/xmlparser.bundle.js";
import * as cryptoHelper from "./helper/cryptohelper.js"

export const exportODMRaw = async (context, user) => {
    const queryParams = await context.request.url.searchParams;
    if(!queryParams?.get('password')) {
        context.response.status = 400;
        context.response.body = "Missing password";
        return;
    }
    const encryptionDisbled = storageHelper.getSetting('disableEncryption');
    let decryptionKey; 
    if(!encryptionDisbled) decryptionKey = await cryptoHelper.AES.decrypt.withPassword(user.encryptedDecryptionKey, queryParams.get('password'));

    let metadata = storageHelper.loadXML(storageHelper.directories.METADATA, `metadata__${statusController.lastUpdate.metadata}`);
    if(!encryptionDisbled) {
        metadata = await cryptoHelper.AES.decrypt.withKey(metadata, decryptionKey);
    }
    metadata = parse(metadata);
    const studyOID = metadata.ODM.Study["@OID"];
    const metadataVersionOID = metadata.ODM.Study.MetaDataVersion["@OID"];

    let admindata = storageHelper.loadXML(storageHelper.directories.ADMINDATA, `admindata__${statusController.lastUpdate.admindata}`);
    if(!encryptionDisbled) {
        admindata = await cryptoHelper.AES.decrypt.withKey(admindata, decryptionKey);
    }
    if(admindata) {
        admindata = parse(admindata);
        admindata.AdminData["@StudyOID"] = studyOID;
        Object.assign(metadata.ODM, admindata);
    }
    

    const clinicaldatafilenames = storageHelper.getFileNamesOfDirectory(storageHelper.directories.CLINICALDATA);
    let clinicaldataArray = [];
    clinicaldatafilenames.filter(clinicaldatafilename => {
        const site = clinicalDataController.getSubjectSiteFromFileName(clinicaldatafilename);
        if(!user.site || site == user.site) return true;
        return false;
    }).forEach(clinicaldatafilename => clinicaldataArray.push(storageHelper.loadXML(storageHelper.directories.CLINICALDATA, clinicaldatafilename)));
    if(!encryptionDisbled) {
        let clinicaldataArrayDecrpyted = [];
        for(const clinicalData of clinicaldataArray) {
            clinicaldataArrayDecrpyted.push(await cryptoHelper.AES.decrypt.withKey(clinicalData, decryptionKey));
        }
        clinicaldataArray = clinicaldataArrayDecrpyted;
    }
    if(clinicaldataArray.length > 0) {
        let clinicalDataObject = { "@StudyOID": studyOID, "@MetaDataVersionOID": metadataVersionOID, "SubjectData": [] };
        clinicaldataArray.forEach(subject => clinicalDataObject["SubjectData"].push(parse(subject).SubjectData))
        metadata.ODM["ClinicalData"] = clinicalDataObject;
    }

    metadata = stringify(metadata, { indentSize: 4 }).replace('version="1"', 'version="1.0"');

    context.response.status = 200;
    context.response.body = metadata;
}