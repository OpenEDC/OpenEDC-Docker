import * as jQuery from "./libs/jquery-3.6.0.min.js"
let jq = $.noConflict();
window.jq = jq;

export default async () => {
    console.log("mdr plugin found");

    await loadDependencies();
    import("./helper/htmlhelper.js").then(({addMdrSearchOption}) => document.addEventListener('MetadataFormLoaded', () => addMdrSearchOption()));
}

async function loadDependencies() {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/mdrplugin/css/mdrplugin.css";
    document.head.appendChild(link);

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/mdrplugin/css/bulma-tooltip.min.css";
    //document.head.appendChild(link);

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/mdrplugin/css/datatables.min.css";
    //document.head.appendChild(link);

    
}

