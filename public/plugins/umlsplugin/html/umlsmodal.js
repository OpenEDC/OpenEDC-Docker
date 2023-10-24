class UmlsModal extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="modal" id="umls-codes-modal">
                <div class="modal-background"></div>
                <div class="modal-card is-width-large">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Search for UMLS Codes</p>
                        <button class="delete" aria-label="close" id="umls-modal-close"></button>
                    </header>
                    <section class="modal-card-body" style="background-color:white;">
                    <div class="flex-container">
                        <nav class="panel is-link is-flex-row mr-1 mb-0 is-width-small" id="umls-selected-codes">
                            <p class="panel-heading has-text-centered mb-2">Concepts</p>
                            <div class="tree-panel-blocks has-overflow-y has-scrollbar-link p-1" id="umls-codes-content"></div>
                            <div class="panel-block">
                                <button class="button is-fullwidth is-small is-pulled-right is-link is-light" id="umls-codes-add-concept">Add concept</button>
                                </div>
                        </nav>
                        <div class="box is-flex-row is-flex-grow mb-1">
                            <div>
                                <label class="label" style="display:inline-block;">UMLS search term</label>
                                <div style="float:right;">
                                    <a target="_blank" rel="noopener noreferrer" href="https://uts.nlm.nih.gov/uts/umls/home">UMLS metathesaurus (login required)</a> 
                                    <span> | </span>          
                                    <a target="_blank" rel="noopener noreferrer" href="https://ncim.nci.nih.gov/ncimbrowser/">NCImetathesaurus</a>           
                                </div>    
                            </div>
                            <div class="field has-addons">
                                <div class="control is-expanded">
                                    <input class="input is-link" type="text" autocomplete="off" placeholder="Search term" autocomplete-mode="1" id="umls-search-input">
                                </div>
                                <div class="control">
                                    <a class="button is-link" id="umls-search-button">Search</a>
                                </div>
                            </div>
                            <div id="umls-table-div">
                                <table class="table is-striped is-fullwidth" id="umls-search-table">
                                    <thead class="is-fullwidth">
                                        <tr>
                                            <th>Name</th>
                                            <th>Concept Code</th>
                                            <th>Occurrences</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                    </section>
                    <footer class="modal-card-foot">
                        <button class="button is-link" id="umls-success-button">Save changes</button>
                    </footer>
                </div>
            </div>
        `;
    }
}
window.customElements.define("umls-modal", UmlsModal);