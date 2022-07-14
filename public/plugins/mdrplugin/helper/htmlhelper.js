import * as languageHelper from "../../../js/helper/languagehelper.js"
import * as metadataModule from "../../../js/metadatamodule.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as requestHelper from "./requesthelper.js"
import * as mdrMetadataHelper from "./mdrmetadatahelper.js"
import dataTables from "./datatables.js" 
import ODMPath from "../../../js/odmwrapper/odmpath.js"
import mdrSearchForm from "../html/mdr-search-form.js"
import itemDetailsTable from "../html/item-details-table.js"
import * as jDataTables from "../libs/datatables.min.js"


$ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

let timeoutHandle = null;
let reloadedMdrData = [];
let currentType = null;

/* jq(document).on('MetadataItemgroupClicked MetadataItemClicked', function(e) {
    showMdrSearchOption(true);
    if($('#mdr-search-option').isActive()) {
        console.log(metadataModule.currentPath.last.element)
        switchMdrSearchTable(metadataModule.currentPath.last.element);
    }
}); */
jq(document).on('LanguageChanged', () => {
    if($('#mdr-search-option').isActive()) {
        reloadData(metadataModule.currentPath.last.element)
    }
});

export async function addMdrSearchOption() {
    if($('#mdr-search-option'))
        return;
    addMdrSearchPanel();
    let list = $('#details-panel .sidebar-options');
    addListenerToAllLiElements(list);
    let li = document.createElement("li");
    li.className = 'sidebar-option is-activable is-hidden';
    li.id = 'mdr-search-option';
    li.onclick = (e) => mdrSearchOptionClicked(e);
    let mdrSearchIcon = document.createElement("i");
    mdrSearchIcon.className = "fa-solid fa-magnifying-glass";
    let span = document.createElement('span');
    span.setAttribute('i18n', 'mdr-search-option');
    li.appendChild(mdrSearchIcon);
    li.appendChild(span);
    list.insertBefore(li, $('#remove-button'));
    localize();
    initItemPopupDataTableContainer();

    jq(document).on('MetadataPanelLoaded ', function(e) {
        let currentElement = metadataModule.currentPath.last.element;
        if(currentElement === ODMPath.elements.ITEMGROUP || currentElement === ODMPath.elements.ITEM) {
            showMdrSearchOption(true);
            if($('#mdr-search-option').isActive()) {
                switchMdrSearchTable(currentElement);
            }
        }
        else
            showMdrSearchOption(false);
    });
}

function addMdrSearchPanel() {
    let box = document.createElement('div');
    box.innerHTML = mdrSearchForm;
    box.id = 'mdr-search-options';
    box.className = "box-content is-hidden";
    $('#details-panel div.box').appendChild(box);
    //initDataTable();
    $('#mdr-search-input').addEventListener('input', () => loadMdrData());
    localize();
}

function showTable(type) {
    switch (type) {
        case ODMPath.elements.ITEMGROUP:
            $('#mdr-data-table-item').hide();
            $('#mdr-data-table-codelistitem').hide();
            $('#mdr-data-table-itemgroup').show();
            break;
        case ODMPath.elements.ITEM:
            $('#mdr-data-table-item').show();
            $('#mdr-data-table-codelistitem').hide();
            $('#mdr-data-table-itemgroup').hide();
            break;
        case ODMPath.elements.CODELISTITEM:
            $('#mdr-data-table-item').hide();
            $('#mdr-data-table-codelistitem').show();
            $('#mdr-data-table-itemgroup').hide();
            break;
    }
}

function initDataTable(type) {
    let tableElement;
    switch (type) {
        case ODMPath.elements.ITEMGROUP:
            tableElement = jq('#mdr-data-table-itemgroup');
            break;
        case ODMPath.elements.ITEM:
            tableElement = jq('#mdr-data-table-item');
            break;
        case ODMPath.elements.CODELISTITEM:
            tableElement = jq('#mdr-data-table-codelistitem');
            break;
    }
    if(!tableElement)
        return;
    if(jq.fn.DataTable.isDataTable(tableElement))
        return;
    tableElement.DataTable(dataTables[type]);
   
}

function addListenerToAllLiElements(list) {
    let filter = Array.prototype.filter;
    let elements = list.querySelectorAll('li');
    filter.call(elements, (e) => e.id !== 'save-button')
    .forEach(e => e.addEventListener('click', () => $("#mdr-search-options").hide()));
}

async function localize() {
    let elementList = ['#mdr-search-option span[i18n]', '#mdr-search-label[i18n]', '#mdr-search-result-label[i18n]']

    elementList.forEach(el => {
        let element = $(el);
        if(element)
            element.textContent = languageHelper.getTranslation(element.getAttribute("i18n"));
    });
 }

window.mdrSearchOptionClicked = async function(e) {
    // Save the element if it has been updated and another sidebar option is selected
    if ($("#save-button").isHighlighted() && e.target.id != $(".sidebar-option.is-active").id) await saveElement();

    $("#details-panel .sidebar-option.is-active").deactivate();
    e.target.activate();

    $("#foundational-options").hide();
    $("#extended-options").hide();
    $("#duplicate-options").hide();
    $("#mdr-search-options").show();

    switchMdrSearchTable(metadataModule.currentPath.last.element);
}

function switchMdrSearchTable(mdrSearchType) {
    if(currentType === mdrSearchType)
        return;
    showTable(mdrSearchType);
    initDataTable(mdrSearchType);
    if($('#mdr-search-input').value !== '')
        reloadData(mdrSearchType)
    currentType = mdrSearchType;
}

function showMdrSearchOption(show) {
    let classList = $('#mdr-search-option').classList;
    if(show){
        if([...classList].indexOf('is-hidden') >= 0) classList.remove('is-hidden');
    }
    else {
        if([...classList].indexOf('is-hidden') < 0) classList.add('is-hidden');
    }
}

