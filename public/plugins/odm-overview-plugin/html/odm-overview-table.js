import * as languageHelper from "../../../js/helper/languagehelper.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as metadataModule from "../../../js/metadatamodule.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"
import * as htmlElements from "../../../js/helper/htmlelements.js"
import * as odmHelper from "../helper/odm-helper.js"
import * as baseElements from "./base-elements.js"
import * as codeEditWidget from "./code-edit-widget.js"
import * as codelistEditWidget from "./codelist-edit-widget.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as codeCache from "../helper/codeCache.js"
import * as optionsHelper from "../helper/optionsHelper.js";
import * as utilHelper from "../helper/utilHelper.js"

const $$ = query => document.querySelectorAll(query);
let $m;
let $$m;

const elementValueOptions = {
    'NAME': 0, 
    'QUESTION': 1, 
    'DESCRIPTION': 2, 
    'CODES': 3, 
    'DATA_TYPE': 4, 
    'MEASUREMENT_UNIT': 5, 
    'MANDATORY': 6, 
    'REPEATING': 7, 
    'ODM_VERSION': 8,
    'ODM_DESCRIPTION': 9,
    'EMPTY': 99
};

const odmVersions = {
    '1_3': "1.3",
    '1_3_1': "1.3.1",
    '1_3_2': "1.3.2"
};

let divTableContainer;
let theadDiv;
let selectedStudyEventOID;
let selectedFormOID;
let studyEventSelect;
let formSelect;
let divSelectSEContainer;
let divSelectFormsContainer;
let tableContainer;
let tableNames = ['Item', 'ItemGroup', 'Form'];
let tables = {};
let currentTable;
let prevDiv;
let prevDivLableDiv;
let prevDivLableDiv2;
let nextDiv;
let nextDivLableDiv;
let nextDivLableDiv2;
let bulkEditView;
let codeEditView;
let codelistEditView;
let stickGroupLabel;
let isEditMode;

let prevPath;
let currentDragPath;

let labelsCountSelected = {};
let countElementsSelected = 0;

let metadata;


let editOptions = {
    BULK_EDIT: "bulk-edit",
    CODES_EDIT: "codes-edit",
    CODELISTS_EDIT: "codelists-edit",
    UPDATE_CODES: "update-codes"
}

let currentMode;
let optionsMap = { 
    'item': [editOptions.BULK_EDIT, editOptions.CODES_EDIT, editOptions.CODELISTS_EDIT, editOptions.UPDATE_CODES], 
    'itemgroup': [editOptions.CODES_EDIT, editOptions.UPDATE_CODES], 
    'form': [editOptions.CODES_EDIT, editOptions.UPDATE_CODES] 
}

let buttons = { 
    'BULK_EDIT': '#odm-overview-button-bulk', 
    'CODES_EDIT': '#odm-overview-button-edit-codes', 
    'CODELIST_EDIT': '#odm-overview-button-edit-codelists', 
    'UPDATE_CODES' : '#odm-overview-button-update-codes',
    'FIX_ODM': '#odm-overview-button-fix-odm',
    'SORT_ODM': '#odm-overview-button-sort-odm',
    'EDIT_METADATA': "#odm-overview-button-edit-metadata"};

let colors = ['green', 'orange', 'blue', 'red', 'black', 'blueviolet', 'lightseagreen']

function setMetadata(value) {
    metadata = value;
}

export function getODMOverview(metadata, isEdit) {
    setMetadata(metadata);
    isEditMode = isEdit;
    $m = query => metadata.querySelector(query);
    $$m = query => metadata.querySelectorAll(query);

    let div = document.createElement("div");
    div.classList = 'is-fullheight';

    let divSelectContainer = document.createElement("div");
    divSelectContainer.classList = 'box columns';
    div.appendChild(divSelectContainer);
    fillSelectContainer(divSelectContainer);

    divTableContainer = document.createElement("div");
    divTableContainer.classList = 'box columns mt-1 p-3 has-text-left';
    divTableContainer.id = 'odm-overview-table-box';
    div.appendChild(divTableContainer);
    addArrowsAndTableContainer();
    return div;
}

export function initTable() {
    if (isEditMode) {
        addListenersToButtons();
        odmHelper.init();
    }
}

export function setCurrentTable(ct) {
    currentTable = ct;
}

function fillSelectContainer(divSelectContainer) {
    let divLeftSide = document.createElement('div');
    divLeftSide.classList = 'column is-half columns is-gapless m-0 p-0';
    divSelectContainer.append(divLeftSide);
    let divRightSide = divLeftSide.cloneNode(true);
    divRightSide.classList.add('is-flex-center')
    divSelectContainer.append(divRightSide);

    let labelStudyEvent = document.createElement("label");
    labelStudyEvent.classList = 'column is-narrow label is-link  mr-2';
    labelStudyEvent.innerText = "StudyEvents:";

    let labelForms = document.createElement("label");
    labelForms.classList = 'column is-narrow label is-link  mr-2';
    labelForms.innerText = "Forms:";

    divSelectSEContainer = document.createElement('div');
    divSelectSEContainer.classList = 'columns is-gapless column is-half pt-0 pb-0 is-flex-center has-text-left mb-0';
    divLeftSide.appendChild(divSelectSEContainer);

    divSelectSEContainer.appendChild(labelStudyEvent)
    let seSelectOrLable = getStudyEventSelect();
    seSelectOrLable.classList.add('column', 'mr-3', 'is-clipped')
    divSelectSEContainer.appendChild(seSelectOrLable);

    divSelectFormsContainer = document.createElement('div');
    divSelectFormsContainer.classList = 'columns is-gapless column is-half pt-0 pb-0 is-flex-center has-text-left mb-0';
    divLeftSide.appendChild(divSelectFormsContainer);

    divSelectFormsContainer.appendChild(labelForms);
    let fSelectOrLable = getFormSelect();
    fSelectOrLable.classList.add('column', 'mr-3', 'is-clipped')
    divSelectFormsContainer.appendChild(fSelectOrLable);

    let spacingDiv = document.createElement('div');
    spacingDiv.classList = 'column mb-0';
    divRightSide.appendChild(spacingDiv);

    let optionsButtonDiv = document.createElement('div');
    optionsButtonDiv.classList = 'field column is-narrow is-flex-center mr-2';
    let optionsButton = document.createElement('button');
    optionsButton.onclick = () => showOptionsModal();
    optionsButton.classList = 'button is-rounded is-link is-inverted'
    let span = document.createElement('span');
    span.classList = 'icon';
    let i = document.createElement('i');
    i.classList = 'fa-solid fa-bars hover-icon';
    span.appendChild(i);
    optionsButton.appendChild(span);
    optionsButtonDiv.appendChild(optionsButton);
    divRightSide.appendChild(optionsButtonDiv);
}

function showOptionsModal() {
    let currentTableIndex = tableNames.indexOf(currentTable);
    currentTableIndex = (currentTableIndex + 1 + tableNames.length) % tableNames.length;
    let data = [];
    data.push({id: 'use-colors-switch', text: 'Color UMLS contexts', state:'use-colors-state', callback: optionsHelper.toggleUseColorsState});
    data.push({id: 'stick-group-switch', text: `Stick ${tableNames[currentTableIndex].toLowerCase()} to top`, state: 'stick-group-state', callback: optionsHelper.toggleStickGroupState});
    data.push({id: 'expand-items-switch', text: 'Expand all items', state: 'expand-items-state', callback: optionsHelper.toggleItemExpandState});

    let modal = document.createElement('options-modal');
    modal.setHeading('Options');
    modal.setIsEditable(isEditMode);
    modal.setData(data);

    document.body.appendChild(modal);
}

function getStudyEventSelect() {
    let div1 = document.createElement("div");
    div1.classList = "control has-icons-left";
    let div2 = document.createElement("div");
    div2.classList = "select";
    div1.appendChild(div2);

    studyEventSelect = document.createElement("select");
    studyEventSelect.addEventListener("change", function(e) {
        selectedStudyEventOID = e.target.options[e.target.selectedIndex].oid;
        fillFormSelect();
        showCurrentTable();
    });
    div2.appendChild(studyEventSelect);

    fillStudyEventSelect();
    return div1;
}

function fillStudyEventSelect() {
    while (studyEventSelect.options.length) studyEventSelect.remove(0);

    const studyEvents = [...$$m("StudyEventDef")];

    studyEvents.forEach(se => {
        let option = document.createElement("option");
        option.oid = se.getAttribute("OID");
        option.innerText = se.getAttribute("Name");
        studyEventSelect.appendChild(option);
    });
    if(studyEvents[0]) selectedStudyEventOID = studyEvents[0].getAttribute("OID");
    else selectedStudyEventOID = -1;
}

function getFormSelect() {
    let div1 = document.createElement("div");
    div1.classList = "control has-icons-left";
    let div2 = document.createElement("div");
    div2.classList = "select";
    div1.appendChild(div2);

    formSelect = document.createElement("select");
    formSelect.addEventListener("change", function(e) {
        selectedFormOID = e.target.options[e.target.selectedIndex].oid;
        showCurrentTable();
    });
    div2.appendChild(formSelect);
    fillFormSelect();

    return div1;
}

