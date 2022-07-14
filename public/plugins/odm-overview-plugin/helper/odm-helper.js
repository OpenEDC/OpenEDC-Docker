import * as expressionHelper from "../../../js/helper/expressionhelper.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as odmOverviewTable from "../html/odm-overview-table.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"
import * as metadataModule from "../../../js/metadatamodule.js"

let $m;
let $$m;

export function init() {
    let metadata = metadataWrapper.getMetadata();
    $m = query => metadata.querySelector(query);
    $$m = query => metadata.querySelectorAll(query);
}

export function moveElement(targetElementDef, sourceElementRef, nextSiblingPath, elementTypeOnDrag) {

    if (nextSiblingPath.last.element == elementTypeOnDrag) {
        targetElementDef.insertBefore(sourceElementRef, metadataWrapper.getElementRefByOID(nextSiblingPath.last.element, nextSiblingPath));
    } else {
        targetElementDef.appendChild(sourceElementRef);
    }
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}

export function copyElement(deepCopy, elementPath, targetElementRef, nextSiblingPath, elementTypeOnDrag, currentDragPath) {
    let newElementOID;
    switch (elementPath.last.element) {
        case ODMPath.elements.STUDYEVENT:
            newElementOID = metadataWrapper.copyStudyEvent(elementPath.studyEventOID, deepCopy).newStudyEventOID;
            break;
        case ODMPath.elements.FORM:
            newElementOID = metadataWrapper.copyForm(elementPath.formOID, deepCopy, elementPath.studyEventOID).newFormOID;
            break;
        case ODMPath.elements.ITEMGROUP:
            newElementOID = metadataWrapper.copyItemGroup(elementPath.itemGroupOID, deepCopy, elementPath.formOID).newItemGroupOID;
            break;
        case ODMPath.elements.ITEM:
            newElementOID = metadataWrapper.copyItem(elementPath.itemOID, deepCopy, elementPath.itemGroupOID).newItemOID;
            currentDragPath.set(ODMPath.elements.ITEM, newElementOID);
    }
    let sourceElementRef;
    if (elementTypeOnDrag == ODMPath.elements.CODELISTITEM) {
        const codeListOID = metadataWrapper.getCodeListOIDByItem(currentDragPath.itemOID);
        sourceElementRef = metadataWrapper.getCodeListItem(codeListOID, currentDragPath.codeListItem);
    } else {
        sourceElementRef = metadataWrapper.getElementRefByOID(elementTypeOnDrag, currentDragPath);
    }
    moveElement(targetElementRef, sourceElementRef, nextSiblingPath, elementTypeOnDrag)
    ioHelper.showToast(languageHelper.getTranslation("copy-added"), 2500);
    return true;
}

export function handleItemDataType(itemOID, dataType) {
    let dataTypeIsCodeList = dataType.startsWith("codelist");
    let codeListType = dataTypeIsCodeList ? dataType.split("-")[1] : null;

    let codeListRef = metadataWrapper.getElementDefByOID(itemOID).querySelector("CodeListRef");
    if (codeListRef && !dataTypeIsCodeList) {
        metadataWrapper.removeCodeListRef(itemOID, codeListRef.getAttribute("CodeListOID"));
    } else if (!codeListRef && dataTypeIsCodeList) {
        metadataWrapper.createCodeList(itemOID);
    }
    if (dataTypeIsCodeList) {
        metadataWrapper.setItemDataType(itemOID, codeListType);
        metadataWrapper.setCodeListDataType(metadataWrapper.getCodeListOIDByItem(itemOID), codeListType);
    } else {
        metadataWrapper.setItemDataType(itemOID, dataType);
    }
}

export function saveConditionPreCheck(currentPath, formalExpression, check) {
    const currentCondition = metadataWrapper.getElementCondition(currentPath.last.element, currentPath);
    if (formalExpression && currentCondition && formalExpression == currentCondition.getFormalExpression()) return;
    if (formalExpressionContainsError(formalExpression)) return true;

    const currentElementRef = metadataWrapper.getElementRefByOID(currentPath.last.element, currentPath);
    if (currentCondition) {
        const elementsHavingCondition = metadataWrapper.getElementRefsHavingCondition(currentCondition.getOID());
        if (elementsHavingCondition.length > 1) {
            if (typeof check != 'undefined') saveConditionForElements(formalExpression, currentCondition, [currentElementRef], check, false);
            else {
                ioHelper.showMessage(languageHelper.getTranslation("note"), languageHelper.getTranslation("condition-multiple-references-hint"), {
                    [languageHelper.getTranslation("update-all")]: () => saveConditionForElements(formalExpression, currentCondition, elementsHavingCondition, true, true),
                    [languageHelper.getTranslation("update-current-only")]: () => saveConditionForElements(formalExpression, currentCondition, [currentElementRef], false, true)
                });
                return true;
            }
        } else {
            saveConditionForElements(formalExpression, currentCondition, [currentElementRef], true, false);
        }
    } else {
        saveConditionForElements(formalExpression, null, [currentElementRef], true, false);
    }
}

