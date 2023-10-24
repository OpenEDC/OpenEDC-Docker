import * as ioHelper from "../../../js/helper/iohelper.js"
import { setMethodFormalExpression } from "../../../js/odmwrapper/metadatawrapper.js"
import dataTables from "./datatables.js"
import * as jDataTables from "../libs/datatables.min.js"
import * as requestHelper from "./requesthelper.js"
import * as mdrMetadataHelper from "./mdrmetadatahelper.js"
import * as metadataModule from "../../../js/metadatamodule.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"


//let jq = $.noConflict();
$ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);
let reloadedUMLSData = [];
let codesInList = [];
let selectedUMLSCodeGroup = null;
let activeInputElement = null;
let alreadyLoaded = false;
let conceptGroupNames = [];
let tempContextGroups = [];
let dragStartGroup;
export let umlsMap = new Map();

jq(document).on('MetadataPanelLoaded', function(e) {
    if ($('#extended-option').isActive()) {
        addUmlsSearchOptions();
    }
});

jq(document).on('LanguageChanged', () => {

});

jq(document).on('SidebarOptionClicked', (e) => {
    if (e.detail.name === 'extended-option') {
        addUmlsSearchOptions();
    }
})

jq(document).on('SaveElementPressed', (e) => {
    if (e.detail.activeView === 2) {
        addUmlsSearchOptions();
    }
})

jq(document).on('NewAliasInputAdded', (e) => {
    //addUmlsSearchOption(e.detail.element);
})


export async function addListenerToAddButton() {
    //no longer used
    //$('#add-alias-button').addEventListener('click', (event) => addClicked(event));
}

export async function addUmlsSearchOptions() {
    if (alreadyLoaded) return;
    alreadyLoaded = true;

    let optionsMenuContent = $('#alias-dropdown-menu-content');
    let umlsSearchOption = document.createElement("a");
    umlsSearchOption.innerText = 'Search UMLS Code';
    umlsSearchOption.className = 'dropdown-item';
    umlsSearchOption.onclick = () => openUMLSSearchWindow(metadataModule.currentPath);
    optionsMenuContent.appendChild(umlsSearchOption);
    /*
    let aliasses = $('#alias-inputs');
    aliasses.childNodes.forEach(ad => {
        addUmlsSearchOption(ad);
    }) */
}

function addUmlsSearchOption(aliasDiv) {
    let inputFirst = aliasDiv.querySelector('input:first-child');
    if (inputFirst['disabled']) return;
    let inputLast = aliasDiv.querySelector('input:last-child');
    aliasDiv.innerHTML = '';
    let newDiv = document.createElement('div');
    newDiv.appendChild(inputFirst);
    aliasDiv.appendChild(newDiv);

    aliasDiv.appendChild(document.createTextNode('\u00A0\u00A0'));
    newDiv = document.createElement('input-with-icon');
    //newDiv.setInput(inputLast.outerHTML);
    newDiv.setIconName('fa-plus');
    newDiv.setCallback("openUMLSSearch");
    aliasDiv.appendChild(newDiv);
    newDiv.querySelector('.input-holder').appendChild(inputLast);
}

function addClicked(e) {
    addUmlsSearchOption($('#alias-inputs .alias-input:last-child'));
}

function addUmlsSearchWindow(path) {
    let box = document.createElement('umls-modal');
    document.body.appendChild(box);
    $("#umls-modal-close").onclick = () => $("#umls-codes-modal").classList.remove("is-active");
    $('#umls-codes-modal .modal-background').onclick = () => $("#umls-codes-modal").classList.remove("is-active");
    $('#umls-search-button').onclick = () => searchForUMLSCodes();
    jq('#umls-search-input').keyup((event) => {
        if (event.keyCode === 13) jq('#umls-search-button').click();
    })
    $('#umls-success-button').onclick = () => addConceptCodesToElement(path);
    $('#umls-codes-add-concept').onclick = () => addUMLSCodeGroupToList('');
}

window.openUMLSSearch = async(e) => {
    if ($('#umls-codes-modal')) $('#umls-codes-modal').remove();
    addUmlsSearchWindow();
    //activeInputElement = e.target.parentElement.parentElement.querySelector('input');
    await addContextGroupsToWindow(metadataModule.currentPath).then(() => {
        fillInputWithCurrentElement();
        $('#umls-codes-modal').classList.add("is-active");
        initDataTable();
        $('#umls-search-input').focus(); //ide says deprecated, but thinks, $ refers to jquery, which it does not
    }).catch((error) => ioHelper.showToast(error, 4000, ioHelper.interactionTypes.DANGER));
    //if(activeInputElement.value !== '') {
    /* for(const value of activeInputElement.value.split(' ')) {
        await addUMLSCodeToList(value);
    } */
    //}   
}