function fillFormSelect() {
    while (formSelect.options.length) formSelect.remove(0);
    if(selectedStudyEventOID < 0) {
        selectedFormOID = -1;
        return;
    }
    const formsArray = $$m(`[OID="${selectedStudyEventOID}"] FormRef`);
    let formDefs = [];
    formsArray.forEach(fr => {
        let formOID = fr.getAttribute("FormOID");
        let formDef = $m(`[OID="${formOID}"]`);
        if (formDef) formDefs.push(formDef);
    })
    formDefs.forEach(f => {
        let option = document.createElement("option");
        option.oid = f.getAttribute("OID");
        option.innerText = f.getAttribute("Name");
        formSelect.appendChild(option);
    });
    if(formsArray.length > 0)
        selectedFormOID = formsArray[0].getAttribute("FormOID");
    else
        selectedFormOID = -1;
}

function addArrowsAndTableContainer() {
    prevDiv = document.createElement('div');
    prevDiv.id = 'prevDiv';
    prevDiv.classList = 'column is-vertical-center has-background-link-light-active is-narrow';
    prevDivLableDiv = document.createElement('label');
    prevDivLableDiv.classList = 'is-vertical-left label mb-0';
    prevDivLableDiv.innerText = 'next';
    prevDiv.appendChild(prevDivLableDiv);
    let prev = document.createElement("i");
    prev.id = 'Prev';
    prev.classList = 'fa fa-arrow-left fa-15x mb-2 mt-2'
    prev.ariaHidden = true;
    prevDiv.appendChild(prev);
    prevDivLableDiv2 = document.createElement('label');
    prevDivLableDiv2.classList = 'is-vertical-left label';
    prevDivLableDiv2.innerText = 'next';
    prevDiv.appendChild(prevDivLableDiv2);
    divTableContainer.appendChild(prevDiv);

    tableContainer = document.createElement("div");
    tableContainer.id = 'odm-overview-table-div';
    tableContainer.classList = 'column p-0 has-header-color has-overflow-y has-scrollbar-link' //'is-flex-grow';
    divTableContainer.appendChild(tableContainer);

    nextDiv = document.createElement('div');
    nextDiv.classList = 'column is-vertical-center has-background-link-light-active is-narrow';
    nextDiv.id = 'nextDiv';
    nextDivLableDiv = document.createElement('label');
    nextDivLableDiv.classList = 'is-vertical-right label mb-0';
    nextDivLableDiv.innerText = 'next';
    nextDiv.appendChild(nextDivLableDiv);
    let next = document.createElement("i");
    next.id = 'Next';
    next.classList = 'fa fa-arrow-right fa-15x mb-2 mt-2'
    next.ariaHidden = true;
    nextDiv.appendChild(next);
    nextDivLableDiv2 = document.createElement('label');
    nextDivLableDiv2.classList = 'is-vertical-right label';
    nextDivLableDiv2.innerText = 'next';
    nextDiv.appendChild(nextDivLableDiv2);
    divTableContainer.appendChild(nextDiv);

    jq(prev).click(function() {
        let currentTableIndex = tableNames.indexOf(currentTable);
        currentTableIndex = (currentTableIndex - 1 + tableNames.length) % tableNames.length;
        currentTable = tableNames[currentTableIndex];
        showCurrentTable();
    });

    jq(next).click(function() {
        let currentTableIndex = tableNames.indexOf(currentTable);
        currentTableIndex = (currentTableIndex + 1) % tableNames.length;
        currentTable = tableNames[currentTableIndex];
        showCurrentTable();
    });
}

function fillLables() {
    let currentTableIndex = tableNames.indexOf(currentTable);
    currentTableIndex = (currentTableIndex - 1 + tableNames.length) % tableNames.length;
    let previousLabelText = tableNames[currentTableIndex];
    prevDivLableDiv.innerText = previousLabelText;
    prevDivLableDiv2.innerText = previousLabelText;

    currentTableIndex = (currentTableIndex + 2) % tableNames.length;
    let nextLabelText = tableNames[currentTableIndex];
    nextDivLableDiv.innerText = nextLabelText;
    nextDivLableDiv2.innerText = nextLabelText;
}

export function showCurrentTable() {
    switch (currentTable) {
        case 'Item':
            //createItemViewTable();
            createItemViewTableAlternative();
            break;
        case 'ItemGroup':
            createItemGroupViewTableAlternative()
            break;
        case 'Form':
            createFormViewTableAlternative();
            break;
        default:
            return;
    }
    fillLables();
    countElementsSelected = 0;
    updateCountSelected();
}

function addTableHeaders(theadDiv, headers) {
    let trDiv = document.createElement("div");
    trDiv.classList = 'columns column is-full mb-0'
    theadDiv.appendChild(trDiv);
    headers.forEach(h => {
        let th = document.createElement("div");
        th.innerText = h.term;
        th.classList = `column ${h.space} has-text-weight-bold`; //h.space
        trDiv.appendChild(th)
    })
}

async function onDrop(event, ui, copy) {
    let elementTypeOnDrag = ui.item.prop('elementType')
    const ctrlPressed = event.ctrlKey;
    const shiftPressed = event.shiftKey;

    //Return if position did not change and neither modifier key is pressed
    if ((
            (prevPath.last.element != currentDragPath.last.element && typeof ui.item.prev().prop('oid') == 'undefined') && prevPath.last.value == ui.item.parent().prop('oid') ||
            prevPath.last.value == ui.item.prev().prop('oid')
        ) && !ctrlPressed && !shiftPressed) return;


    const nextElement = ui.item.next();

    let newParentPath;
    let nextSiblingPath;
    switch (elementTypeOnDrag) {
        case ODMPath.elements.ITEM:
            newParentPath = new ODMPath(selectedStudyEventOID, selectedFormOID, ui.item.parent().prop('oid'), null);
            nextSiblingPath = new ODMPath(selectedStudyEventOID, selectedFormOID, ui.item.parent().prop('oid'), nextElement.length > 0 ? ui.item.next().prop('oid') : null);
            break;
        case ODMPath.elements.ITEMGROUP:
            newParentPath = new ODMPath(selectedStudyEventOID, ui.item.parent().prop('oid'), null, null);
            nextSiblingPath = new ODMPath(selectedStudyEventOID, ui.item.parent().prop('oid'), nextElement.length > 0 ? ui.item.next().prop('oid') : null, null);
            break;
        case ODMPath.elements.FORM:
            newParentPath = new ODMPath(ui.item.parent().prop('oid'), null, null, null);
            nextSiblingPath = new ODMPath(ui.item.parent().prop('oid'), nextElement.length > 0 ? ui.item.next().prop('oid') : null, null, null);
        default:
            break;
    }


    /*
    if (currentDragPath.previous.value != targetPath.previous.value) {
        // Extra if-statement for performance reasons (do not load all subjects when sourceParentOID and targetParentOID are equal)
        const subjectKeys = await clinicaldataWrapper.getSubjectsHavingDataForElement(elementTypeOnDrag, currentDragPath);
        if (subjectKeys.length) {
            ioHelper.showMessage(languageHelper.getTranslation("error"), languageHelper.getTranslation("element-not-moved-error"));
            return;
        }
    }*/


    let sourceElementRef = null;
    let targetElementRef = null;
    if (elementTypeOnDrag == ODMPath.elements.CODELISTITEM) {
        const codeListOID = metadataWrapper.getCodeListOIDByItem(currentDragPath.itemOID);
        sourceElementRef = metadataWrapper.getCodeListItem(codeListOID, currentDragPath.codeListItem);
    } else {
        sourceElementRef = metadataWrapper.getElementRefByOID(elementTypeOnDrag, currentDragPath);
    }

    if (sourceElementRef == null) return;

    /* if (newParentPath.last.element == elementTypeOnDrag) {
        if (elementTypeOnDrag == ODMPath.elements.CODELISTITEM) {
            const codeListOID = metadataWrapper.getCodeListOIDByItem(newParentPath.itemOID);
            targetElementRef = metadataWrapper.getCodeListItem(codeListOID, newParentPath.codeListItem);
        } else {
            targetElementRef = metadataWrapper.getElementRefByOID(elementTypeOnDrag, newParentPath);
        }
    } else { */
    targetElementRef = metadataWrapper.getElementRefByOID(newParentPath.last.element, newParentPath);
    //}
    let targetElementDef;
    switch (targetElementRef.nodeName) {
        case 'ItemGroupRef':
            targetElementDef = metadataWrapper.getElementDefByOID(targetElementRef.getAttribute('ItemGroupOID'));
            break;
        case 'FormRef':
            targetElementDef = metadataWrapper.getElementDefByOID(targetElementRef.getAttribute('FormOID'));
            break;
        case 'StudyEventRef':
            targetElementDef = metadataWrapper.getElementDefByOID(targetElementRef.getAttribute('StudyEventOID'));
            break;
        default:
            break;
    }

    let updateTable = false;
    if (ctrlPressed)
        updateTable = odmHelper.copyElement(true, currentDragPath, targetElementDef, nextSiblingPath, elementTypeOnDrag, currentDragPath)
    else if (shiftPressed)
        updateTable = odmHelper.copyElement(false, currentDragPath, targetElementDef, nextSiblingPath, elementTypeOnDrag, currentDragPath)
    else
        odmHelper.moveElement(targetElementDef, sourceElementRef, nextSiblingPath, elementTypeOnDrag);

    if (updateTable) showCurrentTable();
    /* else {
           // Allows the movement of an element into an empty parent element by dropping it on the add button
           if (elementTypeOnDrag == ODMPath.elements.STUDYEVENT) metadataWrapper.insertStudyEventRef(sourceElementRef);
           else if (elementTypeOnDrag == ODMPath.elements.FORM) metadataWrapper.insertFormRef(sourceElementRef, targetPath.studyEventOID);
           else if (elementTypeOnDrag == ODMPath.elements.ITEMGROUP) metadataWrapper.insertItemGroupRef(sourceElementRef, targetPath.formOID);
           else if (elementTypeOnDrag == ODMPath.elements.ITEM) metadataWrapper.insertFormRef(sourceElementRef, targetPath.itemGroupOID);
           else if (elementTypeOnDrag == ODMPath.elements.CODELISTITEM) metadataWrapper.insertCodeListItem(sourceElementRef, metadataWrapper.getCodeListOIDByItem(targetPath.itemOID));
       } */

    //elementTypeOnDrag = null;

}

