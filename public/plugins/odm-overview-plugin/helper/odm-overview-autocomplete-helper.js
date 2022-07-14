import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"
class AutocompleteElement {
    constructor(value, label) {
        this._value = value;
        this._label = label;
    }

    get value() {
        return this._value;
    }

    get label() {
        return this._label ? `${this._label} (${this._value})` : this._value;
    }
}

let currentType;
let currentMode;
let currentInput;
let currentValue;
let currentTokenIndex;
let searchType;
//let currentPart;
let enabledParts;
let elements;
let forceSearch = false;
let lastRealTokenIndex = -1;
const typeArray = [ODMPath.elements.STUDYEVENT, ODMPath.elements.FORM, ODMPath.elements.ITEMGROUP, ODMPath.elements.ITEM];

export const modes = {
    CODE: 1
}

const availableParts = {
    ITEM: 1,
    VALUE: 2
}


let filters = {};

let $m;
let $$m;

let callback;

export function setMetadata(metadata) {
    $m = query => metadata.querySelector(query);
    $$m = query => metadata.querySelectorAll(query);
}

export const enableAutocomplete = (input, mode, selectCallback, type) => {
    callback = selectCallback;
    // Set the mode to later adjust the input parts
    input.setAttribute("autocomplete-mode", mode);
    searchType = type;
    if (type == ODMPath.elements.CODELISTITEM) {
        searchType = ODMPath.elements.ITEM;
        filters[type] = true;
    }


    // Start autocomplete when element gets focus
    // TODO: Check if all listeners are really required -- use input within keydown/keyup?
    input.addEventListener("input", inputEventListener);
    input.addEventListener("click", inputEventListener);
    input.addEventListener("keydown", keydownEventListener);
    input.addEventListener("blur", blurEventListener);

    // Close the autocomplete list when the user clicks somewhere else
    ioHelper.addGlobalEventListener("click", closeLists);
}

const inputEventListener = event => {
    if (event.detail.skipRender) return;

    setCurrentModeAndEnabledParts(event.target);
    closeLists(null, true);

    setCurrentPartAndInput(event.target);

    const list = document.createElement("div");
    list.className = "odm-autocomplete-list has-scrollbar-link";

    setElements();
    const searchValue = removeParentheses(currentValue.toLowerCase());
    const matchingElements = elements.filter(element => searchValue.split(' ').every(s => element.label.toLowerCase().includes(s)));

    for (const element of matchingElements) {
        const option = document.createElement("div");
        option.className = "autocomplete-option";
        option.textContent = element.label;
        option.onclick = () => elementSelected(element);
        list.appendChild(option);
    }

    if (list.hasChildNodes()) currentInput.parentNode.appendChild(list);
}

const keydownEventListener = event => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
        forceSearch = true;
    }
    if (event.key == "Enter") {
        const firstOption = event.target.parentNode.querySelector(".autocomplete-option");
        if (firstOption) firstOption.click();
    }
}

const blurEventListener = () => {
    elements = null;
}

const setCurrentModeAndEnabledParts = input => {
    if (input == currentInput) return;

    currentMode = parseInt(input.getAttribute("autocomplete-mode"));
    enabledParts = {...availableParts };
    switch (currentMode) {
        case modes.CODE:
            delete enabledParts.VALUE;
            break;
        default:
            delete enabledParts.ITEM;
            delete enabledParts.VALUE;
            break;
    }

}

const closeLists = (event, keepElements) => {
    document.querySelectorAll(".autocomplete-list, .odm-autocomplete-list").forEach(list => {
        if (event && event.target && (event.target == currentInput || event.target.classList.contains("autocomplete-option"))) return;
        if (!keepElements) elements = null;
        list.remove();
    });
}

const setCurrentPartAndInput = input => {

    const substring = input.value.substring(0, input.selectionStart);
    const tokenIndex = substring.split(" ").length - 1;

    if (tokenIndex == 0) lastRealTokenIndex = -1;
    currentTokenIndex = tokenIndex;

    currentInput = input;
    currentValue = removeQuotes(currentInput.value.split(" ")[currentTokenIndex]);
    if (forceSearch) {
        currentValue = '';
        for (let i = lastRealTokenIndex + 1; i <= tokenIndex; i++) {
            currentValue += ` ${removeQuotes(currentInput.value.split(" ")[i])}`;
        }
    }

    let type;
    if (currentValue.length > 0) type = searchType;
    else if (currentTokenIndex == 0 && typeArray.indexOf(searchType) > 0) type = ODMPath.elements.STUDYEVENT;
    else if (currentTokenIndex == 1 && typeArray.indexOf(searchType) > 1) type = ODMPath.elements.FORM;
    else if (currentTokenIndex == 2 && typeArray.indexOf(searchType) > 2) type = ODMPath.elements.ITEMGROUP;
    else type = searchType;

    //needed to make it possible to search for items while in other mode when typing
    if (forceSearch) type = searchType;
    if (type != searchType) lastRealTokenIndex = tokenIndex - 1;

    forceSearch = false;

    removeFilters(type);

    if (tokenIndex != currentTokenIndex || input != currentInput || type != currentType) elements = null;

    currentType = type;
}

