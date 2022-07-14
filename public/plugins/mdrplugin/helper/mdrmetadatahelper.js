import * as languageHelper from "../../../js/helper/languagehelper.js"
import * as metadataModule from "../../../js/metadatamodule.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"

export const IntegrationMode = {
    KEEP_OLD: "keep_old",
    KEEP_NEW: "keep_new",
    COMBINE: "combine"
}
export function addItemgroupFromMDR(itemgroupOID, itemgroup, integrationMode) {
    const locale = languageHelper.getCurrentLocale();

    //itemgroup description text
    if(itemgroup.data.description) {
        const descriptionTexts = itemgroup.data.description.texts;
        const descriptionText = findTextForLocale(descriptionTexts, locale).text;
        metadataWrapper.setElementDescription(itemgroupOID, descriptionText);
    }
   
    switch(integrationMode) {
        case IntegrationMode.KEEP_OLD:
            break;
        case IntegrationMode.KEEP_NEW: 
            metadataWrapper.getItemsByItemGroup(itemgroupOID).map(item => item.getAttribute('OID')).forEach(itemOID => metadataWrapper.removeItemRef(itemgroupOID, itemOID));
        case IntegrationMode.COMBINE:
            itemgroup.data.items.forEach(item => addItemFromMDR(metadataWrapper.createItem(itemgroupOID), structureItemData(item.definition), integrationMode));
    } 

    //aliases
    metadataWrapper.deleteElementAliasesForElement(itemgroupOID);
    itemgroup.data.entity.aliases.forEach(a => {
        if(a.context && a.name)
            metadataWrapper.setElementAliasForElement(itemgroupOID, a.context, a.name)
    });

    //reloading tree and persisting data
    metadataModule.reloadTree();
    if(!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}

export function addItemFromMDR (itemOID, item, integrationMode) {
    const locale = languageHelper.getCurrentLocale();
    
    //item question text
    const questionTexts = item.data.question.texts;
    const questionText = findTextForLocale(questionTexts, locale).text;
    metadataWrapper.setItemQuestion(itemOID, questionText);

    //Datatype and Codelist
    let datatype = item.datatype.toLowerCase();
    if (integrationMode !== IntegrationMode.KEEP_OLD) {
        datatype = updateCodelistFromMDR(datatype, itemOID, item.data.codelists);
    }
    metadataWrapper.setItemDataType(itemOID, datatype);

    //Measurement Unit
    const currentMeasurementUnit = metadataWrapper.getItemMeasurementUnit(itemOID);
    if(item.unit.length > 0) {
        let texts = item.unit[0].definition.symbol.texts;
        let measurementText = findTextForLocale(texts, locale).text;
        const identicalMeasurementUnit = metadataWrapper.getMeasurementUnits().find(measurementUnit => measurementUnit.getTranslatedSymbol(languageHelper.getCurrentLocale()) == measurementText);
        let measurementUnitOID;
        if (identicalMeasurementUnit) measurementUnitOID = identicalMeasurementUnit.getOID();
        else if (measurementText) measurementUnitOID = metadataWrapper.createMeasurementUnit(symbol);
        metadataWrapper.setItemDefMeasurementUnit(metadataWrapper.getElementDefByOID(itemOID), measurementUnitOID);

        if (currentMeasurementUnit && (!measurementText || currentMeasurementUnit.getOID() != measurementUnitOID)) metadataWrapper.safeDeleteMeasurementUnit(currentMeasurementUnit.getOID());
    }
    else if (currentMeasurementUnit) {
        metadataWrapper.safeDeleteMeasurementUnit(currentMeasurementUnit.getOID());
    }

    //Aliases
    metadataWrapper.deleteElementAliasesForElement(itemOID);
    item.data.entity.aliases.forEach(a => {
        if(a.context && a.name){
            metadataWrapper.setElementAliasForElement(itemOID, a.context, a.name)
        }
    });

    //Range checks
    metadataWrapper.deleteRangeChecksOfItem(itemOID);
    item.data.rangechecks.forEach(rc => metadataWrapper.setItemRangeCheck(itemOID, rc.comparator, rc.checkvalue));

    //reloading tree and persisting data
    metadataModule.reloadTree();
    if(!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
}

export function updateCodelistFromMDR(datatype, itemOID, codelists) {
    let codeListRef = metadataWrapper.getElementDefByOID(itemOID).querySelector("CodeListRef");

    //old codelist has to be removed
    if(codeListRef)
        metadataWrapper.removeCodeListRef(itemOID, codeListRef.getAttribute("CodeListOID"));

    //If there are no items, there is no need to create code list
    if(!codelists)
        return datatype;

    //new codelist
    if(['text', 'integer', 'float'].indexOf(datatype) < 0)
            datatype = 'text';
    let codelistOID = metadataWrapper.createCodeList(itemOID);

    codelists.definition.codelistitems.map(cli => cli.definition).forEach(cli => {
        let codedValue = metadataWrapper.addCodeListItem(codelistOID, cli.codedvalue !== '' ? cli.codedvalue : null);
        metadataWrapper.setCodeListItemDecodedText(codelistOID, codedValue, findTextForLocale(cli.decode.texts).text);
        metadataWrapper.deleteElementAliasesForCodeList(codelistOID, codedValue);
        cli.entity.aliases.forEach(a => metadataWrapper.setElementAliasForCodeListItem(codelistOID, codedValue, a.context, a.name));
    })

    metadataWrapper.setCodeListDataType(metadataWrapper.getCodeListOIDByItem(itemOID), datatype);
    return datatype;
}

export function structureItemgroupData(data) {
    return { 
        freq: data.entity.occurrences.length,
        name: data.name,
        code: data.entity.aliases.map(a => a.name),
        items: data.items.map(i => i.definition.name),
        desc: (data.description ? findTextForLocale(data.description.texts, languageHelper.getCurrentLocale()) : {text:''}).text,
        lang: data.description ? data.description.texts.map(t => t.languagetag) : [],
        data: data
    }
}

export function structureItemData(data) {
    return { 
        freq: data.entity.occurrences.length,
        name: data.name,
        code: data.entity.aliases.map(a => a.name),
        unit: data.measurementunits,
        datatype: data.datatype,
        question: (data.question ? findTextForLocale(data.question.texts, languageHelper.getCurrentLocale()) : {text:''}).text,
        codelistitems: data.codelists ? data.codelists.definition.codelistitems.map(cli => findTextForLocale(cli.definition.decode.texts, languageHelper.getCurrentLocale)) : [],
        lang: data.question ? data.question.texts.map(t => t.languagetag) : [],
        data: data
    }
}


function findTextForLocale(textElements, locale) {
    let textElement = textElements.find(t => t.languagetag === locale);
    if(!textElement)
        textElement = textElements.length > 0 ? textElements.find(t => t.languagetag === 'en') : {text: ''};
    if(!textElement)
        textElement = textElements[0];
    return textElement;
}