function adjustSelectContainer() {
    switch (currentTable) {
        case 'Item':
            divSelectSEContainer.show();
            divSelectFormsContainer.show();
            break;
        case 'ItemGroup':
            divSelectSEContainer.show();
            divSelectFormsContainer.hide();
            break;
        default:
            break;
    }
}

function addListenersToButtons() {
    $('#odm-overview-button-bulk').onclick = () => showBulkEdit();
    $('#odm-overview-button-edit-codes').onclick = () => showCodeEdit();
    $('#odm-overview-button-edit-codelists').onclick = () => showCodelistEdit();
    $('#odm-overview-button-edit-metadata').onclick = () => editMetadata();
    $('#odm-overview-button-update-codes').onclick = () => showRenewCodesModal();
    $('#odm-overview-button-fix-odm').onclick = () => fixODM();
    $('#odm-overview-button-sort-odm').onclick = () => reorderODM();
}

function hideOtherEditWindows() {
    optionsMap[currentMode].forEach(m => {
        switch (m) {
            case editOptions.BULK_EDIT:
                hideBulkEdit();
                break;
            case editOptions.CODES_EDIT:
                hideCodeEdit();
                break;
            case editOptions.CODELISTS_EDIT:
                hideCodelistEdit();
                break;
        }
    })
}

function showBulkEdit() {
    hideOtherEditWindows();
    $(buttons.BULK_EDIT).disabled = true;
    prevDiv.hide();
    nextDiv.hide();
    showIconElements(false);
    bulkEditView.show();
    showCheckboxes(true);
}

function hideBulkEdit() {
    $(buttons.BULK_EDIT).disabled = false;
    prevDiv.show();
    nextDiv.show();
    showIconElements(true);
    bulkEditView.hide();
    showCheckboxes(false);
}

function showCodeEdit() {
    hideOtherEditWindows();
    $(buttons.CODES_EDIT).disabled = true;
    prevDiv.hide();
    nextDiv.hide();
    showIconElements(false);
    codeEditView.show();
    showCheckboxes(true);
    codeEditWidget.enableAutoComplete(codeEditView.editType);
}

function hideCodeEdit() {
    $(buttons.CODES_EDIT).disabled = false;
    prevDiv.show();
    nextDiv.show();
    showIconElements(true);
    codeEditView.hide();
    showCheckboxes(false);
}

function showCodelistEdit() {
    hideOtherEditWindows();
    $(buttons.CODELIST_EDIT).disabled = true;
    prevDiv.hide();
    nextDiv.hide();
    showIconElements(false);
    codelistEditView.show();
    showCheckboxes(true);
    codelistEditWidget.enableAutoComplete();
}

function hideCodelistEdit() {
    $(buttons.CODELIST_EDIT).disabled = false;
    prevDiv.show();
    nextDiv.show();
    showIconElements(true);
    codelistEditView.hide();
    showCheckboxes(false);
}

function showIconElements(show) {
    let elements = $$('.move-icon');
    if(show) [...elements].forEach(e => e.show())
    else [...elements].forEach(e => e.hide())

    elements = $$('.detail-icon');
    if(show) [...elements].forEach(e => e.show())
    else [...elements].forEach(e => e.hide())
}

function showCheckboxes(show) {
    if (show) {
        $$('.odm-overview-checkbox').forEach(cb => {
            cb.classList.remove('odm-overview-is-hidden');
            cb.disabled = false;
            if (cb.checked && cb.hierarchyLevel !== "checkbox-group") cb.closest('.itemrow').classList.add("has-background-link-light-active");
        });
    } else {
        $$('.odm-overview-checkbox').forEach(cb => {
            cb.classList.add('odm-overview-is-hidden');
            cb.disabled = true;
            if (cb.checked && cb.hierarchyLevel !== "checkbox-group") cb.closest('.itemrow').classList.remove("has-background-link-light-active");
        });
    }

}

function createBulkEditView() {
    if (bulkEditView && divTableContainer.contains(bulkEditView)) divTableContainer.removeChild(bulkEditView);
    let bulkEditWidget = baseElements.getBasicSideView('bulk-edit-view', updateElements, hideBulkEdit);
    bulkEditView = bulkEditWidget.view;
    divTableContainer.appendChild(bulkEditView);
    labelsCountSelected['bulk-edit-view'] = bulkEditWidget.labelSelected;
    updateCountSelected();
    hideBulkEdit();

    const translatedDataTypes = Object.values(metadataWrapper.dataTypes).map(type => languageHelper.getTranslation(type));
    const dataTypeSelect = htmlElements.getSelect("datatype-select", true, true, Object.values(metadataWrapper.dataTypes), null, translatedDataTypes, true);
    dataTypeSelect.id = 'odm-overview-datatype-select';
    bulkEditView.appendChild(getSelectWrapper(languageHelper.getTranslation('data-type'), dataTypeSelect, 'datatype-select', true));


    const translatedMandatoryTypes = Object.values(metadataWrapper.mandatoryTypes).map(option => languageHelper.getTranslation(option.toLowerCase()));
    const mandatoryTypeSelect = htmlElements.getSelect("mandatory-select", true, true, Object.values(metadataWrapper.mandatoryTypes), null, translatedMandatoryTypes, true);
    mandatoryTypeSelect.id = 'odm-overview-mandatory-select'
    bulkEditView.appendChild(getSelectWrapper(languageHelper.getTranslation('mandatory'), mandatoryTypeSelect, 'mandatory-select', true));

    let measurementUnitInput = document.createElement('input');
    measurementUnitInput.classList = 'input';
    measurementUnitInput.type = 'text';
    measurementUnitInput.id = 'odm-overview-measurement-unit';
    measurementUnitInput.autocomplete = 'off';
    measurementUnitInput.i18nPh = 'symbol';
    measurementUnitInput.placeholder = 'Symbol'
    bulkEditView.appendChild(getInputWrapper(languageHelper.getTranslation('measurement-unit'), measurementUnitInput, 'measurement-type', true));

    let formalExpressionInput = document.createElement('input');
    formalExpressionInput.classList = 'input';
    formalExpressionInput.type = 'text';
    formalExpressionInput.id = 'odm-overview-formal-expression';
    formalExpressionInput.autocomplete = 'off';
    formalExpressionInput.i18nPh = 'formal-expression';
    formalExpressionInput.placeholder = 'Formaler Ausdruck';
    bulkEditView.appendChild(getInputWrapper(languageHelper.getTranslation('formal-expression'), formalExpressionInput, 'formal-expression', true));
}

function getSelectWrapper(labelText, select, identifier, addCheckbox) {
    select.querySelector('select').editIdentifier = identifier;
    select.querySelector('select').id = `odm-overview-${select.querySelector('select').id}`;
    let divField = document.createElement('div');
    divField.classList = 'field';

    let label = document.createElement('label');
    label.classList = 'label';
    if (addCheckbox) {
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox';
        checkbox.classList = 'bulk-edit-checkbox mr-1'
        label.appendChild(checkbox);
    }
    label.appendChild(document.createTextNode(labelText));
    divField.appendChild(label);
    divField.appendChild(select);
    return divField;
}

function getInputWrapper(labelText, input, identifier, addCheckbox) {
    input.editIdentifier = identifier;
    let divField = document.createElement('div');
    divField.classList = 'field';

    let label = document.createElement('label');
    label.classList = 'label';
    if (addCheckbox) {
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox';
        checkbox.classList = 'bulk-edit-checkbox mr-1'
        label.appendChild(checkbox);
    }
    label.appendChild(document.createTextNode(labelText));
    divField.appendChild(label);
    let divControl = document.createElement('div');
    divControl.classList = 'control has-auto-complete-bottom';
    divField.appendChild(divControl);
    divControl.appendChild(input)
    return divField;
}

function updateCountSelected() {
    Object.values(labelsCountSelected).forEach(l => l.innerText = countElementsSelected);
}

export function updateItem(item, check) {
    let value = item.innerText;
    let oid = item.closest('.itemrow')?.oid;
    let poid = item.closest('.itemrow')?.poid;
    switch (item.editType) {
        case elementValueOptions.NAME:
            metadataWrapper.setElementName(oid, value);
            break;
        case elementValueOptions.DESCRIPTION:
            metadataWrapper.setElementDescription(oid, value);
            break;
        case elementValueOptions.QUESTION:
            metadataWrapper.setItemQuestion(oid, value);
            break;
        case elementValueOptions.MEASUREMENT_UNIT:
            if (odmHelper.saveMeasurementUnitPreCheck(new ODMPath(selectedStudyEventOID, selectedFormOID, poid, oid), value, check, false)) return;
            break;
        case elementValueOptions.ODM_DESCRIPTION:
            $m('ODM').setAttribute('Description', value);
            break;
    }
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
    metadataModule.reloadTree();
}

