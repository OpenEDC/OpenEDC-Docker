import * as htmlElements from "../../../js/helper/htmlelements.js"
import * as ioHelper from "../../../js/helper/iohelper.js"
import * as codeCache from "../helper/codeCache.js"
import * as utilHelper from "../helper/utilHelper.js"

class ItemDetailView extends HTMLElement {
    setHeading(heading) { this.heading = heading; }
    setOid(oid) { this.oid = oid; }
    setPath(path) { this.path = path; }
    setData(data) { this.data = data; }
    setMetadata(metadata) { this.metadata = metadata;  }
    setCloseCallback(callback) {this.callback = callback; }
    setCodeSaveCallback(callback) {this.codeSaveCallback = callback}
    setIsEditable(editable) {this.editable = editable }
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="item-detail-odal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <div class="modal-card-title break-word-hard">${this.heading}</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body is-fullheight" id="odm-overview-section">
                        <div class="columns is-gapless is-multiline itemrow mb-0">
                        </div>
                    </section>
                </div>
            </div>
        `;
        
        let itemrow = this.querySelector('.itemrow');
        itemrow.oid = this.oid;
        this.data.forEach(d => {
            let div  = document.createElement('div');
            div.classList = 'columns column is-12 div-underline is-flex-center';
            let name = document.createElement('div');
            name.classList = 'column is-4 has-text-weight-bold';
            name.innerText = d.name;
            div.appendChild(name);
            let value
            switch(d.type) {
                case 'label':
                    value = document.createElement('label');
                    value.classList = 'column is-8 label';
                    value.innerText = d.value ? d.value : '';
                    div.appendChild(value);
                    break;
                case 'input':
                    value = document.createElement('div');
                    value.classList = 'column is-8 editable detail';
                    value.editType = d.editType;
                    value.innerText = d.value ? d.value : '';
                    div.appendChild(value);
                    break;
                case 'select':

                    const dataTypeSelect = htmlElements.getSelect("datatype-select", true, true, d.elements, null, d.translations, true);
                    dataTypeSelect.classList = 'column is-8 select pb-0 pt-0'
                    dataTypeSelect.querySelector('select').value = d.value;
                    dataTypeSelect.querySelector('select').classList.add('is-fullwidth');
                    dataTypeSelect.querySelector('select').onchange = () => d.callback(this.oid, dataTypeSelect.querySelector('select').value, d.editType);
                    if(!this.editable) dataTypeSelect.querySelector('select').disabled = true;
                    div.append(dataTypeSelect);
                    break;
            }
            
            itemrow.append(div);

        });
        this.appendCodes(itemrow);
        this.querySelector('.delete').onclick = () => { this.remove(); this.callback();}
        this.querySelector(".modal-background").onclick = () => { this.remove(); this.callback();}

        ioHelper.addGlobalEventListener("UMLSCodes edited", e => {
            this.appendCodes(itemrow);
        }, {replace: false});

        ioHelper.addGlobalEventListener("Enable Itemdetail Codes Save", e => {
            this.enableSaveButton(true);
        }, {replace: false});

    }

    appendCodes(itemDiv){
        if(itemDiv.contains(this.querySelector('#umls-codes-div'))) itemDiv.removeChild(this.querySelector('#umls-codes-div'));
        this.codes = [...this.metadata.querySelectorAll(`[OID="${this.oid}"] Alias`)].filter(a => a.getAttribute('Name') != '');
        
            let div  = document.createElement('div');
            div.id = 'umls-codes-div'
            div.classList = 'columns column is-12 div-unterdine is-flex-center';
            let name = document.createElement('div');
            name.classList = 'column is-4 has-text-weight-bold';
            name.innerText = 'Codes';
            div.appendChild(name);
            let value = document.createElement('div');
            value.classList = 'column is-8 ml-0 pb-0';
            div.appendChild(value);
            let codeLists = document.createElement('div');
            codeLists.classList = 'columns is-multiline is-gapless has-background-link-light has-overflow-y has-scrollbar-link mb-0 mt-3 has-max-height-300 p-2';
            codeLists.id = 'detail-codes-edit';
            value.appendChild(codeLists);
            let lists = {};
            [...this.codes].filter(c => c.getAttribute('Context') != '').forEach(c => {
                let context = c.getAttribute('Context');
                let selectedList;
                if((/UMLS CUI \[\d*,\d*\]/g).test(context)) {
                    context = utilHelper.formatContext(context);
                    selectedList = lists[context];
                    if(!selectedList) {
                        let contextAndList = this.createList(context);
                        lists[context] = contextAndList.list;
                        selectedList = contextAndList.list;
                        codeLists.append(contextAndList.contextDiv);
                    }
                }
                else {
                    let contextAndList = this.createList(context);
                    selectedList = contextAndList.list;
                    codeLists.append(contextAndList.contextDiv);
                }

                c.getAttribute('Name').trim().split(/[\s,]+/).forEach(c => {
                    c = c.trim();
                    let listItem = document.createElement('li');
                    listItem.codeValue = c;
                    listItem.classList = 'alias-item';
                    let aliasDiv = document.createElement('div');
                    aliasDiv.classList = 'is-fullwidth columns is-gapless mb-1';
            
                    let aliasName = document.createElement('label');
                    aliasName.classList = 'label column is-4';
            
                    let i = document.createElement('i');
                    i.classList = 'fa-solid fa-trash has-text-link mr-1';
                    i.onclick = () => {this.removeCodeFromContext(listItem); ioHelper.dispatchGlobalEvent("Enable Itemdetail Codes Save");}
                    aliasName.append(i);
                    aliasName.appendChild(document.createTextNode(`${c}:`));
                    aliasDiv.appendChild(aliasName);
            
                    let meaningLabel = document.createElement('label');
                    meaningLabel.classList = 'label column is-8 is-link';
                    meaningLabel.innerText = 'Loading'
                    codeCache.getOrLoad(c).then(d => meaningLabel.innerText = d.STR[0]).catch(e => meaningLabel.innerText = 'Error on loading definition');
                    aliasDiv.appendChild(meaningLabel);
                    listItem.appendChild(aliasDiv)
                    selectedList.appendChild(listItem);
                })
            })
            //button to save codes
            let buttonsDiv = document.createElement('div');
            buttonsDiv.classList = 'column columns is-12 p-0 pt-2 is-gapless'
            let p1 = document.createElement('p');
            p1.classList = 'column'
            let saveButton = document.createElement('button')
            saveButton.id = 'detail-save-codes-button';
            saveButton.classList = 'button is-small is-link is-fullwidth ';
            saveButton.innerText = 'Save code changes';
            saveButton.disabled = true;
            if(this.editable) saveButton.onclick = () => this.saveCodes(this.oid);
            
            p1.appendChild(saveButton);
            buttonsDiv.append(p1);

            //Async loading, because we do not know, whether umls plugin is loaded
            this.addUmlsSearchButton(buttonsDiv);

            //button to add new context
            let p3 = document.createElement('p');
            p3.classList = 'column is-narrow ml-1'
            let addButton = document.createElement('button')
            addButton.classList = 'button is-small is-link';
            if(this.editable) addButton.onclick = () => this.addContext();
            else addButton.disabled = true;
            p3.appendChild(addButton);

            let span3 = document.createElement('span');
            span3.classList = 'icon is-small';
            addButton.appendChild(span3);
            let i3 = document.createElement('i');
            i3.classList = 'fa-solid fa-plus';
            span3.appendChild(i3)
            buttonsDiv.append(p3);

            value.append(buttonsDiv);
           

            itemDiv.append(div);
            if(this.editable) this.connectLists(() => this.enableSaveButton(true));
        
    }

    async addUmlsSearchButton(div){
        import("../../umlsplugin/umlsplugin.js").then(({isLoaded}) => {
            if(!isLoaded()) return;
            import("../../umlsplugin/helper/htmlhelper.js").then(({openUMLSSearchWindow}) => {
                //button to search for codes only added with active umls module
                let p2 = document.createElement('p');
                p2.classList = 'column is-narrow ml-1'
                let searchButton = document.createElement('button')
                searchButton.classList = 'button is-small is-link';
                if(this.editable) searchButton.onclick = () => openUMLSSearchWindow(this.path);
                else searchButton.disabled = true;
                p2.appendChild(searchButton);
    
                let span2 = document.createElement('span');
                span2.classList = 'icon is-small';
                searchButton.appendChild(span2);
                let i2 = document.createElement('i');
                i2.classList = 'fa-solid fa-search';
                span2.appendChild(i2)
                div.insertBefore(p2, div.lastChild);
            })
        }); 
    }

    createList(context) {
        let contextDiv = document.createElement('div')
        contextDiv.classList = 'column is-12 field columns is-gapless mb-1 is-multiline alias-context div-underline';
        contextDiv.contextName = context;
        let aliasContext = document.createElement('label');
        aliasContext.classList = 'label column is-12';
        aliasContext.appendChild(document.createTextNode(context));
        contextDiv.appendChild(aliasContext);

        let list = document.createElement('ul');
        list.classList = 'column is-12 sortable-detail-codes-list has-min-height-20';
        contextDiv.appendChild(list);
        return {contextDiv, list};
    }

    removeCodeFromContext(listElement) {
        listElement.parentElement.removeChild(listElement);
        //this.enableSaveButton(true);
    }

    saveCodes(oid) {
        let codes = {};
        [...this.querySelectorAll('#detail-codes-edit .alias-context')].forEach(ac => codes[ac.contextName] = [...ac.querySelectorAll('li.alias-item')].map(li => li.codeValue));
        this.codeSaveCallback(codes, oid);
        this.enableSaveButton(false);
    }

    addContext() {
        let contextAndList = this.createList(this.getNewConceptName());
        this.querySelector('#detail-codes-edit').appendChild(contextAndList.contextDiv);
        if(this.editable) this.connectLists(() => this.enableSaveButton(true));
    }

    getNewConceptName() {
        let contexts = [...this.querySelectorAll('#detail-codes-edit .alias-context')].map(c => c.contextName);
        let i = 1;
        let found = false;
    
        while (!found) {
            let name = `UMLS CUI [${i},x]`;
            if (contexts.indexOf(name) < 0) return name;
            i++;
        }
    }

    enableSaveButton(show) {
        this.querySelector('#detail-save-codes-button').disabled = !show;
    }

    connectLists(callback) {
        let copyHelper;
        jq(function() {
            jq(".sortable-detail-codes-list").sortable({
                items: '.alias-item',
                connectWith: ".sortable-detail-codes-list",
                cursor: "move",
                dropOnEmpty: true,
                placeholder: "placeholder-edit-line",
                helper: function(e, li) {
                    copyHelper = li.clone().insertAfter(li);
                    copyHelper.css('background-color', 'red');
                    copyHelper[0].codeValue = li[0].codeValue;
                    var $originals = li.children();
                    var $helper = li.clone();
                    jq($helper).addClass('placeholder-edit')
                    $helper.children().each(function(index) {
                        jq(this).width($originals.eq(index).width());
                    });
                    return $helper;
                },
                stop: function(e, ui) {
                    if(e.shiftKey || e.ctrlKey) {
                        let copyElement = copyHelper;
                        copyElement[0].querySelector('i').onclick = () => {copyElement.remove(); ioHelper.dispatchGlobalEvent("Enable Itemdetail Codes Save")};
                    }
                    else copyHelper && copyHelper.remove();
                    callback();
                }
    
            }).disableSelection();
        });
    }

    
}

window.customElements.define("item-detail-view", ItemDetailView);