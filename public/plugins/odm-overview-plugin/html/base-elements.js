
let template = string => new DOMParser().parseFromString(string, "text/html").documentElement.querySelector('body').childNodes[0];

export let getAutocompleteSearchField = (id, text) => template(
    `<div class="field has-addons has-background-link-light-active">
        <div class="control is-expanded has-autocomplete-top">
            <input class="input is-link" type="text" autocomplete="off" placeholder="${text}" id="${id}">
        </div>
    </div>`)

export let getFilterDiv = (id, text) => template(
    `<div class="field">
        <div class="control is-expanded has-autocomplete-top">
            <input class="input is-link" type="text" autocomplete="off" placeholder="${text}" id="${id}">
        </div>
    </div>`)

export function getBasicSideView(viewId, updateButtonCallback, cancelButtonCallback) {
    let view = document.createElement('div');
    view.id = viewId;
    view.classList = 'column is-2 has-background-link-light-active';

    let buttonsDiv = document.createElement('div');
    buttonsDiv.classList = 'field is-grouped'
    let p1 = document.createElement('p')
    p1.classList = 'control is-half';
    let updateButton = document.createElement('button');
    updateButton.classList = 'button is-link is-small is-light is-fullwidth';
    updateButton.innerText = 'Update';
    updateButton.onclick = () => updateButtonCallback();
    p1.appendChild(updateButton);
    buttonsDiv.appendChild(p1);
    let p2 = document.createElement('p')
    p2.classList = 'control is-half';
    let cancelButton = document.createElement('button');
    cancelButton.classList = 'button is-link is-small is-light is-fullwidth';
    cancelButton.innerText = 'Cancel';
    cancelButton.onclick = () => cancelButtonCallback();
    p2.appendChild(cancelButton);
    buttonsDiv.appendChild(p2);
    view.appendChild(buttonsDiv);

    let countSelectedDiv = document.createElement('div');
    countSelectedDiv.classList = 'field is-grouped';
    let labelCountSelected = document.createElement('label');
    labelCountSelected.classList = 'label';
    countSelectedDiv.appendChild(labelCountSelected);
    let labelCountSelectedStatic = document.createElement('label');
    labelCountSelectedStatic.classList = 'label ml-1';
    labelCountSelectedStatic.innerText = 'elements selected';
    countSelectedDiv.appendChild(labelCountSelectedStatic);
    view.appendChild(countSelectedDiv);
    return { view: view, labelSelected: labelCountSelected };
}

export function getCodeDiv({context, code}, color) {
    let aliasDiv = document.createElement('div');
    aliasDiv.classList = 'is-fullwidth columns is-gapless mb-0 is-flex-center'

    let aliasName = document.createElement('div');
    aliasName.classList = 'column is-6 coloredCodeDiv ov-has-line-wrap';
    aliasName.innerText = code;
    aliasName.context = context;
    aliasName.color = color;
    aliasDiv.appendChild(aliasName);

    let meaningLabel = document.createElement('label');
    meaningLabel.classList = 'label column is-6 ml-1 is-link is-size-7 has-line-height-24 ov-has-line-wrap';
    meaningLabel.innerText = 'Loading'
    aliasDiv.appendChild(meaningLabel);

    return aliasDiv;
}