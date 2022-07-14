import * as ioHelper from "../../../js/helper/iohelper.js";

class OptionsModal extends HTMLElement {
    setHeading(heading) { this.heading = heading; }
    setData(data) { this.data = data; }
    setIsEditable(editable) {this.editable = editable }
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="options-modal">
                <div class="modal-background"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">${this.heading}</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body is-fullheight" id="options-modal-section">
                        <div class="mb-0" id="options-modal-content">
                        </div>
                    </section>
                </div>
            </div>
        `;
        
        let contentDiv = this.querySelector('#options-modal-content');
        this.data.forEach(d => {
            let outerDiv = document.createElement('div');
            outerDiv.classList = 'field';
            let input = document.createElement('input');
            input.classList = 'switch is-rounded is-link';
            input.type = 'checkbox';
            outerDiv.appendChild(input);
            input.id = d.id;
            input.name = d.id;
            input.checked = ioHelper.getSetting(d.state);
            input.onchange = () => d.callback();
            let label = document.createElement('label');
            label.classList = 'label is-link';
            label.htmlFor  = d.id;
            label.innerHTML = d.text
            outerDiv.append(label);
            contentDiv.appendChild(outerDiv);
        });
        this.querySelector('.delete').onclick = () => { this.remove();}
        this.querySelector(".modal-background").onclick = () => { this.remove();}
    }  
}

window.customElements.define("options-modal", OptionsModal);