import * as htmlElements from "../../../js/helper/htmlelements.js"

class KeyValueModal extends HTMLElement {
    setHeading(heading) { this.heading = heading; }
    setData(data) { this.data = data; }
    setIsEditable(editable) {this.editable = editable }
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="odm-detail-modal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <div class="modal-card-title break-word-hard">${this.heading}</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body is-fullheight" id="odm-overview-section">
                        <div class="columns is-gapless is-multiline mb-0" id="kv-content">
                        </div>
                    </section>
                </div>
            </div>
        `;
        
        let contentDiv = this.querySelector('#kv-content');
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
            
            contentDiv.append(div);

        });
        this.querySelector('.delete').onclick = () => { this.remove();}
        this.querySelector(".modal-background").onclick = () => { this.remove();}
    }
    
}

window.customElements.define("key-value-modal", KeyValueModal);