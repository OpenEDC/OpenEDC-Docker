import * as baseElements from "./base-elements.js"
import * as odmAutocompleteHelper from "../helper/odm-overview-autocomplete-helper.js"
import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as codeCache from "../helper/codeCache.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"

let codesDiv;
let codesSelectedDiv;
let metadata;
let conceptGroupNames = [];
let dragStartGroup;
let callback;


const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

export function getCodeEditWiget(viewId, updateButtonCallback, cancelButtonCallback, metaData) {
    metadata = metaData;
    callback = updateButtonCallback;
    conceptGroupNames = [];
    dragStartGroup = null;
    let basicView = baseElements.getBasicSideView(viewId, () => aliasUpdate(false), cancelButtonCallback);

    codesDiv = document.createElement('div');
    codesDiv.classList = 'field has-background-link-light has-overflow-y has-scrollbar-link p-1 mb-1';
    codesDiv.style.height = '180px'

    let addButtonDiv = document.createElement('div');
    addButtonDiv.classList = 'field'
    let addButton = document.createElement('button')
    addButton.classList = 'button is-small is-link is-fullwidth pt-0';
    addButton.innerText = 'Create new context';
    addButton.onclick = () => addSelectedCodesToNewContext();
    addButtonDiv.appendChild(addButton)

    codesSelectedDiv = document.createElement('div');
    codesSelectedDiv.classList = 'field has-background-link-light has-overflow-y has-scrollbar-link p-1';
    codesSelectedDiv.id = 'alias-codes';
    codesSelectedDiv.style.height = '180px'

    let radioDiv = document.createElement('div');
    radioDiv.classList = 'columns is-gapless has-background-link-light p-1';
    let option1 = document.createElement('label');
    option1.classList = 'radio column is-half';
    let input1 = document.createElement('input');
    input1.type = 'radio';
    input1.name = 'edit-codes-option';
    input1.classList = 'mr-1'
    input1.value = false;
    option1.appendChild(input1);
    option1.appendChild(document.createTextNode('Add to items'))
    radioDiv.appendChild(option1);
    let option2 = document.createElement('label');
    option2.classList = 'radio column is-half';
    let input2 = document.createElement('input');
    input2.type = 'radio';
    input2.name = 'edit-codes-option';
    input2.value = true;
    input2.classList = 'mr-1'
    option2.appendChild(input2);
    option2.appendChild(document.createTextNode('Replace'))
    radioDiv.appendChild(option2);


    let searchDiv = baseElements.getAutocompleteSearchField('edit-codes-search', 'Element with codes');
    basicView.view.appendChild(searchDiv);
    basicView.view.appendChild(codesDiv);
    basicView.view.appendChild(addButtonDiv);
    basicView.view.appendChild(codesSelectedDiv);
    basicView.view.appendChild(radioDiv);

    return { view: basicView.view, labelSelected: basicView.labelSelected };
}

export function enableAutoComplete(type) {
    odmAutocompleteHelper.setMetadata(metadata);
    odmAutocompleteHelper.enableAutocomplete($('#edit-codes-search'), odmAutocompleteHelper.modes.CODE, updateCodes, type);
}

export function updateCodes(element) {
    codesDiv.innerHTML = '';
    let aliasses = metadataWrapper.getElementAliases(element.value);
    [...aliasses].filter(a => a.getAttribute('Name') != '').forEach(a => {
        let alias = document.createElement('div')
        alias.classList = 'field columns is-gapless mb-1 is-multiline';
        let aliasContext = document.createElement('label');
        aliasContext.classList = 'label column is-12';
        let checkbox = document.createElement('input');
        checkbox.classList = 'checkbox alias-checkbox ml-1 mr-1';
        checkbox.type = 'checkbox';
        //aliasContext.appendChild(checkbox);
        aliasContext.appendChild(document.createTextNode(`${a.getAttribute('Context')}`));
        alias.appendChild(aliasContext);

        let aliasCodes = a.getAttribute('Name').split(' ').filter(a => a != '');
        aliasCodes.forEach(ac => {

            let aliasName = document.createElement('label');
            aliasName.classList = 'label column is-5';
            alias.appendChild(aliasName);

            let aliasCheckbox = document.createElement('input');
            aliasCheckbox.classList = 'checkbox alias-checkbox mr-1';
            aliasCheckbox.type = 'checkbox';
            aliasCheckbox.value = ac;
            aliasName.appendChild(aliasCheckbox);
            aliasName.appendChild(document.createTextNode(`${ac}:`));

            let meaningLabel = document.createElement('label');
            meaningLabel.classList = 'label column is-7 is-link';
            meaningLabel.innerText = 'Loading'
            codeCache.getOrLoad(ac).then(d => meaningLabel.innerText = d.STR[0]);
            alias.appendChild(meaningLabel);

        })
        codesDiv.appendChild(alias)
    })
}

