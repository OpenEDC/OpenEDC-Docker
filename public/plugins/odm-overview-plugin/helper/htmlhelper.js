import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as odmOverviewTable from "../html/odm-overview-table.js"

const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

let editMode = false;

document.addEventListener('ModeEnabled', (mode) => {
    if (mode.detail == 'metadata') editMode = true;
    else editMode = false;

});

export function addOverviewOption() {
    let button = document.createElement('button');
    button.id = 'odm-overview-button';
    button.classList = 'button is-light is-link';
    button.innerText = 'ODM Overview';
    button.onclick = () => showOverviewModal();

    $('#project-modal-button').parentElement.insertBefore(button, $('#project-modal-button'));
}

function showOverviewModal() {
    showMetadataInOverview(metadataWrapper.getMetadata(), metadataWrapper.getStudyName(), editMode)
}

export function showMetadataInOverview(metadata, studyname, editable) {
    let overview = document.createElement('odm-overview-modal');
    overview.setHeading(studyname);
    overview.setData(metadata);
    overview.setIsEditable(editable);
    document.body.appendChild(overview);
    odmOverviewTable.initTable();
    odmOverviewTable.setCurrentTable('Item');
    odmOverviewTable.showCurrentTable();
}