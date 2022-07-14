import * as jQuery from "./libs/jquery-3.6.0.min.js"
import * as jqueryUI from "./libs/jquery-ui.min.js";

let jq = $.noConflict();
window.jq = jq;

$ = query => document.querySelector(query);
let loaded = false;

export default async() => {
    console.log("odm overview plugin found");

    await loadDependencies();
    await import ("./html/odm-overview-modal.js");
    await import ("./html/renew-codes-modal.js");
    await import ("./html/item-detail-view.js");
    await import ("./html/key-value-modal.js");
    await import ("./html/options-modal.js");
    import ("./helper/htmlhelper.js").then(({ addOverviewOption }) => addOverviewOption());
    loaded = true;
}

async function loadDependencies() {

    let script = document.createElement("script");
    script.src = "https://code.jquery.com/ui/1.12.1/jquery-ui.min.js";
    script.async = false;
    document.head.appendChild(script);

    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/odm-overview-plugin/css/odm-overview-plugin.css";
    document.head.appendChild(link);

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/odm-overview-plugin/css/jquery-ui.min.css";

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/odm-overview-plugin/css/bulma-switch.min.css";
    document.head.appendChild(link);

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/odm-overview-plugin/css/bulma-tooltip.min.css";
    document.head.appendChild(link);
}

export function isLoaded(){
    return loaded;
}