export function updateSelect(oid, value, type){
    switch(type) {
        case elementValueOptions.DATA_TYPE:
            odmHelper.handleItemDataType(oid, value);
            break;
        case elementValueOptions.ODM_VERSION:
            $m('ODM').setAttribute('ODMVersion', value);
            break;
    }
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}

export function updateElements(check) {
    const updateRows = [...$$('.odm-overview-checkbox')].filter(cb => cb.checked && [...cb.closest('.odm-overview-row').classList].indexOf('itemrow') >= 0).map(cb => cb.closest('.itemrow'));
    for (let i = 0; i < updateRows.length; i++) {
        let ur = updateRows[i];
        let oid = ur.oid;
        let igOID = ur.closest('.connectedSortable').oid;
        let path = new ODMPath(selectedStudyEventOID, selectedFormOID, igOID, oid);
        let toBeEdited = [...$$('.bulk-edit-checkbox')].filter(cb => cb.checked).map(cb => cb.closest('.field'));
        for (let j = 0; j < toBeEdited.length; j++) {
            let tbe = toBeEdited[j]
            let select = tbe.querySelector("select");
            let inputElement = tbe.querySelector("input.input");
            let value;
            let identifier;
            if (select) {
                identifier = select.editIdentifier;
                value = [...select.querySelectorAll("option")].find(o => o.selected).value;
            }
            if (inputElement) {
                identifier = inputElement.editIdentifier
                value = inputElement.value;
            }
            switch (identifier) {
                case 'datatype-select':
                    odmHelper.handleItemDataType(oid, value);
                    break;
                case 'mandatory-select':
                    metadataWrapper.setElementMandatory(ur.elementType, path, value)
                    break;
                case 'measurement-type':
                    if (odmHelper.saveMeasurementUnitPreCheck(path, value, check, true)) return;
                    break;
                case 'formal-expression':
                    if (odmHelper.saveConditionPreCheck(path, value, check)) return;
                    break;
                default:
                    break;
            }
        }
    }
    successfulListEdit(updateRows.length);
}


function createCodeEditView(type) {
    if (codeEditView && divTableContainer.contains(codeEditView)) divTableContainer.removeChild(codeEditView);
    let codeEditWid = codeEditWidget.getCodeEditWiget('code-edit-view', updateCodes, hideCodeEdit, metadata);
    codeEditView = codeEditWid.view;
    codeEditView.editType = type;
    divTableContainer.appendChild(codeEditView);
    labelsCountSelected['code-edit-view'] = codeEditWid.labelSelected;
    updateCountSelected();
    hideCodeEdit();
}

function setCodes(codesInContexts, oid) {
    metadataWrapper.deleteElementAliasesForElement(oid);
    let start = 1;
    let umlsContextCounter = 0;
    Object.keys(codesInContexts).forEach(context => {
        if(codesInContexts[context].length > 0) {
            if((/UMLS CUI \[\d*,x\]/g).test(context)) {
                for (let k = 0; k < codesInContexts[context].length; k++) {
                    if (codesInContexts[context][k]) 
                        metadataWrapper.setElementAliasForElement(oid, `UMLS CUI [${umlsContextCounter+start},${k+1}]`, codesInContexts[context][k]);
                }
                umlsContextCounter++;
            }
            else {
                if (context && codesInContexts[context] && codesInContexts[context].length > 0) 
                    metadataWrapper.setElementAliasForElement(oid, context, codesInContexts[context].join(','));
            }
        }
    })
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
    ioHelper.showToast(`item codes have been updated.`, 4000, ioHelper.interactionTypes.SUCCESS);
}

function updateCodes(codesInContexts, replace) {
    if (typeof replace == 'undefined') {
        ioHelper.showToast('You have to select an editing mode', 4000, ioHelper.interactionTypes.DANGER);
        return;
    }
    replace = replace === 'true';

    const updateRows = [...$$('.odm-overview-checkbox')].filter(cb => cb.checked && [...cb.closest('.odm-overview-row').classList].indexOf('itemrow') >= 0).map(cb => cb.closest('.itemrow'));
    for (let i = 0; i < updateRows.length; i++) {
        let ur = updateRows[i];
        let oid = ur.oid;
        let igOID = ur.closest('.connectedSortable').oid;
        let path = new ODMPath(selectedStudyEventOID, selectedFormOID, igOID, oid);
        let start = 1;
        if (replace) {
            metadataWrapper.deleteElementAliasesForElement(path.last.value);
        } else {
            let aliasses = metadataWrapper.getElementAliases(path);
            start = getHighestContext(aliasses) + 1;
        }
        for (let j = 0; j < codesInContexts.length; j++) {
            for (let k = 0; k < codesInContexts[j].length; k++) {
                if(codesInContexts[j][k])
                    metadataWrapper.setElementAliasForElement(path.last.value, `UMLS CUI [${j+start},${k+1}]`, codesInContexts[j][k]);
            }
        }
    }
    successfulListEdit(updateRows.length);
}

function getHighestContext(aliasses) {
    return Math.max(...[...aliasses].map(a => a.getAttribute('Context')).filter(a => (/UMLS CUI \[\d*,\d*\]/g).test(a)).map(a => parseInt(a.substring(a.indexOf("[") + 1, a.indexOf(",")))), 0);
}

function addUpdateItemListener(identifier, rows = 1) {
    jq(identifier).unbind();
    jq(document).on("dblclick", identifier, function() {

        if (jq("#newcont")) {
            jq("#newcont").trigger('blur');
        }

        var current = jq(this).text();
        jq(this).html(`<textarea class="form-control textarea" id="newcont" rows="${rows}">${current}</textarea>`);
        jq("#newcont").focus();

        jq("#newcont").focus(function() {
        }).on('blur', function() {
            let newcont = jq("#newcont")[0].value;
            let parent = jq(this).parent();
            parent.text(newcont);
            updateItem(parent[0]);
        });

    })
}

function updateCodelists(listName, listOID, items, checkbox) {
    if (typeof checkbox == 'undefined') {
        ioHelper.showToast('You have to select an adding mode', 4000, ioHelper.interactionTypes.DANGER);
        return;
    }

    let itemPaths = [];
    const updateRows = [...$$('.odm-overview-checkbox')].filter(cb => cb.checked && [...cb.closest('.odm-overview-row').classList].indexOf('itemrow') >= 0).map(cb => cb.closest('.itemrow'));
    for (let i = 0; i < updateRows.length; i++) {
        let ur = updateRows[i];
        let oid = ur.oid;
        let igOID = ur.closest('.connectedSortable').oid;
        itemPaths.push(new ODMPath(selectedStudyEventOID, selectedFormOID, igOID, oid));
    }

    let deepCopy = checkbox === 'deep-copy';
    let codelistItems = $$m(`[OID="${listOID}"] CodeListItem`)
    if (codelistItems.length == items.length && [...codelistItems].every(item => items.map(i => i.item.codedValue).indexOf(item.getAttribute('CodedValue') >= 0)) &&
        !hasDuplicates([...codelistItems])) {
        //In here we can be sure that two codelists are exactly the same
        odmHelper.copyCodelistToMultipleItems(listOID, itemPaths, deepCopy, false, successfulListEdit);
        return;
    }
    odmHelper.createNewCodelistForMultipleItems(listName, items, itemPaths, deepCopy, false, successfulListEdit);
    //at this point we have to create a new list

}

function successfulListEdit(numberOfItemsEdited) {
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
    showCurrentTable();
    metadataModule.reloadTree();
    ioHelper.showToast(`${numberOfItemsEdited} ${numberOfItemsEdited == 1 ? 'item has' : 'items have'} been updated.`, 4000, ioHelper.interactionTypes.SUCCESS);
}

function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
}

function addItemViewEditingLogic(identifier) {
    let copyHelper;
    jq(function() {
        jq(".connectedSortable").sortable({
            items: 'div.itemrow',
            handle: '.move-icon',
            cursor: "move",
            cancel: '',
            scrollSensitivity: 50,
            scrollSpeed: 10,
            placeholder: "placeholder-line",
            helper: function(e, tr) {
                copyHelper = tr.clone().insertAfter(tr);
                copyHelper.css('background-color','#f8bbd0')
                var $originals = tr.children();
                var $helper = tr.clone();
                jq($helper).addClass('placeholder')
                $helper.children().each(function(index) {
                    jq(this).width($originals.eq(index).width());
                });
                return $helper;
            },
            connectWith: ".connectedSortable",
            start: function(e, ui) {
                switch(identifier) {
                    case ODMPath.elements.ITEM: 
                        prevPath = new ODMPath(selectedStudyEventOID, selectedFormOID, ui.item.prev().parent().prop('oid'), ui.item.prev().prop('oid'));
                        currentDragPath = new ODMPath(selectedStudyEventOID, selectedFormOID, ui.item.parent().prop('oid'), ui.item.prop('oid'));
                        break;
                    case ODMPath.elements.ITEMGROUP:
                        prevPath = new ODMPath(selectedStudyEventOID, ui.item.prev().parent().prop('oid'), ui.item.prev().prop('oid'));
                        currentDragPath = new ODMPath(selectedStudyEventOID, ui.item.parent().prop('oid'), ui.item.prop('oid'));
                        break;
                    case ODMPath.elements.FORM: 
                        prevPath = new ODMPath(ui.item.prev().parent().prop('oid'), ui.item.prev().prop('oid'));
                        currentDragPath = new ODMPath(ui.item.parent().prop('oid'), ui.item.prop('oid'));
                }
            },
            stop: function(e, ui) {
                copyHelper && copyHelper.remove();
                onDrop(e, ui, false)
            }
        }).disableSelection();

        if(isEditMode) addUpdateItemListener(`.editable.${identifier}`)
    });
}

