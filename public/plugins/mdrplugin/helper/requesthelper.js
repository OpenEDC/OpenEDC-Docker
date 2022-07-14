import * as config from "../config.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"

export let MdrSearchTypes = {}
MdrSearchTypes[ODMPath.elements.ITEM] = "items";
MdrSearchTypes[ODMPath.elements.ITEMGROUP] = "itemgroups";
MdrSearchTypes[ODMPath.elements.CODELISTITEM] = "codelistitems";

export async function getMdrData(mdrSearchType, value, onLoad) {
    return new Promise((resolve, reject) => {
        const http = new XMLHttpRequest();
        const url = `${config.MDR_SERVER}/${MdrSearchTypes[mdrSearchType]}?query=${value}&apiKey=${config.apiKey}`;
        http.open("GET", url);
        http.onload = async (e) => {
            if(http.status === 200) {
                await onLoad(mdrSearchType, http.responseText);
                resolve();
            }
            else {
                reject();
            }
        }
        http.onerror = (e) => {
            reject();
        }
        http.send();
    })
}