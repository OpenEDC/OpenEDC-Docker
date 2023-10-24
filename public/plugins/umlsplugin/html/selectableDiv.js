import * as htmlHelper from "../helper/htmlhelper.js"
import * as requestHelper from "../helper/requesthelper.js"
class SelectableDiv extends HTMLElement {
    setValue(value) { this.value = value; }
    setCallback(callback) {this.callback = callback; }
    connectedCallback() {
        this.randomNumber = Math.floor(Math.random() * 100000);
        this.innerHTML = `
        <div id="umls-main-div" class="content sortable-umls-group-context field columns is-gapless mb-1 is-multiline">
            <div class="column is-12 is-light mb-0">
                <label class="label" onclick="${this.callback}(event)">${this.value}</label>
                <ul id="menu-${this.randomNumber}" class="container__menu container__menu--hidden">
                    <li class="container__item">
                        <label class="label">Enter code manually</label>
                        <div class="field has-addons">
                            <div class="control is-expanded">
                                <input class="input is-link" type="text" autocomplete="off" placeholder="code" autocomplete-mode="1" id="umls-manual-code">
                            </div>
                            <div class="control">
                                <a class="button is-link" id="umls-manual-code-save-button">add</a>
                            </div>
                        </div>
                        <div id="umls-meaning-div"></div>
                    </li>
                    <li class="container__divider"></li>
                    <li class="container__item"><a id="umls-no-appropriate-code">No appropriate code found</a></li>
                </ul>
            </div>
            <ul class="column is-12 sortable-umls-group-list has-min-height-20">
            </ul>
        </div>
        <hr class="umls-hr">
        `;

        this.querySelector('.sortable-umls-group-list').contextName = this.value;
        this.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            let menu = this.querySelector(`#menu-${this.randomNumber}`);
            const rect = document.querySelector('#umls-codes-modal .modal-card').getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set the position for menu
            menu.style.top = `${y}px`;
            menu.style.left = `${x}px`;

            // Show the menu
            menu.classList.remove('container__menu--hidden');
            //jq(menu).css({'top':e.pageY,'left':e.pageX, 'position':'absolute', 'border':'1px solid darkblue', 'z-index': 50});
            document.addEventListener('click', (e) => this.documentClickHandler(e));
            return false;
        }, false);

        this.querySelector('#umls-no-appropriate-code').onclick = () => this.addCode('C3846158');
        this.querySelector("#umls-manual-code-save-button").onclick = () => this.addManualCode();
        this.querySelector('#umls-manual-code').oninput = () => this.searchCode();
    }

    documentClickHandler(e) {
        let menu = document.querySelector(`#menu-${this.randomNumber}`);
        const isClickedOutside = !menu.contains(e.target);
        if (isClickedOutside) {
            // Hide the menu
            menu.classList.add('container__menu--hidden');

            // Remove the event handler
            document.removeEventListener('click', this.documentClickHandler);
        }
    } 

    addManualCode() {
        this.addCode(this.querySelector('#umls-manual-code').value);
    }
    
    addCode(code) {
        htmlHelper.addUMLSCodeToList(code, this.querySelector('#umls-main-div'));
    }

    searchCode() {
        requestHelper.getUMLSData(this.querySelector('#umls-manual-code').value).then(code => $('#umls-meaning-div').innerText = code.STR[0]);
    }
}
window.customElements.define("selectable-div", SelectableDiv);