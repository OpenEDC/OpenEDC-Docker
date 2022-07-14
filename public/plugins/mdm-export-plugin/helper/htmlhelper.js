import * as config from "../config.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as ioHelper from "../../../js/helper/iohelper.js"

const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

document.addEventListener('ModeEnabled', (mode) => {
    if (mode.detail == 'metadata') $('#odm-export-button').show();
    else $('#odm-export-button').hide();

});

export function addMDMExportOption() {
    let form = getForm();
    form.classList = 'mr-2';

    let button = document.createElement('button');
    button.id = 'odm-export-button';
    button.classList = 'button is-light is-link';
    button.innerText = 'Ins MDM-Portal hochladen';
    button.hide();
    form.append(button);

    $('#project-modal-button').parentElement.insertBefore(form, $('#project-modal-button').parentElement.firstChild);
}

export function addExportToMDMOptionToMenu() {
    const lastExportButton = $('#project-modal #general-options button[i18n="export-clinicaldata"]');
    
    let form = getForm();
    form.classList = 'column is-6 p-0'

    let mdmExportButton = document.createElement('button');
    mdmExportButton.classList = 'button is-fullwidth is-small';
    mdmExportButton.onclick = () => uploadToMDMPortal();
    mdmExportButton.innerText = 'Ins MDM-Portal hochladen';
    mdmExportButton.id = 'menu-mdm-export-button'
    form.appendChild(mdmExportButton);

    lastExportButton.parentElement.appendChild(form);
}

function getForm() {
    const predecessorModelId = sessionStorage.getItem("predecessorModelId");

    let form = document.createElement('form');
    form.action = config.url + '/ODMEdit/upload/openedc';
    form.method = 'post';
    form.target = "_blank";
    form.enctype = "multipart/form-data";

    let inputUserToken = document.createElement('input');
    inputUserToken.type = 'text';
    inputUserToken.name = 'userToken';
    inputUserToken.id = 'userToken';
    inputUserToken.hide();
    form.append(inputUserToken);

    let inputPredecessorModelId;

    if(predecessorModelId && typeof predecessorModelId != 'undefined'){
        inputPredecessorModelId = document.createElement('input');
        inputPredecessorModelId.type = 'text';
        inputPredecessorModelId.name = 'predecessorModelId';
        inputPredecessorModelId.id = 'predecessorModelId';
        inputPredecessorModelId.hide();
        form.append(inputPredecessorModelId);

    }
    
    let inputOdmFile = document.createElement('input');
    inputOdmFile.type = 'file';
    inputOdmFile.name = 'odmFile';
    inputOdmFile.id = 'odmFile';
    inputOdmFile.hide();
    form.append(inputOdmFile);

    form.addEventListener('submit', (e) => uploadToMDMPortal(e, form, inputUserToken, inputPredecessorModelId, inputOdmFile));

    return form;
}


function uploadToMDMPortal(e, form, inputUserToken, inputPredecessorModelId, inputOdmFile) {
    e.preventDefault();
    e.stopImmediatePropagation();

   

    const userToken = sessionStorage.getItem("mdmUserToken");
    const predecessorModelId = sessionStorage.getItem("predecessorModelId");

    if(!userToken || typeof userToken == 'undefined') {
        ioHelper.showMessage('Not logged in to MDM-Portal', 'It seems you did not access this page via the MDM-Portal. You have to open OpenEDC from the edit page to upload modals.', 
        {
            ['To MDM-Portal']: () => openMDMPortal(),
        }
        )
        return;
    }

    let odm = new XMLSerializer().serializeToString(metadataWrapper.prepareDownload());
    inputUserToken.value = userToken;
    if(predecessorModelId && typeof predecessorModelId != 'undefined') inputPredecessorModelId.value = predecessorModelId;
    odm = ioHelper.prettifyContent(odm);

    let file = new File([odm], "odmFile.xml",{type:"text/xml", lastModified:new Date().getTime()});
    let container = new DataTransfer();
    container.items.add(file);
    inputOdmFile.files = container.files;

    form.submit();
}

function openMDMPortal() {
    window.open(config.url);
}