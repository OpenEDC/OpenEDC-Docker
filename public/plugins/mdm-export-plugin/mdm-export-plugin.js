export default async () => {
    console.log("mdm export plugin found");

    await loadDependencies();
    import("./helper/htmlhelper.js").then(({addExportToMDMOptionToMenu, addMDMExportOption}) => { addExportToMDMOptionToMenu(); addMDMExportOption(); });
}

async function loadDependencies() {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "./plugins/mdm-export-plugin/css/mdm-export-plugin.css";
    document.head.appendChild(link);
}