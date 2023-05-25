import * as autocompletehelperSelect from "../helper/autocompletehelperselect.js"
import * as languageHelper from "../helper/languagehelper.js"

class DateModal extends HTMLElement {

    setSaveCallback(callback) {this.callback = callback; }
    setOptions(options) {this.options = options; }
    setCurrentValue(value) {this.currentValue = value}
    connectedCallback() {
        this.innerHTML = `
            <div class="modal is-active" id="date-modal">
                <div class="modal-background"></div>
                <div class="modal-content is-medium is-fullheight-mobile">
                    <div class="box is-flex is-flex-direction-column" id="date-modal-elements" style="height:310px;">
                        <h2 class="subtitle" i18n="edit-image-heading"></h2>
                    </div>
                </div>
            </div>
        `;
        this.querySelector(".modal-background").onclick = () => {
            this.save();
        };

        this.dateValues = {};
        this.monthsArray = ['january', 'february', 'march','april', 'mai', 'june', 'juli', 'august', 'september', 'october', 'november', 'december'];
        if(this.currentValue) {
            let splits = this.currentValue.split(".");
            this.options.forEach((option, index) => {
                this.dateValues[option] = splits[index];
            })
        }
        let elementsDiv = this.querySelector('#date-modal-elements');
        let containerDiv = document.createElement('div');
        containerDiv.classList = 'columns is-variable is-1';
        [...this.options].forEach(option => {
            let selectDiv = document.createElement('div')
            selectDiv.classList = 'column'
            let selectContainer = document.createElement('div');
            let options = [];
            switch(option) {
                case 'year': 
                    let currentYear = (new Date()).getFullYear();
                    options = [...Array(150).keys()].map(entry => currentYear - entry).map(entry => { return {value: entry }});
                    break;
                case 'day':
                    options = [...Array(31).keys()].map(entry => entry + 1).map(entry => { return {value: entry }});
                    break;
                case 'month': 
                    options = this.monthsArray.map((entry, index) => { return {value: index + 1, label: languageHelper.getTranslation(entry)}});
                    break;
                default:
                    return;
            }
            let select = document.createElement('input');
            select.classList = 'input';
            select.type = 'text';
            select.autocomplete = 'off';
            select.placeholder = languageHelper.getTranslation(option);
            select.onfocus = () => {
                if(select.value == 'undefined' || select.value == 'dd' || select.value == 'mm' || select.value == 'yyyy') select.value = '';
                autocompletehelperSelect.enableAutocomplete(select, autocompletehelperSelect.modes.CUSTOM, null, options, (value) => {
                    this.dateValues[option] = value < 10 ? '0' + value : value;
                    this.updateInput()
                    if(!this.errorParagraph.classList.contains('is-hidden')) this.checkDate()
                })
            };
            select.onblur = () => {
                if(option === 'month') {
                    //[...select.querySelectorAll('.autocomplete-option')].filter(option => option.innerText.contains(select.value))
                    return;
                }
                this.dateValues[option] = !select.value ? undefined : select.value < 10 ? '0' + select.value : select.value;
                this.updateInput();
                if(!this.errorParagraph.classList.contains('is-hidden')) this.checkDate()
            }
            if(this.dateValues[option]) {
                if(option === 'month') select.value = languageHelper.getTranslation(this.monthsArray[this.dateValues[option] - 1]);
                else select.value = this.dateValues[option]
            } 

            selectContainer.appendChild(select)
            selectDiv.appendChild(selectContainer)

            
            containerDiv.appendChild(selectDiv);
        })
        elementsDiv.appendChild(containerDiv);
        this.input = document.createElement('input');
        this.input.classList = 'input';
        this.input.type = 'text';
        this.input.autocomplete = 'off';
        this.input.placeholder = 'dd.mm.yyyy';
        this.input.disabled = true;

        elementsDiv.appendChild(this.input)
        this.updateInput();

        this.errorParagraph = document.createElement('p');
        this.errorParagraph.classList = "has-text-danger";
        this.errorParagraph.innerHTML = languageHelper.getTranslation('wrong-date-text')
        elementsDiv.appendChild(this.errorParagraph);
        this.errorParagraph.hide();

        let buttonDiv = document.createElement('div');
        buttonDiv.classList = 'buttons is-align-items-flex-end is-flex-grow-1 mt-4 is-justify-content-end';
        let buttonCancel = document.createElement("button");
        buttonCancel.classList = 'button is-link'
        buttonCancel.textContent = languageHelper.getTranslation('cancel');
        buttonCancel.onclick = () => {
            this.remove();
        };
        buttonDiv.appendChild(buttonCancel)
        let button = document.createElement("button");
        button.classList = 'button is-link'
        button.textContent = languageHelper.getTranslation('save');
        button.onclick = () => {
            this.save();
        };
        buttonDiv.appendChild(button)
        elementsDiv.appendChild(buttonDiv)
    }  

    updateInput() {
        let inputArray = [];
        let s;
        this.options.forEach(option => {
            switch(option) {
                case 'day': 
                    s = this.dateValues['day']??'dd'
                    break;
                case 'month': 
                    s = this.dateValues['month']??'mm'
                    break;
                case 'year': 
                    s = this.dateValues['year']??'yyyy'
                    break;
                default: return;
            }
            inputArray.push(s)
        });
        this.input.value = inputArray.join('.')
    }

    save() {
        if(this.checkDate()) {
            this.callback(this.input.value)
            this.remove();
        }
    }

    checkDate() {
        if(this.options.includes('optional')) return true;
        if(this.options.optional) return true;
        for(let option of this.options) {
            if(!this.dateValues[option]) {
                this.errorParagraph.show();
                return false;;
            }
            let possibleValues;
            switch(option) {
                case 'year': 
                    let currentYear = (new Date()).getFullYear();
                    possibleValues = [...Array(150).keys()].map(entry => currentYear - entry).map(entry => { return {value: entry }});
                    break;
                case 'day':
                    possibleValues = [...Array(31).keys()].map(entry => entry + 1).map(entry => { return {value: entry }});
                    break;
                case 'month': 
                    possibleValues = this.monthsArray.map((entry, index) => { return {value: index + 1, label: languageHelper.getTranslation(entry)}});
                    break;
            }
            if(!possibleValues.map(v => v.value).map(value => value < 10 ? `0${value}`: `${value}`).includes(`${this.dateValues[option]}`)) {
                this.errorParagraph.show();
                return false;
            }
        }
        
        this.errorParagraph.hide();
        return true;
    }
}

window.customElements.define("date-modal", DateModal);