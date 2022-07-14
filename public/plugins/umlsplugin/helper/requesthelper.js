import * as config from "../config.js"
import * as ioHelper from "../../../js/helper/iohelper.js";

export async function getMDRData(value) {
    const url = `${config.MDR_SERVER_URL}/concepts?query=${value}&apiKey=${config.MDR_APIKEY}&size=${config.MDR_SEARCH_SIZE}`;
    const result = await fetch(url, {mode: 'cors'}).catch(() => {throw new Error("No Connection to MDR")});
    return await result.json();
}

export async function getUMLSData(value) {

    let url = null;
    if(!ioHelper.serverURL)  {
         url = `${config.UMLS_SERVER_URL}/${value}`;
    }
    else {
        //url = `${ioHelper.serverURL}/api/umls?code=${value}`;
        url = `${config.UMLS_SERVER_URL}/${value}`;
    }

    const result = await fetch(url, {mode: 'cors'}).catch((error) => {throw new Error("No connection to UMLS server" + error)});
    return await result.json();
}