export async function openUMLSSearchWindow(path) {
    if ($('#umls-codes-modal')) $('#umls-codes-modal').remove();
    addUmlsSearchWindow(path)
    await addContextGroupsToWindow(path).then(() => {
        fillInputWithCurrentElement(path);
        $('#umls-codes-modal').classList.add("is-active");
        initDataTable();
        $('#umls-search-input').focus(); //ide says deprecated, but thinks, $ refers to jquery, which it does not
    }).catch((error) => ioHelper.showToast(error, 4000, ioHelper.interactionTypes.DANGER));
    $('#umls-search-button').click();
}

async function addContextGroupsToWindow(path) {
    codesInList = [];
    conceptGroupNames = [];
    tempContextGroups = [];

    const aliasses = metadataWrapper.getElementAliases(path);
    for (const input of aliasses) {
        const context = input.getAttribute('Context');
        const codes = input.getAttribute('Name');
        if (context != '' && context.startsWith('UMLS')) {
            if ((/UMLS CUI \[\d*,\d*\]/g).test(context)) {
                const groupName = context.split(',')[0] + ',x]';
                if (conceptGroupNames.indexOf(groupName) >= 0) {
                    selectedUMLSCodeGroup = $(`#concept-group-UMLS-CUI-\\[${groupName.split('[')[1].split(']')[0].replace(',', '-')}\\]`).querySelector('.content');
                } else
                    selectedUMLSCodeGroup = addUMLSCodeGroupToList(groupName).querySelector('.content');
            } else
                selectedUMLSCodeGroup = addUMLSCodeGroupToList(context).querySelector('.content');
            for (const value of codes.split(/[\s,]+/)) { 
                await addUMLSCodeToList(value.trim(), selectedUMLSCodeGroup).catch((error) => { throw error; });
            }
        } else if(context != '')
            tempContextGroups.push({ context: context, value: codes });
    }
    selectedUMLSCodeGroup = null;
}

function fillInputWithCurrentElement(path) {
    let currentElement = metadataWrapper.getElementDefByOID(path.last.value);
    if (path.last.element == ODMPath.elements.CODELISTITEM)
        currentElement = metadataWrapper.getCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem);
    let value = currentElement.getTranslatedQuestion(languageHelper.getCurrentLocale());
    if (!value || value === '')
        value = currentElement.getTranslatedDecode(languageHelper.getCurrentLocale());
    if (!value || value === '')
        value = currentElement.getAttribute('Name');
    if (value)
        $('#umls-search-input').value = value;
}

function initDataTable() {
    let tableElement = jq('#umls-search-table')
    if (!tableElement)
        return;
    if (jq.fn.DataTable.isDataTable(tableElement))
        return;
    tableElement.DataTable(dataTables["UMLS_SEARCH"]);
    
}

async function searchForUMLSCodes() {
    let searchString = $('#umls-search-input').value;
    requestHelper.getMDRData(encodeURIComponent(`${searchString}*`)).then((result) => {
        fillDataTable(result);
    }).catch((error) => {
        ioHelper.showToast(error, 4000, ioHelper.interactionTypes.DANGER);
    })

}

async function fillDataTable(result) {
    let processedData = mdrMetadataHelper.processConceptsData(result);
    let tableElement = jq('#umls-search-table');

    reloadedUMLSData = await processedData;
    if (tableElement) {
        tableElement.DataTable().clear();
        tableElement.DataTable().rows.add(reloadedUMLSData);
        tableElement.DataTable().draw();
        tableElement.DataTable().order().draw();
    }
}

window.addUMLSCodeToList = async(row) => {
    let data = reloadedUMLSData[row];
    for (const value of data.code) {
        await addUMLSCodeToList(value.concept, selectedUMLSCodeGroup).catch((error) => {
            ioHelper.showToast(error, 4000, ioHelper.interactionTypes.DANGER);
            return;
        });
    }
}

