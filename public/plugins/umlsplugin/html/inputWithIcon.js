class InputWithIcon extends HTMLElement {
    setIconName(iconName) { this.iconName = iconName; }
    setCallback(callback) {this.callback = callback; }
    connectedCallback() {
        this.innerHTML = `
        <div class="field has-addons">
            <div class="control is-expanded mr-0 input-holder">
            </div>
            <div class="control">
                <a class="button is-link is-light" onclick="${this.callback}(event)"><i class="fa-solid ${iconName} no-pointer-events" style="pointer-events: none;"></i></a>
            </div>
        </div>
        `;
    }
}
window.customElements.define("input-with-icon", InputWithIcon);