function editMetadata() {
    const odm = $m('ODM');
    let data = [];
    data.push({type: 'select', name: 'Version', editType: elementValueOptions.ODM_VERSION, value: odm.getAttribute('ODMVersion'), elements: Object.values(odmVersions), translations: Object.values(odmVersions), callback: updateSelect});
    data.push({type: 'input', name: 'Description', editType: elementValueOptions.ODM_DESCRIPTION, value: odm.getAttribute('Description')});  

    let detailView = document.createElement('key-value-modal');
    detailView.setHeading('Edit metadata');
    detailView.setData(data);
    detailView.setIsEditable(isEditMode)
    document.body.appendChild(detailView);
    if(isEditMode) addUpdateItemListener(`.editable.detail`, 2)
}

function createCodeListEditView() {
    if (codelistEditView && divTableContainer.contains(codelistEditView)) divTableContainer.removeChild(codelistEditView);
    let codelistEditWid = codelistEditWidget.getCodeEditWiget('codelist-edit-view', updateCodelists, hideCodelistEdit, metadata);
    codelistEditView = codelistEditWid.view;
    divTableContainer.appendChild(codelistEditView);
    labelsCountSelected['codelist-edit-view'] = codelistEditWid.labelSelected;
    updateCountSelected();
    hideCodelistEdit();
}

function showRenewCodesModal() {
    let renewCodesModal = document.createElement('renew-codes-modal');
    renewCodesModal.setHeading("Renew Codes");
    renewCodesModal.setMetadata(metadata);
    document.body.appendChild(renewCodesModal);
}

function fixODM() {
    [...$$m('Alias')].filter(a => a.getAttribute('Name') == '').forEach(a => a.parentElement.removeChild(a));
    [...$$m('Alias')].forEach(a => a.parentElement.appendChild(a));
    [...$$m('CodeList')].forEach(cl => [...cl.querySelectorAll(':scope > Alias')].forEach(a => cl.removeChild(a)));
    [...$$m(`CodeList[OID="${'OpenEDC.DataStatus'}"]`)].forEach(cl => cl.parentElement.removeChild(cl));
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}

function reorderODM() {
    odmHelper.reorderODM();
    ioHelper.showToast(`ODM file has been reordered`, 4000, ioHelper.interactionTypes.SUCCESS);
}


/***************************************************************************************************************************************************************
 * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW * ITEM VIEW *
 * ************************************************************************************************************************************************************/
function createViewTable(headers, selectedOuterElementOID, categoryType, itemType, {groupOptions, itemOptions, ...options}) {
    tableContainer.innerHTML = '';

    tables[currentTable] = document.createElement("div");
    tables[currentTable].id = 'odm-overview-item-table';
    tables[currentTable].classList = 'columns is-gapless is-multiline column is-full overview-table';
    theadDiv = document.createElement("div");
    theadDiv.classList = "columns column is-full is-gapless mb-0 is-sticky-header" //connectedSortable events-disabled
    tables[currentTable].appendChild(theadDiv);
    tableContainer.appendChild(tables[currentTable]);

    addTableHeaders(theadDiv, headers);


    let oidPart = `[OID="${selectedOuterElementOID}"]`
    if(!selectedOuterElementOID) oidPart = '';
    let defs = [];
    $$m(`${oidPart} ${categoryType}Ref`).forEach(ref => {
        let refOID = ref.getAttribute(`${categoryType}OID`);
        let def = $m(`[OID="${refOID}"]`);
        if (def) defs.push(def);
    });

    if(defs.length == 0) {
        let emptyBody = document.createElement("div");
        emptyBody.classList = 'column is-full';
        tables[currentTable].appendChild(emptyBody);
        let label = document.createElement('label');
        label.classList = 'label'
        label.innerText = 'No elements to show';
        emptyBody.appendChild(label);
        return;
    }

    //let headerHeight = 72;//theadDiv.offsetHeight;
    //console.log(headerHeight);

    defs.forEach(def => {
        const defOID = def.getAttribute('OID');

        let tBodyDiv = document.createElement("div");
        tBodyDiv.classList = 'connectedSortable columns is-gapless is-multiline column is-full';
        tBodyDiv.oid = defOID;
        tables[currentTable].appendChild(tBodyDiv);

        let trDiv = document.createElement("div");
        trDiv.classList = `coloredRow columns column is-full odm-overview-row has-text-weight-bold is-sticky-row`
        //trDiv.style.top = `${headerHeight}px`;
        tBodyDiv.appendChild(trDiv);

        //OID
        let tdOID = document.createElement("div");
        tdOID.classList = 'coloredRow column is-1 m-0'
        let checkboxLabel = document.createElement('label');
        checkboxLabel.setAttribute("data-tooltip", defOID);
        checkboxLabel.classList = 'flex-label checkbox has-tooltip-right';
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.hierarchyLevel = 'checkbox-group';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(defOID.length > 8 ? defOID.substring(0, 7) + "..." : defOID));
        trDiv.append(tdOID);

        //Other element values
        groupOptions.forEach(gO => {
            let tdDiv = document.createElement("div");
            tdDiv.classList = `coloredRow column is-${gO.size}`;
            switch(gO.type) {
                case elementValueOptions.NAME: 
                    tdDiv.innerText = def.getAttribute("Name");
                    break;
                case elementValueOptions.QUESTION:
                    break;
                case elementValueOptions.DESCRIPTION:
                    tdDiv.innerText = def.getTranslatedDescription(languageHelper.getCurrentLocale())
                    break;
                case elementValueOptions.CODES:
                    addCodesToItem(tdDiv, defOID)
                    //tdDiv.innerText = [...$$m(`[OID="${defOID}"] Alias`)].filter(a => a.getAttribute('Name') != '').map(a => a.getAttribute('Name')).join(", ");
                    break;
                case elementValueOptions.DATA_TYPE:
                case elementValueOptions.MEASUREMENT_UNIT:
                case elementValueOptions.MANDATORY:
                case elementValueOptions.EMPTY:
                    tdDiv.innerText = '';
                    break;
            }
            trDiv.append(tdDiv);

        })
        addItemsToViewTable(tBodyDiv, defOID, itemType, itemOptions);

    });

    let headerHeight = theadDiv.offsetHeight;
    [...$$('.is-sticky-row')].forEach(r => r.style.top = `${headerHeight}px`);
    if(!ioHelper.getSetting('stick-group-state')) optionsHelper.setStickGroupState(false);
    if(ioHelper.getSetting('expand-items-state')) optionsHelper.setItemExpandState(true);
    if(ioHelper.getSetting('use-colors-state')) optionsHelper.setUseColorsState(true);


    adjustSelectContainer();
    if (isEditMode) {
        if(options.bulkEdit) createBulkEditView();
        if(options.codesEdit) createCodeEditView(itemType.toLowerCase());
        if(options.codelistsEdit) createCodeListEditView();
        $(buttons.EDIT_METADATA).disabled = false;
        $(buttons.UPDATE_CODES).disabled = false;
        $(buttons.FIX_ODM).disabled = false;
        $(buttons.SORT_ODM).disabled = false;
        addLogicToCheckboxes();
        addItemViewEditingLogic(itemType.toLowerCase());
        showIconElements(true);
    }
    currentMode = itemType.toLowerCase();
}

