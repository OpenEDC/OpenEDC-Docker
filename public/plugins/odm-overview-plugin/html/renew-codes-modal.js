import * as metadataWrapper from "../../../js/odmwrapper/metadatawrapper.js"
import * as metadataModule from "../../../js/metadatamodule.js"
import * as ioHelper from "../../../js/helper/iohelper.js"

class RenewCodesModal extends HTMLElement {
    setHeading(heading) { this.heading = heading; }
    setMetadata(metadata) { this.metadata = metadata; }
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="renew-codes-modal">
                <div class="modal-background"></div>
                <div class="modal-card is-width-wide has-text-centered">
                    <header class="modal-card-head">
                        <p class="modal-card-title">${this.heading}</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body is-fullheight" id="renew-codes-section">
                        <div class="is-fullheight">
                            <div class="box mb-1">
                                <label class="label" id="renew-codes-text">
                            </div>
                            <div class="box has-overflow-y has-scrollbar-link is-hidden" id="renew-codes-content">
                                <div class="columns" id="renew-codes-content-inner">
                                    <div class="column is-full">
                                        <div class="p-3" id="renew-codes-content-old">
                                            <div class="columns is-gapless">
                                                <div class="column is-half">
                                                    <h5 class="title is-5">Old</h5>
                                                </div>
                                                <div class="column is-half">
                                                    <h5 class="title is-5">New</h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>  
                                </div>
                            </div>
                        </div>
                    </section>
                    <footer class="modal-card-foot" id="renew-codes-footer">
                        <button class="button is-link" id="update-codes-save">save selection</button>
                    </footer>
                </div>
            </div>
        `;

        let changeableAliasTags = [...this.metadata.querySelectorAll('Alias')].filter(a => a.parentElement.nodeName != 'CodeList').filter(a => (/^UMLS CUI\s*([0-9]*|\-[0-9]+|\[\d+\])$/g).test(a.getAttribute('Context')));
        this.querySelector("#renew-codes-text").innerText = `${changeableAliasTags.length} matching aliasses have been found.`;
        if(changeableAliasTags.length > 0) {
            let contentDiv = this.querySelector('#renew-codes-content');
            contentDiv.classList.remove('is-hidden');

            let label = document.createElement('label');
            label.classList = 'label has-text-left pl-2';
            let checkAll = document.createElement('input');
            checkAll.classList = 'checkbox mr-1';
            checkAll.type = 'checkbox';
            checkAll.id = 'update-codes-check-all'
            checkAll.checked = false;
            checkAll.onchange = () => this.toggleAll();
            label.appendChild(checkAll);
            label.appendChild(document.createTextNode('check all'));
            this.querySelector('#renew-codes-content-old').appendChild(label)

            let currentParent = null;
            changeableAliasTags.forEach(a => {
                let parent = a.parentElement;
                if(!currentParent || currentParent.oid != parent.getAttribute('OID')){
                    currentParent = document.createElement('div');
                    currentParent.oid = parent.getAttribute('OID');
                    currentParent.classList = 'columns is-multiline mb-1 mt-0 has-text-left';
                    let oldDiv = document.createElement('div');
                    oldDiv.classList = 'column is-half m-0 pb-0 pt-0';

                    let innerOldDiv = document.createElement('div');
                    innerOldDiv.classList = 'columns is-multiline mb-0 is-gapless has-header-color is-fullheight p-2 innerDiv codeDiv'
                    innerOldDiv.oid = parent.getAttribute('OID');
                    oldDiv.appendChild(innerOldDiv);
                    let nodeNameLabel = document.createElement('label');
                    nodeNameLabel.classList = 'label column is-3';
                    nodeNameLabel.innerText = parent.nodeName;
                    innerOldDiv.appendChild(nodeNameLabel);
                    let parentName = document.createElement('label');
                    parentName.classList = 'label column is-9';
                    parentName.innerText = parent.getAttribute('Name');
                    innerOldDiv.appendChild(parentName);

                    let newDiv = oldDiv.cloneNode(true);
                    newDiv.querySelector('.codeDiv').oid = parent.getAttribute('OID');
                    newDiv.querySelector('.codeDiv').classList.add('codeResult');

                    let checkbox = document.createElement('input');
                    checkbox.classList = 'checkbox mr-1 update-codes-checkbox';
                    checkbox.type = 'checkbox';
                    checkbox.checked = false;
                    checkbox.oid = parent.getAttribute('OID');
                    checkbox.onchange = (e) => this.toggleCheckbox(e);
                    nodeNameLabel.innerText = '';
                    nodeNameLabel.appendChild(checkbox);
                    nodeNameLabel.appendChild(document.createTextNode(parent.nodeName));

                    let aliasDivOld = document.createElement('div');
                    aliasDivOld.classList = 'column is-full columns is-gapless is-multiline mb-2';
                    innerOldDiv.appendChild(aliasDivOld);

                    let aliasDivNew = document.createElement('div');
                    aliasDivNew.classList = 'column is-full columns is-gapless is-multiline mb-2';
                    newDiv.querySelector('.innerDiv').appendChild(aliasDivNew);

                    
                    currentParent.appendChild(oldDiv);
                    currentParent.appendChild(newDiv);
                    this.querySelector('#renew-codes-content-old').appendChild(currentParent);

                    //checking for existing structure of codes
                    this.existingConceptNames = [];
                    let contextGroups = {};
                    [...parent.querySelectorAll('Alias')].filter(a => (/UMLS CUI\s*\[\d+,\d+\]/g).test(a.getAttribute('Context'))).forEach(a => {
                        let contextName = a.getAttribute('Context').split(',')[0] + ',x]';
                        if(this.existingConceptNames.indexOf(contextName) < 0) this.existingConceptNames.push(contextName);
                    });
                    [...parent.querySelectorAll('Alias')].filter(a => (/^UMLS CUI\s*([0-9]*|\-[0-9]+|\[\d+\])$/g).test(a.getAttribute('Context'))).forEach(a => {
                        let contextName = a.getAttribute('Context');
                        if(!contextGroups[contextName]) contextGroups[contextName] = [];
                        if(a.getAttribute('Name').trim().split(/[\s,]+/).length == 1) contextGroups[contextName].push(a.getAttribute('Name'));
                    });
                    //iterated again to preserve order
                    [...parent.querySelectorAll('Alias')].forEach(alias => {
                        let getsTranslated = (/^UMLS CUI\s*([0-9]*|\-[0-9]+|\[\d+\])$/g).test(alias.getAttribute('Context'))
                        let colorClass =  getsTranslated? 'is-link': 'has-color-gray';
                        let fontSizeClass = getsTranslated ? 'is-size-6' : 'is-size-7'
                        let aliasContext = alias.getAttribute('Context');
                        let aliasName = alias.getAttribute('Name');
                        let line = document.createElement('div');
                        line.classList = 'columns column is-full is-gapless m-0 p-0';
                        let context = document.createElement('label');
                        context.classList = `label column is-3 context has-checkbox-margin ${fontSizeClass} ${colorClass}`;
                        context.innerText = aliasContext;
                        line.appendChild(context);
                        let name = document.createElement('label');
                        name.classList = `label column is-9 name has-negative-checkbox-margin ${fontSizeClass} ${colorClass}`;
                        name.innerText = aliasName;
                        line.appendChild(name);
                        aliasDivOld.appendChild(line);

                        if(!getsTranslated) {
                            let lineNew = document.createElement('div');
                            lineNew.classList = 'columns column is-full is-gapless m-0 p-0 codeRow';
                            let newContext = context.cloneNode(true);
                            newContext.classList.remove('has-checkbox-margin')
                            lineNew.appendChild(newContext);
                            let newName = name.cloneNode(true);
                            newName.classList.remove('has-negative-checkbox-margin')
                            lineNew.appendChild(newName);
                            aliasDivNew.append(lineNew);
                        }
                        else {
                            let aliasCodes = aliasName.trim().split(/[\s,]+/);
                            let newCodes = [];
                            if(aliasCodes.length > 1) {
                                newCodes = this.createNewGroup(aliasCodes);
                            }
                            else if(contextGroups[aliasContext]){
                                newCodes = this.createNewGroup(contextGroups[aliasContext]);
                                contextGroups[aliasContext] = null;
                            }
                            newCodes.forEach(c => {
                                let lineNew = document.createElement('div');
                                lineNew.classList = 'columns column is-full is-gapless m-0 p-0 codeRow';
                                let contextNew = document.createElement('label');
                                contextNew.classList = `label column is-3 context ${fontSizeClass} ${colorClass}`;
                                contextNew.innerText = c.context;
                                lineNew.appendChild(contextNew);
                                let nameNew = document.createElement('label');
                                nameNew.classList = `label column is-9 name ${fontSizeClass} ${colorClass}`;
                                nameNew.innerText = c.name;
                                lineNew.appendChild(nameNew);
                                aliasDivNew.appendChild(lineNew)
                            })
                        }
                    })
                }
            })     
        }

        this.querySelector('.delete').onclick = () => this.remove();
        this.querySelector(".modal-background").onclick = () => this.remove();
        this.querySelector('#update-codes-save').onclick = () => this.saveCodes();
    }

    createNewGroup(codes) {
        let contextName = this.getNewConceptName();
        this.existingConceptNames.push(contextName);
        let i = 1;
        let returnCodes = [];
        codes.forEach(c => returnCodes.push({context: contextName.replace('x', i++), name: c}));
        return returnCodes;
    }

    getNewConceptName() {
        let i = 1;
        let found = false;
    
        while (!found) {
            let name = `UMLS CUI [${i},x]`;
            if (this.existingConceptNames.indexOf(name) < 0) return name;
            i++;
        }
    }

    toggleCheckbox(e){
        let status = e.target.checked;
        if(status) [...this.querySelectorAll('.codeDiv')].filter(d => d.oid == e.target.oid).forEach(d => d.classList.add('has-background-link-light'))   
        else [...this.querySelectorAll('.codeDiv')].filter(d => d.oid == e.target.oid).forEach(d => d.classList.remove('has-background-link-light'))   

    }

    toggleAll() {
        let status = this.querySelector('#update-codes-check-all').checked;
        [...this.querySelectorAll('.update-codes-checkbox')].forEach(cb => {
            cb.checked = status;
            if(status) [...this.querySelectorAll('.codeDiv')].filter(d => d.oid == cb.oid).forEach(d => d.classList.add('has-background-link-light'))   
            else [...this.querySelectorAll('.codeDiv')].filter(d => d.oid == cb.oid).forEach(d => d.classList.remove('has-background-link-light')) 
        });
    }

    saveCodes() {
        let oids = [];
        
        [...this.querySelectorAll('.update-codes-checkbox')].filter(cb => cb.checked).forEach(cb => oids.push(cb.oid));
        [...this.querySelectorAll('.codeResult')].filter(cR => oids.indexOf(cR.oid) >= 0).forEach(cR => {
            let codes = [];
            cR.querySelectorAll('.codeRow').forEach(c => {
                codes.push({context: c.querySelector('.context').innerText, name: c.querySelector('.name').innerText})
            })
            codes.sort((a,b) => {
                if(a.context < b.context) return -1;
                if(a.context > b.context) return 1;
                return 0;
            })
            this.setCodes(codes, cR.oid);
        })
        this.remove();
    }

    setCodes(codes, oid) {
        metadataWrapper.deleteElementAliasesForElement(oid);
        codes.forEach(c => {
            if(c.context && c.name)
                metadataWrapper.setElementAliasForElement(oid, c.context, c.name)
        });
                   
        if (!metadataModule.getIsAsyncEditMode()) metadataWrapper.storeMetadata();
        ioHelper.showToast(`Codes have been updated.`, 4000, ioHelper.interactionTypes.SUCCESS);
    }
}

window.customElements.define("renew-codes-modal", RenewCodesModal);