const setElements = () => {
    if (elements) return;
    elements = getItemElements()
}

const getItemElements = () => {
    let items = getItemPaths(currentType)
    return items.map(item => {
        let value;
        switch (currentType) {
            case ODMPath.elements.STUDYEVENT:
                value = metadataWrapper.getElementDefByOID(item.studyEventOID).getAttribute('Name');
                break;
            case ODMPath.elements.FORM:
                value = metadataWrapper.getElementDefByOID(item.formOID).getAttribute('Name');
                break;
            case ODMPath.elements.ITEMGROUP:
                value = metadataWrapper.getElementDefByOID(item.itemGroupOID).getTranslatedDescription(languageHelper.getCurrentLocale());
                break;
            case ODMPath.elements.ITEM:
                value = metadataWrapper.getElementDefByOID(item.itemOID).getTranslatedQuestion(languageHelper.getCurrentLocale());
                break;
        }
        if (!value) value = 'No Translation';
        return new AutocompleteElement(
            item,
            value
        )
    });
}

export function addFilter(type, oid) {
    filters[type] = oid;

}

export function removeFilters(type) {
    for (let i = typeArray.indexOf(type); i < typeArray.length; i++) filters[typeArray[i]] = null;
}

function getItemPaths(type) {
    if (!type) type = ODMPath.elements.ITEM;
    const itemPaths = [];
    [...$$m(`Protocol StudyEventRef`)]
    .filter(ser => ser.getAttribute('StudyEventOID') == filters[ODMPath.elements.STUDYEVENT] || filters[ODMPath.elements.STUDYEVENT] == null).forEach(ser => {
        if (type == ODMPath.elements.STUDYEVENT) itemPaths.push(new ODMPath(ser.getAttribute('StudyEventOID')));
        [...$$m(`StudyEventDef[OID="${ser.getAttribute('StudyEventOID')}"] FormRef`)]
        .filter(fr => fr.getAttribute('FormOID') == filters[ODMPath.elements.FORM] || filters[ODMPath.elements.FORM] == null).forEach(fr => {
            if (type == ODMPath.elements.FORM) itemPaths.push(new ODMPath(ser.getAttribute('StudyEventOID'), fr.getAttribute('FormOID')));
            [...$$m(`FormDef[OID="${fr.getAttribute('FormOID')}"] ItemGroupRef`)]
            .filter(igr => igr.getAttribute('ItemGroupOID') == filters[ODMPath.elements.ITEMGROUP] || filters[ODMPath.elements.ITEMGROUP] == null).forEach(igr => {
                if (type == ODMPath.elements.ITEMGROUP) itemPaths.push(new ODMPath(ser.getAttribute('StudyEventOID'), fr.getAttribute('FormOID'), new ODMPath(igr.getAttribute('ItemGroupOID'))));
                [...$$m(`ItemGroupDef[OID="${igr.getAttribute('ItemGroupOID')}"] ItemRef`)]
                .filter(ir => ir.getAttribute('ItemOID') == filters[ODMPath.elements.ITEM] || filters[ODMPath.elements.ITEM] == null).forEach(ir => {
                    if (type == ODMPath.elements.ITEM) {
                        if (filters[ODMPath.elements.CODELISTITEM]) {
                            if (metadataWrapper.getCodeListOIDByItem(ir.getAttribute('ItemOID'))) itemPaths.push(new ODMPath(ser.getAttribute('StudyEventOID'), fr.getAttribute('FormOID'), igr.getAttribute('ItemGroupOID'), ir.getAttribute('ItemOID')));
                        } else {
                            itemPaths.push(new ODMPath(ser.getAttribute('StudyEventOID'), fr.getAttribute('FormOID'), igr.getAttribute('ItemGroupOID'), ir.getAttribute('ItemOID')));
                        }
                    }
                });
            });
        });
    });
    return itemPaths;
}

const elementSelected = element => {
    // If a value is selected, add quotes

    filters[element.value.last.element] = element.value.last.value;

    if (typeArray.indexOf(currentType) < typeArray.indexOf(searchType)) {
        currentInput.value += element.value.last.value;
    } else {
        currentInput.value = ODMPath.parseAbsolute(element.value.toString()).toString();
    }

    closeLists();
    if (currentType != searchType) {
        currentInput.value += " ";
        currentInput.focus();
        currentInput.dispatchEvent(new CustomEvent("input", { detail: { skipRender: false } }));
    } else {
        callback(element);
    }
}

const removeQuotes = string => string.replace(/['"]/g, "");

const removeParentheses = string => string.replace(/[\(\)]/g, "");