function saveConditionForElements(formalExpression, currentCondition, elementRefs, changeAll, promptInitiated) {
    const identicalCondition = metadataWrapper.getConditions().find(condition => condition.getFormalExpression() == formalExpression);

    let conditionOID;
    if (formalExpression && currentCondition && changeAll && !identicalCondition) {
        metadataWrapper.setConditionFormalExpression(currentCondition.getOID(), formalExpression);
    } else {
        if (identicalCondition) conditionOID = identicalCondition.getOID();
        else if (formalExpression) conditionOID = metadataWrapper.createCondition(formalExpression);
        elementRefs.forEach(elementRef => metadataWrapper.setElementRefCondition(elementRef, conditionOID));
    }

    if (currentCondition && (!formalExpression || currentCondition.getOID() != conditionOID)) metadataWrapper.safeDeleteCondition(currentCondition.getOID());
    if (promptInitiated) odmOverviewTable.updateElements(changeAll);
}

function formalExpressionContainsError(formalExpression) {
    if (formalExpression && !expressionHelper.parse(formalExpression)) {
        ioHelper.showMessage(languageHelper.getTranslation("error"), languageHelper.getTranslation("formal-expression-error"));
        return true;
    }
}

export function saveMeasurementUnitPreCheck(currentPath, symbol, check, multiEdit) {
    const currentMeasurementUnit = metadataWrapper.getItemMeasurementUnit(currentPath.last.value);
    if (symbol && currentMeasurementUnit && symbol == currentMeasurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale())) return;

    const currentItemDef = metadataWrapper.getElementDefByOID(currentPath.last.value);
    if (currentMeasurementUnit) {
        const elementsHavingMeasurementUnit = metadataWrapper.getItemDefsHavingMeasurementUnit(currentMeasurementUnit.getOID());
        if (elementsHavingMeasurementUnit.length > 1) {
            if (typeof check != 'undefined') saveMeasurementUnitForElements(symbol, currentMeasurementUnit, [currentItemDef], check, false);
            ioHelper.showMessage(languageHelper.getTranslation("note"), languageHelper.getTranslation("measurement-unit-multiple-references-hint"), {
                [languageHelper.getTranslation("update-all")]: () => saveMeasurementUnitForElements(symbol, currentMeasurementUnit, elementsHavingMeasurementUnit, true, true, multiEdit),
                [languageHelper.getTranslation("update-current-only")]: () => saveMeasurementUnitForElements(symbol, currentMeasurementUnit, [currentItemDef], false, true, multiEdit)
            });
            return true;
        } else {
            saveMeasurementUnitForElements(symbol, currentMeasurementUnit, [currentItemDef], true, false);
        }
    } else {
        saveMeasurementUnitForElements(symbol, null, [currentItemDef], true, false);
    }
}

function saveMeasurementUnitForElements(symbol, currentMeasurementUnit, itemDefs, changeAll, promptInitiated) {
    const identicalMeasurementUnit = metadataWrapper.getMeasurementUnits().find(measurementUnit => measurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale()) == symbol);

    let measurementUnitOID;
    if (symbol && currentMeasurementUnit && changeAll && !identicalMeasurementUnit) {
        metadataWrapper.setMeasurementUnitSymbol(currentMeasurementUnit.getOID(), symbol);
    } else {
        if (identicalMeasurementUnit) measurementUnitOID = identicalMeasurementUnit.getOID();
        else if (symbol) measurementUnitOID = metadataWrapper.createMeasurementUnit(symbol);
        itemDefs.forEach(itemDef => metadataWrapper.setItemDefMeasurementUnit(itemDef, measurementUnitOID));
    }

    if (currentMeasurementUnit && (!symbol || currentMeasurementUnit.getOID() != measurementUnitOID)) metadataWrapper.safeDeleteMeasurementUnit(currentMeasurementUnit.getOID());
    if (promptInitiated) {
        if (multiEdit) odmOverviewTable.updateElements(changeAll);
        else odmOverviewTable.updateItem(changeAll)
    }
}

export function createNewCodelistForMultipleItems(listName, items, itemPaths, deepCopy, checked, callback) {
    let validItemPaths = getValidItemsForCodelistEdit(itemPaths);
    if (!checked && validItemPaths.length < itemPaths.length) {
        showNoChoiceElementModal(() => createNewCodelistForMultipleItems(listName, items, validItemPaths, deepCopy, true, callback));
        return true;
    }
    if (validItemPaths.length == 0) return;
    let newCodeListOID = createCodeList(listName, validItemPaths.shift(), items);
    validItemPaths.forEach(path => referenceCodelist(newCodeListOID, path, deepCopy));
    callback(validItemPaths.length + 1);
}

export function copyCodelistToMultipleItems(codeListOID, itemPaths, deepCopy, checked, callback) {
    let validItemPaths = getValidItemsForCodelistEdit(itemPaths);
    if (!checked && validItemPaths.length < itemPaths.length) {
        showNoChoiceElementModal(() => copyCodelistToMultipleItems(codeListOID, validItemPaths, deepCopy, true, callback));
        return true;
    }
    if (validItemPaths.length == 0) return;
    validItemPaths.forEach(path => referenceCodelist(codeListOID, path, deepCopy));
    callback(validItemPaths.length);
}

