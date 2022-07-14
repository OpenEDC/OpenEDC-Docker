import * as requestHelper from "./requesthelper.js"

let loadedCodes = {};

export async function getOrLoad(code) {
    if(Object.keys(loadedCodes).indexOf(code) >= 0) return loadedCodes[code];
    let meaning = await requestHelper.getUMLSData(code);
    loadedCodes[code] = meaning;
    return meaning;
}