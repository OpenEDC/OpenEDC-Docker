import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as config from "../config.js"

export async function exportToMDM(userToken, predecessorModelId) {
    let url = null;
    const odm = metadataWrapper.prepareDownload();
    let formData = new FormData();
    formData.append("userToken", userToken);
    formData.append("odmFile", odm);
    formData.append("predecessorModelId", predecessorModelId);
    if(!ioHelper.serverUR || !config.useServerUrl)  {
        url = `${config.url}/upload/openedc`;
    }
    else {
        //url = `${ioHelper.serverURL}/api/pdfapi`
        url = `${config.url}/upload/openedc`;
    }
    //const response = await fetch(url, {headers: ioHelper.getHeaders(ioHelper.getLoggedInUser() ? true : false), method: 'POST', body: formData})
    const response = await fetch(url, {method: 'POST', body: formData})
    .catch(() => ioHelper.showToast("ODM file ould not be uploaded", 4000, ioHelper.interactionTypes.WARNING));
    const id = await response.text();
    if(response.ok) {
        ioHelper.showToast("ODM file has been uploaded successfully", 4000, ioHelper.interactionTypes.DEFAULT);
    }
    else {
        ioHelper.showToast("PDF could not be uploaded. Please try again later", 4000, ioHelper.interactionTypes.WARNING);
    }

    
}