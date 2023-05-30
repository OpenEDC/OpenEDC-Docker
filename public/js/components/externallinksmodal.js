import * as externalLinksTable from "./react-components/preprocessed/externallinkstable.js"

class ExternalLinksModal extends HTMLElement {
    setAliasses(aliasses) { this.aliasses = aliasses; };
    setPath(path) { this.path = path; }
    setCloseCallback(closeCallback) { this.closeCallback = closeCallback; }
    setTitle(title) { this.title = title; }
    connectedCallback() {
        this.innerHTML = `
        <div class="modal is-active" style="user-select: text;">
            <div class="modal-background"></div>
            <div class="modal-card is-width-large">
                <header class="modal-card-head">
                    <p class="modal-card-title">${this.title}</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body">
                <div id="form-container"></div>
                </section>
            </div>
        </div>`;
        /* this.querySelector(".modal-background").onclick = () => {
            this.remove();
        }; */
        this.querySelector('.delete').onclick = () => this.remove();

        const container = document.getElementById('form-container');
        externalLinksTable.renderToContainer(container, {aliasses: this.aliasses, path: this.path, onSave: () => {
            this.remove();
            if (this.closeCallback) this.closeCallback(this.currentSettings);}
        });
    }  
}

window.customElements.define("external-links-modal", ExternalLinksModal);