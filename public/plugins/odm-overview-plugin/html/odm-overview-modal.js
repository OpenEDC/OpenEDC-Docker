import * as odmOverviewTable from "./odm-overview-table.js";

class ODMOVerviewModal extends HTMLElement {
    setHeading(heading) { this.heading = heading; }
    setData(metadata) { this.metadata = metadata; }
    setIsEditable(editable) { this.editable = editable }
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="odm-overview-modal">
                <div class="modal-background"></div>
                <div class="modal-card fullsize has-text-centered">
                    <header class="modal-card-head">
                        <p class="modal-card-title">${this.heading}</p>
                        <button class="delete" aria-label="close"></button>
                    </header>
                    <section class="modal-card-body is-fullheight is-size-7" id="odm-overview-section">

                    </section>
                    <footer class="modal-card-foot" id="odm-overview-footer">
                        <button class="button is-link" id="odm-overview-button-bulk" disabled>Bulk edit</button>
                        <button class="button is-link" id="odm-overview-button-edit-codes" disabled>Edit codes</button>
                        <button class="button is-link" id="odm-overview-button-edit-codelists" disabled>Edit codelists</button>
                        <button class="button is-link" id="odm-overview-button-edit-metadata" disabled>Edit metadata</button>
                        <button class="button is-link" id="odm-overview-button-update-codes" disabled>Renew codes</button>
                        <button class="button is-link" id="odm-overview-button-sort-odm" disabled>Reorder odm</button>
                        <button class="button is-link" id="odm-overview-button-fix-odm" disabled>Fix ODM</button>
                    </footer>
                </div>
            </div>
        `;

        this.querySelectorAll('.button').forEach(b => {
            b.disabled = 'true'
        });
        if (!this.editable) this.querySelector('.modal-card').removeChild(this.querySelector('#odm-overview-footer'));
        this.querySelector("#odm-overview-section").appendChild(odmOverviewTable.getODMOverview(this.metadata, this.editable));
        this.querySelector('.delete').onclick = () => this.remove();
        this.querySelector(".modal-background").onclick = () => this.remove();

    }
}

window.customElements.define("odm-overview-modal", ODMOVerviewModal);