function addUMLSCodeGroupToList(value) {
    if (!value || value === '') {
        value = getNewConceptName();
    }
    let div = document.createElement('selectable-div');
    div.id = `concept-group-${value.split(' ').join('-').replace(',', '-')}`;
    div.setCallback('onUMLSCodeGroupClicked');
    div.setValue(value);
    $('#umls-codes-content').appendChild(div);
    let label = div.querySelector('label');
    label.ondrop = (event) => drop(event);
    label.ondragover = (event) => allowDrop(event);
    label.ondragleave = (event) => removeStyle(event);
    conceptGroupNames.push(value);
    codesInList[value] = [];

    let copyHelper;
    jq(function() {
        jq(".sortable-umls-group-list").sortable({
            connectWith: ".sortable-umls-group-list",
            cursor: "move",
            placeholder: "placeholder-umls-edit-line",
            dropOnEmpty: true,
            items: ".umls-search-item",
            helper: function(e, li) {
                copyHelper = li.clone().insertAfter(li);
                copyHelper[0].codeValue = li[0].codeValue;
                var $originals = li.children();
                var $helper = li.clone();
                jq($helper).addClass('placeholder-umls-edit')
                $helper.children().each(function(index) {
                    jq(this).width($originals.eq(index).width());
                });
                return $helper;
            },
            start: function(e, ui) {
                dragStartGroup = ui.item[0].closest('.sortable-umls-group-context');
            },
            stop: function(e, li) { 
                if(e.shiftKey || e.ctrlKey) {
                    let copyElement = copyHelper;
                    copyElement[0].querySelector('i').onclick = () => copyElement.remove();
                    
                }
                else copyHelper && copyHelper.remove();
            }

        }).disableSelection();
    });
    return div;
}

function onDrop(event, ui) {
    event.preventDefault();
    const ctrlPressed = event.ctrlKey;
    const shiftPressed = event.shiftKey;

}

function getNewConceptName() {
    let i = 1;
    let found = false;

    while (!found) {
        let name = `UMLS CUI [${i},x]`;
        if (conceptGroupNames.indexOf(name) < 0)
            return name;
        i++;
    }
}

export async function addUMLSCodeToList(code, codelist) {
    if (!codelist) {
        selectedUMLSCodeGroup = addUMLSCodeGroupToList().querySelector('#umls-main-div');
        let label = selectedUMLSCodeGroup.querySelector('label');
        label.classList.add('has-text-link');
        label.classList.add('is-size-5');
        codelist = selectedUMLSCodeGroup;
        //ioHelper.showToast("You have to chose a concept first by clicking it.", 4000, ioHelper.interactionTypes.DANGER);
        //return;
    }
    let ulDiv = codelist.querySelector('ul.sortable-umls-group-list');
    const codeListName = codelist.querySelector('label').innerText;

    let listItem = document.createElement('li');
    listItem.codeValue = code;
    listItem.classList = 'umls-search-item';
    let aliasDiv = document.createElement('div');
    aliasDiv.classList = 'is-fullwidth columns is-gapless mb-1';

    let aliasName = document.createElement('label');
    aliasName.classList = 'label column is-4';

    let i = document.createElement('i');
    i.classList = 'fa-solid fa-trash has-text-link mr-1';
    i.onclick = () => removeConceptCode(listItem, codeListName, code)
    aliasName.append(i);
    aliasName.appendChild(document.createTextNode(`${code}:`));
    aliasDiv.appendChild(aliasName);

    let meaningLabel = document.createElement('label');
    meaningLabel.classList = 'label column is-8 is-link';
    let name = umlsMap.get(code);
    if (typeof name === 'undefined') {
        meaningLabel.innerText = 'Loading'
        await requestHelper.getUMLSData(code).then(t => {
            umlsMap.set(t.CUI, t.STR[0]);
            meaningLabel.innerText = t.STR[0]
        }).catch((e) => meaningLabel.innerText = 'Error on loading definition');
    }
    else {
        meaningLabel.innerText = name;
    }
    aliasDiv.appendChild(meaningLabel);
    listItem.appendChild(aliasDiv)
    ulDiv.appendChild(listItem);
    codesInList[codeListName].push(code);
    
}


function removeConceptCode(listElement, codeListName, code) {
    listElement.parentElement.removeChild(listElement);
    //codesInList[codeListName].splice(codesInList[codeListName].indexOf(code), 1);
}

