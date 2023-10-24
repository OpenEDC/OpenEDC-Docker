import * as baseElements from "./base-elements.js"
import * as odmAutocompleteHelper from "../helper/odm-overview-autocomplete-helper.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import ODMPath from "../../../js/odmwrapper/odmpath.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"
import * as ioHelper from "../../../js/helper/iohelper.js"

let itemsDiv;
let itemsSelectedDiv;
let metadata;
let dragStartGroup;
let callback;
let currentName;
let currentCodelistOID;

const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

export function getCodeEditWiget(viewId, updateButtonCallback, cancelButtonCallback, metaData) {
    metadata = metaData;
    callback = updateButtonCallback;
    dragStartGroup = null;
    let basicView = baseElements.getBasicSideView(viewId, () => codelistItemsUpdate(false), cancelButtonCallback);

    itemsDiv = document.createElement('div');
    itemsDiv.classList = 'field has-background-link-light has-overflow-y has-scrollbar-link p-1 mb-1';
    itemsDiv.style.height = '180px'

    let addButtonDiv = document.createElement('div');
    addButtonDiv.classList = 'field is-grouped'
    let p1 = document.createElement('p')
    p1.classList = 'is-half control ';
    let addButton = document.createElement('button')
    addButton.classList = 'button is-small is-link is-fullwidth';
    addButton.innerText = 'Copy whole list';
    addButton.onclick = () => addCodelistToNewContext();
    p1.appendChild(addButton);
    addButtonDiv.appendChild(p1)

    let p2 = document.createElement('p')
    p2.classList = 'is-half control ';
    let addButtonShallow = document.createElement('button')
    addButtonShallow.classList = 'button is-small is-link is-fullwidth';
    addButtonShallow.innerText = 'Copy elements';
    addButtonShallow.onclick = () => addSelectedCodesToNewContext();
    p2.appendChild(addButtonShallow);
    addButtonDiv.appendChild(p2)

    itemsSelectedDiv = document.createElement('div');
    itemsSelectedDiv.classList = 'field has-background-link-light has-overflow-y has-scrollbar-link p-1';
    itemsSelectedDiv.id = 'codelist-items';
    itemsSelectedDiv.style.height = '180px'

    let radioDiv = document.createElement('div');
    radioDiv.classList = 'columns is-gapless has-background-link-light p-1';
    let option1 = document.createElement('label');
    option1.classList = 'radio column is-half';
    let input1 = document.createElement('input');
    input1.type = 'radio';
    input1.name = 'edit-codelist-option';
    input1.classList = 'mr-1'
    input1.value = 'shallow-copy';
    option1.appendChild(input1);
    option1.appendChild(document.createTextNode('Reference'))
    radioDiv.appendChild(option1);
    let option2 = document.createElement('label');
    option2.classList = 'radio column is-half';
    let input2 = document.createElement('input');
    input2.type = 'radio';
    input2.name = 'edit-codelist-option';
    input2.value = 'deep-copy';
    input2.classList = 'mr-1'
    option2.appendChild(input2);
    option2.appendChild(document.createTextNode('Copy'))
    radioDiv.appendChild(option2);


    let searchDiv = baseElements.getAutocompleteSearchField('edit-codelists-search', 'Element with codelist');
    basicView.view.appendChild(searchDiv);
    basicView.view.appendChild(itemsDiv);
    basicView.view.appendChild(addButtonDiv);
    basicView.view.appendChild(itemsSelectedDiv);
    basicView.view.appendChild(radioDiv);

    return { view: basicView.view, labelSelected: basicView.labelSelected };
}

export function enableAutoComplete() {
    odmAutocompleteHelper.setMetadata(metadata);
    odmAutocompleteHelper.enableAutocomplete($('#edit-codelists-search'), odmAutocompleteHelper.modes.CODE, updateCodeListElements, ODMPath.elements.CODELISTITEM);
}

export function updateCodeListElements(element) {
    itemsDiv.innerHTML = '';
    let codeListOID = metadataWrapper.getCodeListOIDByItem(element.value.last.value);
    let name = metadata.querySelector(`CodeList[OID="${codeListOID}"]`).getAttribute('Name')
    let codeListitems = metadataWrapper.getCodeListItemsByItem(element.value.last.value);
    currentName = name;
    currentCodelistOID = codeListOID;

    let codeList = document.createElement('div')
    codeList.classList = 'field columns is-gapless mb-1 is-multiline';
    let nameDiv = document.createElement('label');
    nameDiv.classList = 'label column is-12';
    nameDiv.appendChild(document.createTextNode(name));
    codeList.appendChild(nameDiv);
    itemsDiv.appendChild(codeList);

    [...codeListitems].forEach(c => {
        let text = c.getTranslatedDecode(languageHelper.getCurrentLocale());
        if (!text) text = `Missing Translation`;
        text += ` (${c.getAttribute('CodedValue')})`;

        let translation = document.createElement('label');
        translation.classList = 'label column is-12';
        codeList.appendChild(translation);

        let checkbox = document.createElement('input');
        checkbox.classList = 'checkbox code-list-item-checkbox mr-1';
        checkbox.type = 'checkbox';
        checkbox.cli = { text: text, rawText: c.getTranslatedDecode(languageHelper.getCurrentLocale()), codedValue: c.getAttribute('CodedValue') };
        translation.appendChild(checkbox);
        translation.appendChild(document.createTextNode(text));
    });
}