function addItemsToViewTable(tBodyDiv, defOID, itemType, itemOptions) {
    let refs = $$m(`[OID="${defOID}"] ${itemType}Ref`);
    let defRefs = [];
    refs.forEach(ref => {
        let oid = ref.getAttribute(`${itemType}OID`);
        let def = $m(`[OID="${oid}"]`);
        if (def) defRefs.push({ref, def});
    });

    defRefs.forEach(defRef => {
        let def = defRef.def;
        const defOID = def.getAttribute('OID');
        let tr = document.createElement("div");
        tr.classList = 'itemrow columns column is-full div-underline odm-overview-row';
        tr.oid = defOID;
        tr.poid = defOID;
        tr.elementType = itemType.toLowerCase();
        tBodyDiv.append(tr);


        let tdOID = document.createElement("div");
        tdOID.classList = 'column is-1 columns m-0';

        let divSpacing = document.createElement('div');
        divSpacing.classList = 'column is-2 p-0';
        let icon = document.createElement("i");
        icon.classList = 'fa-solid fa-up-down move-icon'
        icon.ariaHidden = true;
        divSpacing.appendChild(icon);
        icon.hide();

        let divSpacing2 = document.createElement('div');
        divSpacing2.classList = 'column is-2 p-0';
        let detailView = document.createElement("i");
        detailView.classList = 'fa-solid fa-magnifying-glass detail-icon'
        detailView.ariaHidden = true;
        divSpacing2.appendChild(detailView);
        detailView.onclick = () => showItemPopup(defRef, itemType, defOID);
        //detailView.hide();

        tdOID.appendChild(divSpacing);
        tdOID.appendChild(divSpacing2);
        let checkboxLabel = document.createElement('label');
        checkboxLabel.setAttribute("data-tooltip", defOID);
        checkboxLabel.classList = `flex-label checkbox column is-8 p-0 margin-t-2px has-tooltip-right`;
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(defOID.length > 8 ? defOID.substring(0,7) + "..." : defOID));
        tr.append(tdOID);


        itemOptions.forEach(iO => {
            let tdDiv = document.createElement("div");
            tdDiv.classList = `column is-${iO.size} item `;
            switch(iO.type) {
                case elementValueOptions.NAME: 
                    if(isEditMode) tdDiv.classList.add('editable');
                    tdDiv.editType = iO.type;
                    tdDiv.innerText = def.getAttribute("Name");
                    break;
                case elementValueOptions.QUESTION:
                    tdDiv.editType = iO.type;
                    if(isEditMode) tdDiv.classList.add('editable');
                    tdDiv.innerText = def.getTranslatedQuestion(languageHelper.getCurrentLocale());
                    break;
                case elementValueOptions.DESCRIPTION:
                    if(isEditMode) tdDiv.classList.add('editable');
                    tdDiv.editType = iO.type;
                    tdDiv.innerText = def.getTranslatedDescription(languageHelper.getCurrentLocale())
                    break;
                case elementValueOptions.CODES:
                    addCodesToItem(tdDiv, defOID)
                    break;
                case elementValueOptions.DATA_TYPE:
                    tdDiv.innerText = languageHelper.getTranslation(def.getDataType());
                    break;
                case elementValueOptions.MEASUREMENT_UNIT:
                    let measurementUnit = metadataWrapper.getItemMeasurementUnit(defOID);
                    tdDiv.editType = iO.type;
                    if(isEditMode) tdDiv.classList.add('editable');
                    tdDiv.innerText = typeof measurementUnit == 'undefined' ? '' : measurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale());
                    break;
                case elementValueOptions.MANDATORY:
                    tdDiv.innerText = $m(`${itemType}Ref[${itemType}OID="${defOID}"]`).getAttribute('Mandatory');
                    break;
                case elementValueOptions.REPEATING:
                    tdDiv.innerText = def.getAttribute('Repeating');
                    break;
                case elementValueOptions.EMPTY:
                    tdDiv.innerText = '';
                    break;
            }
            tr.append(tdDiv);
        })
    });
}

function addCodesToItem(tdCodes, oid) {
    let contexts = {};
    let aliasses = [...$$m(`[OID="${oid}"] Alias`)].filter(a => a.getAttribute('Name') != '');
    let aliasArray = [];
    let previousColor = '';
    aliasses.forEach(alias => {
        let context = alias.getAttribute('Context');
        let formattedContext = utilHelper.formatContext(context);
        if(!Object.keys(contexts).includes(formattedContext)){
            let nextColor =  getNextColor(previousColor);
            contexts[formattedContext] = nextColor;
            previousColor = nextColor;
        }
        alias.getAttribute('Name').trim().split(/[\s,]+/).forEach(code => aliasArray.push({context: formattedContext, code}))
    });
    //aliasArray = aliasArray.map(alias => alias.getAttribute('Name').trim().split(/[\s,]+/)).flat();
    const hasElements = aliasArray.length >= 1;
    const maxValue = aliasArray.length;
   
    if (hasElements) {
        let tdCodesDiv = document.createElement("div");
        tdCodesDiv.classList = 'columns is-gapless mb-0 is-flex-baseline'
        tdCodes.appendChild(tdCodesDiv);
        let alias = aliasArray.shift();
        let codeDiv = baseElements.getCodeDiv(alias, contexts[alias.context]);
        if(isUMLSCode(alias.code))
            codeCache.getOrLoad(alias.code).then(d => codeDiv.querySelector('.label').innerText = d.STR[0]);
        else
            codeDiv.querySelector('.label').innerText = "No UMLS Code";
        codeDiv.classList.add('column', 'is-11')
        tdCodesDiv.append(codeDiv);

        if(maxValue > 1) {
            let span = document.createElement('span');
            span.classList = 'codeSpan column is-1';
            span.innerText = ` +${maxValue - 1}`;
            tdCodesDiv.appendChild(span);

            let tdCodesDivRemaining = document.createElement("div");
            tdCodesDivRemaining.classList = 'columns is-gapless mb-0 is-flex-baseline is-multiline additional-code-div'
            tdCodes.appendChild(tdCodesDivRemaining);
            jq(tdCodesDivRemaining).prop('isHidden', true)
            tdCodesDivRemaining.style.display = 'None';
            aliasArray.forEach(alias => {
                let innerCodeDiv = baseElements.getCodeDiv(alias, contexts[alias.context]);
                if(isUMLSCode(alias.code))
                    codeCache.getOrLoad(alias.code).then(d => innerCodeDiv.querySelector('.label').innerText = d.STR[0]);
                else
                    innerCodeDiv.querySelector('.label').innerText = "No UMLS Code";
                innerCodeDiv.classList.add('column', 'is-11')
                tdCodesDivRemaining.appendChild(innerCodeDiv);
            });

            jq(tdCodes).on('click', () => {
                if (jq(tdCodesDivRemaining).prop('isHidden')) {
                    jq(tdCodesDivRemaining).slideDown();
                    jq(tdCodesDivRemaining).prop('isHidden', false)
                    jq(span).addClass('is-hidden')
                } else {
                    jq(tdCodesDivRemaining).slideUp();
                    jq(tdCodesDivRemaining).prop('isHidden', true)
                    jq(span).removeClass('is-hidden')
                }
            })
        }
    }
}

function isUMLSCode(code) {
    return (/C\d+/g).test(code);
}

function getNextColor(previousColor){
    let newIndex;
    if(!previousColor) newIndex = 0;
    else newIndex = (colors.indexOf(previousColor) + 1) % colors.length
    return colors[newIndex];
}

function addLogicToCheckboxes() {
    $$(".odm-overview-checkbox").forEach(c => {
        c.addEventListener("change", (event) => {
            if (event.target.checked) {
                if (event.target.hierarchyLevel === "checkbox-group") {
                    [...event.target.closest('.connectedSortable').querySelectorAll('.itemrow .odm-overview-checkbox')].filter(cb => !cb.checked).forEach(c => {
                        c.checked = true;
                        countElementsSelected++;
                        c.closest('.itemrow').classList.add("has-background-link-light");
                    })
                } else {
                    countElementsSelected++;
                    event.target.closest('.itemrow').classList.add("has-background-link-light");
                }
            } else {
                if (event.target.hierarchyLevel === "checkbox-group") {
                    [...event.target.closest('.connectedSortable').querySelectorAll('.itemrow .odm-overview-checkbox')].filter(cb => cb.checked).forEach(c => {
                        c.checked = false;
                        countElementsSelected--;
                        c.closest('.itemrow').classList.remove("has-background-link-light");
                    });
                } else {
                    countElementsSelected--;
                    event.target.closest('.itemrow').classList.remove("has-background-link-light");
                }
            }
            updateCountSelected();
        });
    })
}

function showItemPopup(defRef, itemType, parentOID) {


    const translatedDataTypes = Object.values(metadataWrapper.dataTypes).map(type => languageHelper.getTranslation(type));
    //const translatedMandatoryTypes = Object.values(metadataWrapper.mandatoryTypes).map(option => languageHelper.getTranslation(option.toLowerCase()));


    let ref = defRef.ref
    let def = defRef.def;
    let oid = def.getAttribute('OID');
    let path = new ODMPath();
    switch(itemType) {
        case 'Item': 
            path = new ODMPath(selectedStudyEventOID, selectedFormOID, parentOID, oid);
            break;
        case 'ItemGroup':
            path =new ODMPath(selectedStudyEventOID, parentOID, oid);
            break;
        case 'Form':
            path =new ODMPath(parentOID, oid);
            break;

    }
    let data = [];
    data.push({type: 'label', name: 'OID', value: oid});
    data.push({type: 'input', name: 'Name', editType: elementValueOptions.NAME, value: def.getAttribute('Name')});
    data.push({type: 'input', name: 'Description', editType: elementValueOptions.DESCRIPTION, value: def.getTranslatedDescription(languageHelper.getCurrentLocale())});
    switch(itemType) {
        case 'Item':
            data.push({type: 'input', name: 'Question', editType: elementValueOptions.QUESTION, value: def.getTranslatedQuestion(languageHelper.getCurrentLocale())});
            data.push({type: 'select', name: 'Data Type', editType: elementValueOptions.DATA_TYPE, value: def.getDataType(), elements: Object.values(metadataWrapper.dataTypes), translations: translatedDataTypes, callback: updateSelect});
            let measurementUnit = metadataWrapper.getItemMeasurementUnit(oid);
            data.push({type: 'input', name: 'Measurement Unit', editType: elementValueOptions.MEASUREMENT_UNIT, value: (measurementUnit ? measurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale()) : '')});
            break;
        case 'ItemGroup':
        case 'Form':
            break;
    }
    //data.push({type: 'select', name: 'Mandatory', value: ref.getAttribute('Mandatory'), elements: Object.values(metadataWrapper.mandatoryTypes), translations: translatedMandatoryTypes, callback: updateSelect});


    let detailView = document.createElement('item-detail-view');
    detailView.setHeading(def.getAttribute('Name'));
    detailView.setData(data);
    detailView.setOid(oid);
    detailView.setPath(path);
    detailView.setMetadata(metadata);
    detailView.setCloseCallback(() => showCurrentTable());
    detailView.setCodeSaveCallback(setCodes);
    detailView.setIsEditable(isEditMode)
    document.body.appendChild(detailView);
    if(isEditMode) addUpdateItemListener(`.editable.detail`)
}