function loadMdrData() {
    if(timeoutHandle)
        clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() =>  reloadData(metadataModule.currentPath.last.element), 800);     
}

function reloadData(mdrSearchType) {
    requestHelper.getMdrData(mdrSearchType, encodeURIComponent(`${$('#mdr-search-input').value}*`), setTableData)
    .catch(() => ioHelper.showToast("MDR service is not available at the moment", 3000, ioHelper.interactionTypes.WARNING));
}

function setTableData(mdrSearchType, tableData) {
    let data = JSON.parse(tableData);
    let processedData;
    let tableElement;
    switch(mdrSearchType) {
        case ODMPath.elements.ITEMGROUP:
            processedData = processItemGroupTableData(data);
            tableElement = jq('#mdr-data-table-itemgroup')
            break;
        case ODMPath.elements.ITEM:
            processedData = processItemTableData(data);
            tableElement = jq('#mdr-data-table-item')
            break;
        case ODMPath.elements.CODELISTITEM:
            processedData = processCodelistitemTableData(data);
            tableElement = jq('#mdr-data-table-codelistitem')
        break;
    }
    reloadedMdrData = processedData;
    if(tableElement) {
        tableElement.DataTable().clear();
        tableElement.DataTable().rows.add(reloadedMdrData);
        tableElement.DataTable().draw();
    }
}
function processItemGroupTableData(data) {
    let processedData = [];
    data.content.forEach(c => processedData.push(mdrMetadataHelper.structureItemgroupData(c)));
    return processedData;
}

function processItemTableData(data) {
    let processedData = [];
    data.content.forEach(c => processedData.push(mdrMetadataHelper.structureItemData(c)));
    return processedData;
}

window.showAddItemgroupFromMDRMessage = (index) => {
    const itemgroup = reloadedMdrData[index];
    const currentPath = metadataModule.currentPath;
    const itemgroupOID = currentPath.last.value;
    const currentItemsFound = metadataWrapper.getItemsByItemGroup(itemgroupOID).length > 0;
    const itemsFound = itemgroup.items.length > 0;

    if(!currentItemsFound && !itemsFound)
    addItemgroupFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_OLD);
    else if (currentItemsFound && !itemsFound) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'The current itemgroup has items, but the itemgroup coming from MDR does not. Do you wish to keep them?',
        {
            ['Keep items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['Delete items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
        });
    }
    else if (!currentItemsFound && itemsFound) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'Items found. Do you want to add the itemgroup with or without the corresponding items?',
        {
            ['Without items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['With items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
        });
    }
    else {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'The old itemgroup as well as the itemgroup coming from MDR have corresponding items. Do you want to keep the old ones, replace them or combine them?',
        {
            ['Keep old items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['Keep new items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
            ['Combine items']: () => mdrMetadataHelper.addItemgroupFromMDR(itemgroupOID, itemgroup, mdrMetadataHelper.IntegrationMode.COMBINE),
        });
    }  
}

window.showAddItemFromMDRMessage = (index) => {
    const item = reloadedMdrData[index];
    const currentPath = metadataModule.currentPath;
    const itemOID = currentPath.last.value;
    let codeListRef = metadataWrapper.getElementDefByOID(itemOID).querySelector("CodeListRef");
    const codelistItemsFound = item.codelistitems.length > 0;

    if(!codeListRef && !codelistItemsFound)
        mdrMetadataHelper.addItemFromMDR(itemOID, item, false);
    else if (codeListRef && !codelistItemsFound) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'The current element has a codelist, but the item coming from MDR does not. Do you wish to keep it?',
        {
            ['Keep Codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['Delete Codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
        });
    }
    else if (!codeListRef && codelistItemsFound) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'Codelist found. Do you want to add the item with or without the corresponding codelist?',
        {
            ['Without Codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['With Codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
        });
    }
    else {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'The old item as well as the item coming from MDR have a codelist. Do you want to keep the old one or update it?',
        {
            ['Keep old codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_OLD),
            ['Update codelist']: () => mdrMetadataHelper.addItemFromMDR(itemOID, item, mdrMetadataHelper.IntegrationMode.KEEP_NEW),
        });
    }  
}

function initItemPopupDataTableContainer() {
    $('#item-details-table-container').onclick = (e) => {e.preventDefault(), e.stopPropagation()}
   
}

function reInitItemPopupDataTable() {
    if($('#item-details-table_wrapper')) 
        $('#item-details-table-container').removeChild($('#item-details-table_wrapper'));
    $('#item-details-table-container').innerHTML = itemDetailsTable;
    let tableElement = jq('#item-details-table');
    if(jq.fn.DataTable.isDataTable(tableElement))
        return;
    tableElement.DataTable(dataTables.ITEM_POPUP);
}

window.showItemDetails = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    reInitItemPopupDataTable();
    //$('#item-details-table-container').hide();
    const itemGroup = reloadedMdrData[index];
    let preprocessedItems = itemGroup.data.items.map(item => mdrMetadataHelper.structureItemData(item.definition));
    let tableElement = jq('#item-details-table');
    tableElement.DataTable().clear();
    tableElement.DataTable().rows.add(preprocessedItems);
    //tableElement.DataTable().draw();
    jq('#item-details-table-container').css({'top':e.pageY,'left':e.pageX, 'position':'absolute', 'border':'1px solid darkblue', 'z-index': 50});
    $('#item-details-table-container').show();
    jq(tableElement.DataTable()).css('width', '100%');

    tableElement.DataTable().columns.adjust().draw();

}

$('body').addEventListener('click', () => {
    if($('#item-details-table-container'))
        $('#item-details-table-container').hide();
});