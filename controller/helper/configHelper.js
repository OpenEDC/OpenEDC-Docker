import * as storageHelper from "./storagehelper.js";

let config;

export const init = () => {
    config = storageHelper.loadJSON(storageHelper.directories.CONFIG, "config.json");
    console.log("config");
    console.log(config);
}

export const get = key => {
    return config[key];
}