function addSelectedCodesToNewContext() {
    let codes = [...$$('.alias-checkbox')].filter(cb => cb.checked).map(cb => cb.value);
    if (codes.length == 0) {
        ioHelper.showToast('Please chose codes to add them', 4000, ioHelper.interactionTypes.DANGER);
        return;
    }
    addGroupedContext(codes);
}

function addGroupedContext(codes) {

    let contextName = getNewConceptName();
    conceptGroupNames.push(contextName);

    let contextDiv = document.createElement('div')
    contextDiv.classList = 'field columns is-gapless mb-1 is-multiline alias-context';
    let aliasContext = document.createElement('label');
    aliasContext.classList = 'label column is-12';
    let checkbox = document.createElement('input');
    checkbox.classList = 'checkbox alias-checkbox ml-1 mr-1';
    checkbox.type = 'checkbox';
    //aliasContext.appendChild(checkbox);
    aliasContext.appendChild(document.createTextNode(contextName));
    contextDiv.appendChild(aliasContext);

    let list = document.createElement('ul');
    list.classList = 'column is-12 sortable-alias-list';
    contextDiv.appendChild(list);

    [...codes].filter(c => c != '').forEach(c => {

        let listItem = document.createElement('li');
        listItem.codeValue = c;
        listItem.classList = 'alias-item';
        let aliasDiv = document.createElement('div');
        aliasDiv.classList = 'is-fullwidth columns is-gapless mb-1';

        let aliasName = document.createElement('label');
        aliasName.classList = 'label column is-5';

        let i = document.createElement('i');
        i.classList = 'fa-solid fa-trash has-text-link mr-1';
        i.onclick = () => removeCodeFromContext(listItem)
        aliasName.append(i);
        aliasName.appendChild(document.createTextNode(`${c}:`));
        aliasDiv.appendChild(aliasName);

        let meaningLabel = document.createElement('label');
        meaningLabel.classList = 'label column is-7 is-link';
        meaningLabel.innerText = 'Loading'
        codeCache.getOrLoad(c).then(d => meaningLabel.innerText = d.STR[0]);
        aliasDiv.appendChild(meaningLabel);
        listItem.appendChild(aliasDiv)
        list.appendChild(listItem);

    })
    codesSelectedDiv.appendChild(contextDiv);

    let copyHelper;
    jq(function() {
        jq(".sortable-alias-list").sortable({
            items: '.alias-item',
            connectWith: ".sortable-alias-list",
            cursor: "move",
            placeholder: "placeholder-edit-line",
            helper: function(e, li) {
                copyHelper = li.clone().insertAfter(li);
                copyHelper[0].codeValue = li[0].codeValue;
                var $originals = li.children();
                var $helper = li.clone();
                jq($helper).addClass('placeholder-edit')
                $helper.children().each(function(index) {
                    jq(this).width($originals.eq(index).width());
                });
                return $helper;
            },
            start: function(e, ui) {
                dragStartGroup = ui.item[0].closest('.alias-context');
            },
            stop: function(e, ui) {
                if(e.shiftKey || e.ctrlKey) {
                    let copyElement = copyHelper;
                    copyElement[0].querySelector('i').onclick = () => removeCodeFromContext(copyElement[0]);
                }
                else copyHelper && copyHelper.remove();
                onDrop(e, ui)
            }

        }).disableSelection();
    });
}

function onDrop(e, ui) {
    if (dragStartGroup.querySelectorAll('.alias-item').length == 0) {
        dragStartGroup.parentElement.removeChild(dragStartGroup);
    }

}

function removeCodeFromContext(listElement) {
    let group = listElement.closest('.alias-context');
    listElement.parentElement.removeChild(listElement);
    if (group.querySelectorAll('.alias-item').length == 0) {
        group.parentElement.removeChild(group);
    }
}

function getNewConceptName() {
    let i = 1;
    let found = false;

    while (!found) {
        let name = `UMLS CUI [${i},x]`;
        if (conceptGroupNames.indexOf(name) < 0) return name;
        i++;
    }
}

function aliasUpdate(checked) {
    if (!checked && !checkCodeConsistency()) return;
    let checkboxValue = jq('input[name=edit-codes-option]:checked').val();
    let codes = [...$$('#alias-codes .alias-context')].map(ac => [...ac.querySelectorAll('li.alias-item')].map(li => li.codeValue));
    callback(codes, checkboxValue)
}

function checkCodeConsistency() {
    let codes = [...$$('#alias-codes .alias-context')].map(ac => [...ac.querySelectorAll('li.alias-item')]);
    if (codes.length == 0) {
        ioHelper.showMessage(languageHelper.getTranslation("note"), 'You did not chose any codes. If you continue and chose replace, existing codes will be removed.', {
            ['continue']: () => aliasUpdate(true)
        });
        return false;
    }
    return true;
}