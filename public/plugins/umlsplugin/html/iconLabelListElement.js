class IconLabelListElement extends HTMLElement {
    setLabel(value) { this.value = value; }
    setName(name) {this.name = name; }
    connectedCallback() {
        this.innerHTML = `
            <div class="mb-1 icon-label-div">
                <div class="mb-0">
                    <label class="label mb-0">${this.value}</label>
                    <span class="has-text-link is-size-7">(${this.name})</span>
                </div>
                <button class="button is-light is-small is-link is-right">
                    <i class="fa-solid fa-trash no-pointer-events" style="pointer-events: none;"></i>
                </button>
            </div>
        `;
    } 
}
window.customElements.define("icon-label-list-element", IconLabelListElement);