function getValidItemsForCodelistEdit(itemPaths) {
    return itemPaths.filter(path => metadataWrapper.getCodeListOIDByItem(path.itemOID));
}

function showNoChoiceElementModal(callback) {
    ioHelper.showMessage(languageHelper.getTranslation("note"), 'You chose items which datatype is not fit for codelists. Do you want to add the codelist to all remaining items?', {
        [languageHelper.getTranslation("yes")]: callback
    });
}

export function referenceCodelist(codeListOID, itemPath, deepCopy) {
    const externalCodeListOID = codeListOID;
    if (!externalCodeListOID) {
        ioHelper.showMessage(languageHelper.getTranslation("error"), languageHelper.getTranslation("codelist-not-found-error"));
        return;
    };

    const currentCodeListOID = metadataWrapper.getCodeListOIDByItem(itemPath.itemOID);
    metadataWrapper.removeCodeListRef(itemPath.itemOID, currentCodeListOID);
    metadataWrapper.addCodeListRef(itemPath.itemOID, externalCodeListOID);

    if (deepCopy) unreferenceCodelist(itemPath);
}

export function unreferenceCodelist(itemPath) {
    const currentCodeListOID = metadataWrapper.getCodeListOIDByItem(itemPath.itemOID);
    const newCodeListOID = metadataWrapper.copyCodeList(currentCodeListOID);
    metadataWrapper.removeCodeListRef(itemPath.itemOID, currentCodeListOID);
    metadataWrapper.addCodeListRef(itemPath.itemOID, newCodeListOID);
}



function createCodeList(listName, itemPath, items) {
    metadataWrapper.getCodeListItemsByItem(itemPath.itemOID).forEach(item => item.parentElement.removeChild(item));
    const codeListOID = metadataWrapper.getCodeListOIDByItem(itemPath.itemOID);
    metadataWrapper.setElementName(codeListOID, listName);
    items.forEach(item => {
        let codedValue = metadataWrapper.addCodeListItem(codeListOID);
        let translatedDecode = item.item.rawText;
        metadataWrapper.setCodeListItemDecodedText(codeListOID, codedValue, translatedDecode);
    })
    return codeListOID;
    /*  for (const line of lines) {
        if (!line.length) continue;

        const parts = line.split(",");
        let codedValue = parts.length > 1 ? parts.shift().trim() : null;
        let translatedDecode = parts.join(",").trim();

        const currentItem = Array.from(currentItems.childNodes).find(item => item.getCodedValue() == codedValue);
        if (currentItem) metadataWrapper.insertCodeListItem(currentItem, codeListOID);
        else codedValue = metadataWrapper.addCodeListItem(codeListOID, codedValue);

        metadataWrapper.setCodeListItemDecodedText(codeListOID, codedValue, translatedDecode);
    }
 */
    //ioHelper.dispatchGlobalEvent("CodelistEdited");;
}

export function reorderODM(){
    let studyEvents = metadataWrapper.getStudyEvents();
    let insertElement = studyEvents[studyEvents.length - 1];
    studyEvents.forEach(se => {
        
        metadataWrapper.getFormsByStudyEvent(se.getAttribute('OID')).forEach(f => {
            //const form = metadataWrapper.getElementDefByOID(f.getAttribute('FormOID'));
            insertElement.insertAdjacentElement('afterend', f);
            insertElement = f;
        })
    });
    [...$$m('FormDef')].flatMap(f => metadataWrapper.getItemGroupsByForm(f.getAttribute('OID')).forEach(ig => {
        //const itemgroup = metadataWrapper.getElementDefByOID(ig.getAttribute('ItemGroupOID'));
        insertElement.insertAdjacentElement('afterend', ig);
        insertElement = ig;
    }));
    [...$$m('ItemGroupDef')].flatMap(ig => metadataWrapper.getItemsByItemGroup(ig.getAttribute('OID')).forEach(i => {
        //const item = metadataWrapper.getElementDefByOID(ig.getAttribute('ItemOID'));
        insertElement.insertAdjacentElement('afterend', i);
        insertElement = i;
    }));
    [...$$m('ItemDef')].map(i => metadataWrapper.getCodeListOIDByItem(i.getAttribute('OID'))).filter(oid => oid && typeof oid != 'undefined').forEach(clr => {
        const cl = metadataWrapper.getElementDefByOID(clr);
        insertElement.insertAdjacentElement('afterend', cl);
        insertElement = cl;
    });
    [...$$m('ItemRef')].forEach(ir => {
        if(ir.getAttribute('CollectionExceptionConditionOID')) {
            const condition = metadataWrapper.getElementDefByOID(ir.getAttribute('CollectionExceptionConditionOID'));
            insertElement.insertAdjacentElement('afterend', condition);
            insertElement = condition;
        }
    });
    [...$$m('ItemRef')].forEach(ir => {
        if(ir.getAttribute('MethodOID')) {
            const method = metadataWrapper.getElementDefByOID(ir.getAttribute('MethodOID'));
            insertElement.insertAdjacentElement('afterend', method);
            insertElement = method;
        }
    });
    if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}