import * as jQuery from "./libs/jquery-3.6.0.min.js"
import * as jqueryUI from "./libs/jquery-ui.min.js";

let jq = $.noConflict();
window.jq = jq;

export let loaded = false;

export default async () => {

    await loadDependencies();
    await import("./html/umlsmodal.js");
    await import("./html/iconLabelListElement.js");
    await import("./html/inputWithIcon.js");
    await import("./html/selectableDiv.js");
    await import("./helper/htmlhelper.js"); //.then(({addListenerToAddButton}) => document.addEventListener('MetadataFormLoaded', () => addListenerToAddButton()));
    loaded = true;
}

async function loadDependencies() {

    /* let script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-1.12.4.min.js";
    script.async = false;
    document.head.appendChild(script); */

    let script = document.createElement("script");
    script.src = "https://code.jquery.com/ui/1.12.1/jquery-ui.min.js";
    script.async = false;
    document.head.appendChild(script);

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/umlsplugin/css/umlsplugin.css";
    document.head.appendChild(link);

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/umlsplugin/css/jquery-ui.min.css";
    //document.head.appendChild(link);
}

export function isLoaded(){
    return loaded;
}