function addCodelistToNewContext() {
    let items = [...$$('.code-list-item-checkbox')];
    if (items.length == 0) {
        ioHelper.showToast('Please chose items to add them', 4000, ioHelper.interactionTypes.DANGER);
        return
    }
    addGroupedContext(items.map(cb => cb.cli));
}

function addSelectedCodesToNewContext() {
    let items = [...$$('.code-list-item-checkbox')].filter(cb => cb.checked);
    if (items.length == 0) {
        ioHelper.showToast('Please chose items to add them', 4000, ioHelper.interactionTypes.DANGER);
        return;
    }
    addGroupedContext(items.map(cb => cb.cli));
}

function addGroupedContext(items) {

    let contextName = currentName;

    let contextDiv = document.createElement('div')
    contextDiv.classList = 'field columns is-gapless mb-1 is-multiline codelist-edit-context';
    contextDiv.codelistOID = currentCodelistOID;
    let codelistName = document.createElement('label');
    codelistName.classList = 'label column is-12';
    codelistName.innerText = contextName;
    contextDiv.appendChild(codelistName);

    let list = document.createElement('ul');
    list.classList = 'column is-12 sortable-codelist-edit-list';
    contextDiv.appendChild(list);

    [...items].forEach(item => {

        let listItem = document.createElement('li');
        listItem.codeValue = item;
        listItem.codelistOID = currentCodelistOID;
        listItem.classList = 'codelist-item';
        let itemDiv = document.createElement('div');
        itemDiv.classList = 'is-fullwidth columns is-gapless mb-1';

        let valueDiv = document.createElement('label');
        valueDiv.classList = 'label column is-12';

        let i = document.createElement('i');
        i.classList = 'fa-solid fa-trash has-text-link mr-1';
        i.onclick = () => removeCodeFromContext(listItem)
        valueDiv.append(i);
        valueDiv.appendChild(document.createTextNode(item.text));
        itemDiv.appendChild(valueDiv);

        listItem.appendChild(itemDiv)
        list.appendChild(listItem);

    })
    itemsSelectedDiv.appendChild(contextDiv);
    jq(function() {
        jq(".sortable-codelist-edit-list").sortable({
            items: '.codelist-item',
            connectWith: ".sortable-codelist-edit-list",
            cursor: "move",
            placeholder: "placeholder-edit-line",
            helper: function(e, tr) {
                var $originals = tr.children();
                var $helper = tr.clone();
                jq($helper).addClass('placeholder-edit')
                $helper.children().each(function(index) {
                    jq(this).width($originals.eq(index).width());
                });
                return $helper;
            },
            start: function(e, ui) {
                dragStartGroup = ui.item[0].closest('.codelist-edit-context');
            },
            stop: function(e, ui) {
                onDrop(e, ui)
            }

        }).disableSelection();
    });
}

function onDrop(e, ui) {
    if (dragStartGroup.querySelectorAll('.codelist-item').length == 0) {
        dragStartGroup.parentElement.removeChild(dragStartGroup);
    }

}

function removeCodeFromContext(listElement) {
    let group = listElement.closest('.codelist-edit-context');
    listElement.parentElement.removeChild(listElement);
    if (group.querySelectorAll('.codelist-item').length == 0) {
        group.parentElement.removeChild(group);
    }
}

function codelistItemsUpdate(checked) {
    if (!checked && !checkCodeListConsistency()) return;
    let checkboxValue = jq('input[name=edit-codelist-option]:checked').val();
    let context = $('#codelist-items .codelist-edit-context');
    let listName = context.querySelector('.label').innerText;
    let listOID = context.codelistOID;
    let items = [...context.querySelectorAll('li.codelist-item')].map(li => { return { item: li.codeValue, listOID: li.codelistOID } });
    callback(listName, listOID, items, checkboxValue)
}

function checkCodeListConsistency() {
    let contexts = $$('#codelist-items .codelist-edit-context');
    if (contexts.length == 0) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'You did not chose any codelist items. If you continue the existing codelists will be replaced.', {
            ['continue']: () => codelistItemsUpdate(true)
        });
        return false;
    }
    if (contexts.length > 1) {
        ioHelper.showToast('Please condense all codelist items to one codelist. You can use drag and drop.', 4000, ioHelper.interactionTypes.DANGER)
        return false;
    }
    let context = contexts[0];
    let listOID = context.codelistOID;
    if ([...context.querySelectorAll('li.codelist-item')].map(li => li.codelistOID).some(oid => oid != listOID)) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'You seem to have mixed items from multiple codelists. They will be combined into a new list.', {
            ['continue']: () => codelistItemsUpdate(true)
        });
        return false;
    }
    return true;

}