function createItemViewTableAlternative() {
    const headers = [{ term: 'Oid', space: 'is-1 pl-20' }, { term: 'Name', space: 'is-2' }, { term: 'Question', space: 'is-4' }, { term: 'Codes', space: 'is-2' }, { term: 'Datatype', space: 'is-1' }, { term: 'Measurement Unit', space: 'is-1' }, { term: 'Mandatory', space: 'is-1' }];

    let groupOptions = [];
    groupOptions.push({type: elementValueOptions.NAME, size: 2});
    groupOptions.push({type: elementValueOptions.DESCRIPTION, size: 4});
    groupOptions.push({type: elementValueOptions.CODES, size: 2});
    groupOptions.push({type: elementValueOptions.EMPTY, size: 1});
    groupOptions.push({type: elementValueOptions.EMPTY, size: 1});
    groupOptions.push({type: elementValueOptions.EMPTY, size: 1});

    let itemOptions = [];
    itemOptions.push({type: elementValueOptions.NAME, size: 2});
    itemOptions.push({type: elementValueOptions.QUESTION, size: 4});
    itemOptions.push({type: elementValueOptions.CODES, size: 2});
    itemOptions.push({type: elementValueOptions.DATA_TYPE, size: 1});
    itemOptions.push({type: elementValueOptions.MEASUREMENT_UNIT, size: 1});
    itemOptions.push({type: elementValueOptions.MANDATORY, size: 1});

    createViewTable(headers, selectedFormOID, 'ItemGroup', 'Item', {groupOptions, itemOptions, bulkEdit: true, codesEdit: true, codelistsEdit: true})
}

function createItemGroupViewTableAlternative() {
    const headers = [{ term: 'Oid', space: 'is-1 pl-20' }, { term: 'Name', space: 'is-2' }, { term: 'Description', space: 'is-half' }, { term: 'Codes', space: 'is-one-quarter' }];

    let groupOptions = [];
    groupOptions.push({type: elementValueOptions.NAME, size: 2});
    groupOptions.push({type: elementValueOptions.DESCRIPTION, size: 6});
    groupOptions.push({type: elementValueOptions.CODES, size: 3});

    let itemOptions = [];
    itemOptions.push({type: elementValueOptions.NAME, size: 2});
    itemOptions.push({type: elementValueOptions.DESCRIPTION, size: 6});
    itemOptions.push({type: elementValueOptions.CODES, size: 3});

    createViewTable(headers, selectedStudyEventOID, 'Form', 'ItemGroup', {groupOptions, itemOptions, bulkEdit: false, codesEdit: true, codelistsEdit: false})
}

function createFormViewTableAlternative() {
    const headers = [{ term: 'Oid', space: 'is-1 pl-20' }, { term: 'Name', space: 'is-2' }, { term: 'Description', space: 'is-half' }, { term: 'Codes', space: 'is-2' }, {term: 'Repeating', space: 'is-1'}];

    let groupOptions = [];
    groupOptions.push({type: elementValueOptions.NAME, size: 2});
    groupOptions.push({type: elementValueOptions.DESCRIPTION, size: 6});
    groupOptions.push({type: elementValueOptions.CODES, size: 2});
    groupOptions.push({type: elementValueOptions.EMPTY, size: 1});

    let itemOptions = [];
    itemOptions.push({type: elementValueOptions.NAME, size: 2});
    itemOptions.push({type: elementValueOptions.DESCRIPTION, size: 6});
    itemOptions.push({type: elementValueOptions.CODES, size: 2});
    itemOptions.push({type: elementValueOptions.REPEATING, size: 1});

    createViewTable(headers, null, 'StudyEvent', 'Form', {groupOptions, itemOptions, bulkEdit: false, codesEdit: true, codelistsEdit: false})
}


function createItemViewTable() {
    tableContainer.innerHTML = '';
    //if (tableContainer.contains(tables[currentTable])) tableContainer.removeChild(tables[currentTable]);

    tables[currentTable] = document.createElement("div");
    tables[currentTable].id = 'odm-overview-item-table';
    tables[currentTable].classList = 'columns is-gapless is-multiline column is-full overview-table';
    let theadDiv = document.createElement("div");
    theadDiv.classList = "columns column is-full is-gapless mb-0" //connectedSortable events-disabled
    tables[currentTable].appendChild(theadDiv);
    tableContainer.appendChild(tables[currentTable]);

    const headers = [{ term: 'Oid', space: 'is-1 pl-20' }, { term: 'Name', space: 'is-2' }, { term: 'Question', space: 'is-4' }, { term: 'Codes', space: 'is-2' }, { term: 'Datatype', space: 'is-1' }, { term: 'Measurement Unit', space: 'is-1' }, { term: 'Mandatory', space: 'is-1' }];

    addTableHeaders(theadDiv, headers);

    let itemGroupDefs = [];
    $$m(`[OID="${selectedFormOID}"] ItemGroupRef`).forEach(ig => {
        let itemGroupOID = ig.getAttribute("ItemGroupOID");
        let itemGroupDef = $m(`[OID="${itemGroupOID}"]`);
        if (itemGroupDef) itemGroupDefs.push(itemGroupDef);
    })

    itemGroupDefs.forEach(ig => {
        const igOID = ig.getAttribute('OID');

        let igTbody = document.createElement("div");
        igTbody.classList = 'connectedSortable columns is-gapless is-multiline column is-full';
        igTbody.oid = igOID;
        tables[currentTable].appendChild(igTbody);

        let tr = document.createElement("div");
        tr.classList = 'coloredRow columns column is-full odm-overview-row has-text-weight-bold'
        igTbody.appendChild(tr);
        let tdOID = document.createElement("div");
        tdOID.classList = 'column is-1 m-0'
        let checkboxLabel = document.createElement('label');
        checkboxLabel.classList = 'checkbox';
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.hierarchyLevel = 'checkbox-group';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(igOID));
        tr.append(tdOID);
        let tdName = document.createElement("div");
        tdName.classList = 'coloredRow column is-2';
        tdName.innerText = ig.getAttribute("Name");
        tr.append(tdName);
        let tdDesc = document.createElement("div");
        tdDesc.classList = 'coloredRow column is-4';
        tdDesc.innerText = ig.getTranslatedDescription(languageHelper.getCurrentLocale())
        tr.append(tdDesc);
        let tdCodes = document.createElement("div");
        tdCodes.classList = 'coloredRow column is-2';
        tdCodes.innerText = [...$$m(`[OID="${igOID}"] Alias`)].filter(a => a.getAttribute('Name') != '').map(a => a.getAttribute('Name')).join(", ");
        tr.append(tdCodes);
        let tdOffset = document.createElement("div");
        tdOffset.classList = 'coloredRow column is-1';
        tdOffset.innerText = '';
        tr.append(tdOffset);
        let tdOffset2 = tdOffset.cloneNode(true);
        tr.append(tdOffset2);
        let tdOffset3 = tdOffset.cloneNode(true);
        tr.append(tdOffset3);

        addItemsToItemViewTable(igTbody, igOID);

    })
    adjustSelectContainer();
    if (isEditMode) {
        createBulkEditView();
        createCodeEditView(ODMPath.elements.ITEM);
        createCodeListEditView();
        addLogicToCheckboxes();
        addItemViewEditingLogic('item');
    }
    currentMode = ODMPath.elements.ITEM;
}