function addConceptCodesToElement(path) {
    const lastElement = path.last;
    const isCodeListitem = lastElement.element == 'codelistitem';
    if (isCodeListitem)
        metadataWrapper.deleteElementAliasesForCodeList(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem);
    else
        metadataWrapper.deleteElementAliasesForElement(lastElement.value);

    let codes = {};
    [...$$('#umls-codes-content .sortable-umls-group-list')].forEach(ac => codes[ac.contextName] = [...ac.querySelectorAll('.umls-search-item')].filter(li => li.codeValue != '').map(li => li.codeValue));
    Object.keys(codes).forEach(context => { //conceptGroupNames.forEach(context => {
        let i = 1;
        if ((/UMLS CUI \[\d*,x\]/g).test(context)) {
            if (isCodeListitem)
                codes[context].forEach(value => {
                    if(value && context)
                        metadataWrapper.setElementAliasForCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem, context.replace('x', i++), value)
                });
            else
                codes[context].forEach(value => {
                    if(value && context)
                        metadataWrapper.setElementAliasForElement(lastElement.value, context.replace('x', i++), value)
                });
        } else {
            if(codes[context] && codes[context].length > 0 && context) {
                if (isCodeListitem)
                metadataWrapper.setElementAliasForCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem, context, codes[context].join(' '));
            else
                metadataWrapper.setElementAliasForElement(lastElement.value, context, codes[context].join(' '));
            }
        }
    });
    if (isCodeListitem)
        tempContextGroups.forEach(tc => {
            if(tc.context && tc.value)
                metadataWrapper.setElementAliasForCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem, tc.context, tc.value)
        });
    else {
        tempContextGroups.forEach(tc => {
            if(tc.context && tc.value)
                metadataWrapper.setElementAliasForElement(lastElement.value, tc.context, tc.value)
        });
    }
        
    $("#umls-codes-modal").remove();
    metadataModule.reloadDetailsPanel();
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
    ioHelper.dispatchGlobalEvent("UMLSCodes edited", metadataWrapper.getElementAliases(path));
}

window.onUMLSCodeGroupClicked = (e) => {
    if (selectedUMLSCodeGroup) {
        let oldElement = selectedUMLSCodeGroup.querySelector('label');
        if ([...oldElement.classList].indexOf('has-text-link') >= 0) {
            oldElement.classList.remove('has-text-link');
            oldElement.classList.remove('is-size-5');
        }
    }
    if (e.target.closest('#umls-main-div') === selectedUMLSCodeGroup) {
        selectedUMLSCodeGroup = null;
        return;
    }
    e.target.classList.add('has-text-link');
    e.target.classList.add('is-size-5');
    selectedUMLSCodeGroup = e.target.closest('#umls-main-div');
}

function dragStart(event) {
    event.target.id = 'temp-list-id';
    event.dataTransfer.setData("text", event.target.id);
    event.dataTransfer.effectAllowed = "copyMove";
}

function drop(event) {
    event.preventDefault();
    const ctrlPressed = event.ctrlKey;
    let liTarget = event.target.closest('li');
    var data = event.dataTransfer.getData("text");
    let liElement = $(`#${data}`);
    liElement.id = '';
    const nameOldContextGroup = liElement.closest("selectable-div > div").querySelector('label').innerText;
    const code = liElement.querySelector('label').innerText;
    const targetCode = liTarget.querySelector('label').innerText;
    const closestDiv = liTarget.closest('div');
    const nameNewContextGroup = closestDiv.querySelector('label').innerText;
    const hoverIndex = codesInList[nameNewContextGroup].indexOf(targetCode);
    if (nameNewContextGroup !== nameOldContextGroup && codesInList[nameNewContextGroup].indexOf(code) >= 0) {
        ioHelper.showToast("Code already exists in context", 4000, ioHelper.interactionTypes.WARNING);
    } else if (nameNewContextGroup === nameOldContextGroup) {
        if (hoverIndex >= codesInList[nameOldContextGroup].indexOf(code)) {
            codesInList[nameOldContextGroup].splice(hoverIndex, 0, code);
            codesInList[nameOldContextGroup].splice(codesInList[nameOldContextGroup].indexOf(code), 1);
        } else {
            codesInList[nameOldContextGroup].splice(codesInList[nameOldContextGroup].indexOf(code), 1);
            codesInList[nameOldContextGroup].splice(hoverIndex, 0, code);
        }
        closestDiv.querySelector('ul').insertBefore(liElement, liTarget); //document.getElementById(data));
    } else {

        codesInList[nameNewContextGroup].splice(hoverIndex, 0, code);
        if (!ctrlPressed) {
            codesInList[nameOldContextGroup].splice(codesInList[nameOldContextGroup].indexOf(code), 1);
            closestDiv.querySelector('ul').insertBefore(liElement, liTarget); //document.getElementById(data));
        } else {
            let clonedElement = liElement.cloneNode(true);
            closestDiv.querySelector('ul').insertBefore(clonedElement, liTarget); //document.getElementById(data));
            clonedElement.querySelector('label').innerText = code;
            clonedElement.querySelector('span').innerText = liElement.querySelector('span').innerText;
        }

    }
    jq(liTarget).removeAttr('style');
}

function allowDrop(event) {
    event.preventDefault();
    if (event.ctrlKey)
        event.dataTransfer.dropEffect = "copy";
    else
        event.dataTransfer.dropEffect = "move";
    let realTarget = event.target.closest('li');
    jq(realTarget).css('color', '#485fc7');
    jq(realTarget).css('border-top', '2px solid #485fc7');
}

function removeStyle(event) {
    let realTarget = event.target.closest('li');
    jq(realTarget).removeAttr('style');
}