import * as config from "../config.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"

export let MdrSearchTypes = {}
MdrSearchTypes[ODMPath.elements.ITEM] = "items";
MdrSearchTypes[ODMPath.elements.ITEMGROUP] = "itemgroups";
MdrSearchTypes[ODMPath.elements.CODELISTITEM] = "codelistitems";

export async function getMdrData(mdrSearchType, value, onLoad) {
    const url = `${config.MDR_SERVER}/${MdrSearchTypes[mdrSearchType]}?query=${value}&apiKey=${config.apiKey}`;
    const response = await fetch(url).catch(() => {
        throw new Error('load-from-mdr-error');
    });

    if (!response.ok) {
        throw new Error('load-from-mdr-error');
    }
    onLoad(mdrSearchType, await response.text());
}