function addItemsToItemViewTable(tbody, igOID) {

    let itemDefs = [];
    $$m(`[OID="${igOID}"] ItemRef`).forEach(i => {
        let itemOID = i.getAttribute("ItemOID");
        let itemDef = $m(`[OID="${itemOID}"]`);
        if (itemDef) itemDefs.push(itemDef);
    });

    itemDefs.forEach(i => {
        const iOID = i.getAttribute('OID');
        let tr = document.createElement("div");
        tr.classList = 'itemrow columns column is-full div-underline odm-overview-row';
        tr.oid = iOID;
        tr.elementType = ODMPath.elements.ITEM;
        tbody.append(tr);
        let tdOID = document.createElement("div");
        tdOID.classList = 'column is-1 columns m-0';
        let divSpacing = document.createElement('div');
        divSpacing.classList = 'column is-2 p-0';
        tdOID.appendChild(divSpacing);
        let checkboxLabel = document.createElement('label');
        checkboxLabel.classList = 'checkbox column is-10 p-0 margin-t-2px';
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(iOID));
        tr.append(tdOID);

        let tdName = document.createElement("div");
        tdName.classList = 'column is-2 editable item'
        tdName.innerText = i.getAttribute("Name");
        tdName.editType = 'name';
        tr.append(tdName);
        let tdDesc = document.createElement("div");
        tdDesc.classList = 'column is-4 editable item'
        tdDesc.innerText = i.getTranslatedQuestion(languageHelper.getCurrentLocale());
        tdDesc.editType = 'question';
        tr.append(tdDesc);

        const aliasArray = [...$$m(`[OID="${iOID}"] Alias`)].filter(a => a.getAttribute('Name') != '');
        const hasElements = aliasArray.length >= 1;
        const maxValue = aliasArray.length;
        let tdCodes = document.createElement("div");
        tdCodes.classList = 'column is-2'
        if (hasElements) {
            let tdCodesDiv = document.createElement("div");
            tdCodesDiv.classList = 'is-inline'
            tdCodesDiv.innerText = aliasArray.slice(0, Math.min(2, maxValue)).map(a => a.getAttribute('Name')).join(", ");
            tdCodes.appendChild(tdCodesDiv);
            if (maxValue > 2) {
                let span = document.createElement('span');
                span.classList = 'codeSpan';
                span.innerText = ` +${maxValue - 2}`;
                tdCodes.appendChild(span);
                let tdCodesDivRemaining = document.createElement("div");
                tdCodesDivRemaining.innerText = aliasArray.slice(2, maxValue).map(a => a.getAttribute('Name')).join(", ");
                tdCodes.appendChild(tdCodesDivRemaining);
                jq(tdCodesDivRemaining).prop('isHidden', true)
                tdCodesDivRemaining.style.display = 'None';
                jq(tdCodes).on('click', () => {
                    if (jq(tdCodesDivRemaining).prop('isHidden')) {
                        jq(tdCodesDivRemaining).slideDown();
                        jq(tdCodesDivRemaining).prop('isHidden', false)
                        jq(span).addClass('is-hidden')
                    } else {
                        jq(tdCodesDivRemaining).slideUp();
                        jq(tdCodesDivRemaining).prop('isHidden', true)
                        jq(span).removeClass('is-hidden')
                    }
                })
            }
        }
        tr.append(tdCodes);
        let tdDatatype = document.createElement("div");
        tdDatatype.classList = 'column is-1'
        tdDatatype.innerText = i.getAttribute('DataType');
        tr.append(tdDatatype);

        let measurementUnit = metadataWrapper.getItemMeasurementUnit(iOID);
        let tdMeasurementUnit = document.createElement("div");
        tdMeasurementUnit.classList = 'column is-1 editable item'
        tdMeasurementUnit.innerText = typeof measurementUnit == 'undefined' ? '' : measurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale());
        tdMeasurementUnit.editType = 'measurement-unit';
        tr.append(tdMeasurementUnit);

        let tdMandatory = document.createElement("div");
        tdMandatory.classList = 'column is-1'
        tdMandatory.innerText = $m(`ItemRef[ItemOID="${iOID}"]`).getAttribute('Mandatory');
        tr.append(tdMandatory);
    })
}

/***************************************************************************************************************************************************************
 * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW * GROUP VIEW* 
 * ************************************************************************************************************************************************************/

function createItemgroupViewTable() {
    tableContainer.innerHTML = '';
    //if (tableContainer.contains(tables[currentTable])) tableContainer.removeChild(tables[currentTable]);

    tables[currentTable] = document.createElement("div");
    tables[currentTable].id = 'odm-overview-itemgroup-table';
    tables[currentTable].classList = 'columns is-gapless is-multiline column is-full overview-table';
    let theadDiv = document.createElement("div");
    theadDiv.classList = "columns is-gapless column is-full" //connectedSortable events-disabled
    tables[currentTable].appendChild(theadDiv);
    tableContainer.appendChild(tables[currentTable]);

    const headers = [{ term: 'Oid', space: 'is-1 pl-20' }, { term: 'Name', space: 'is-2' }, { term: 'Description', space: 'is-half' }, { term: 'Codes', space: 'is-one-quarter' }];

    addTableHeaders(theadDiv, headers);

    let defs = [];
    $$m(`[OID="${selectedStudyEventOID}"] FormRef`).forEach(d => {
        let dOID = d.getAttribute("FormOID");
        let def = $m(`[OID="${dOID}"]`);
        if (def) defs.push(def);
    })

    defs.forEach(f => {
        const fOID = f.getAttribute('OID');

        let fTBody = document.createElement("div");
        fTBody.classList = 'connectedSortable columns is-gapless is-multiline column is-full';
        fTBody.oid = fOID;
        tables[currentTable].appendChild(fTBody);

        let tr = document.createElement("div");
        tr.classList = 'coloredRow columns column is-full odm-overview-row'
        fTBody.appendChild(tr);
        let tdOID = document.createElement("div");
        tdOID.classList = 'column is-1 m-0'
        let checkboxLabel = document.createElement('label');
        checkboxLabel.classList = 'checkbox';
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.hierarchyLevel = 'checkbox-group';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(fOID));
        tr.append(tdOID);
        let tdName = document.createElement("div");
        tdName.classList = 'coloredRow column is-2';
        tdName.innerText = f.getAttribute("Name");
        tr.append(tdName);
        let tdDesc = document.createElement("div");
        tdDesc.classList = 'coloredRow column is-half';
        tdDesc.innerText = f.getTranslatedDescription(languageHelper.getCurrentLocale())
        tr.append(tdDesc);
        let tdCodes = document.createElement("div");
        tdCodes.classList = 'coloredRow column is-one-quarter';
        tdCodes.innerText = [...$$m(`[OID="${fOID}"] Alias`)].filter(a => a.getAttribute('Name') != '').map(a => a.getAttribute('Name')).join(", ");
        tr.append(tdCodes);

        addItemsToItemgroupViewTable(fTBody, fOID);

    })

    adjustSelectContainer();
    if (isEditMode) {
        $(buttons.CODELIST_EDIT).disabled = true;
        $(buttons.BULK_EDIT).disabled = true;
        createCodeEditView(ODMPath.elements.ITEMGROUP);
        addLogicToCheckboxes();
        addItemViewEditingLogic('itemgroup');
    }
    currentMode = ODMPath.elements.ITEMGROUP;
}

function addItemsToItemgroupViewTable(tbody, oid) {

    let defs = [];
    $$m(`[OID="${oid}"] ItemGroupRef`).forEach(i => {
        let itemOID = i.getAttribute("ItemGroupOID");
        let itemDef = $m(`[OID="${itemOID}"]`);
        if (itemDef) defs.push(itemDef);
    });

    defs.forEach(d => {
        const dOID = d.getAttribute('OID');
        let tr = document.createElement("div");
        tr.classList = 'itemrow columns column is-full div-underline odm-overview-row';
        tr.oid = dOID;
        tr.elementType = ODMPath.elements.ITEMGROUP;
        tbody.append(tr);
        let tdOID = document.createElement("div");
        tdOID.classList = 'column is-1 columns m-0';
        let divSpacing = document.createElement('div');
        divSpacing.classList = 'column is-2 p-0';
        tdOID.appendChild(divSpacing);
        let checkboxLabel = document.createElement('label');
        checkboxLabel.classList = 'checkbox column is-10 p-0 margin-t-2px';
        tdOID.appendChild(checkboxLabel);
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList = 'mr-1 odm-overview-checkbox odm-overview-is-hidden';
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(dOID));
        tr.append(tdOID);

        let tdName = document.createElement("div");
        tdName.classList = 'column is-2 editable itemgroup'
        tdName.innerText = d.getAttribute("Name");
        tdName.editType = 'name';
        tr.append(tdName);
        let tdDesc = document.createElement("div");
        tdDesc.classList = 'column is-half editable itemgroup'
        tdDesc.innerText = d.getTranslatedDescription(languageHelper.getCurrentLocale());
        tdDesc.editType = 'description';
        tr.append(tdDesc);

        const aliasArray = [...$$m(`[OID="${dOID}"] Alias`)].filter(a => a.getAttribute('Name') != '');
        const hasElements = aliasArray.length >= 1;
        const maxValue = aliasArray.length;
        let tdCodes = document.createElement("div");
        tdCodes.classList = 'column is-3'
        if (hasElements) {
            let tdCodesDiv = document.createElement("div");
            tdCodesDiv.classList = 'is-inline'
            tdCodesDiv.innerText = aliasArray.slice(0, Math.min(2, maxValue)).map(a => a.getAttribute('Name')).join(", ");
            tdCodes.appendChild(tdCodesDiv);
            if (maxValue > 2) {
                let span = document.createElement('span');
                span.classList = 'codeSpan';
                span.innerText = ` +${maxValue - 2}`;
                tdCodes.appendChild(span);
                let tdCodesDivRemaining = document.createElement("div");
                tdCodesDivRemaining.innerText = aliasArray.slice(2, maxValue).map(a => a.getAttribute('Name')).join(", ");
                tdCodes.appendChild(tdCodesDivRemaining);
                jq(tdCodesDivRemaining).prop('isHidden', true)
                tdCodesDivRemaining.style.display = 'None';
                jq(tdCodes).on('click', () => {
                    if (jq(tdCodesDivRemaining).prop('isHidden')) {
                        jq(tdCodesDivRemaining).slideDown();
                        jq(tdCodesDivRemaining).prop('isHidden', false)
                        jq(span).addClass('is-hidden')
                    } else {
                        jq(tdCodesDivRemaining).slideUp();
                        jq(tdCodesDivRemaining).prop('isHidden', true)
                        jq(span).removeClass('is-hidden')
                    }
                })
            }
        }
        tr.append(tdCodes);
    })
}