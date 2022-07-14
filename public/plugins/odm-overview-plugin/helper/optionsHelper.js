import * as ioHelper from "../../../js/helper/iohelper.js";

const $$ = query => document.querySelectorAll(query);

export function toggleItemExpandState() {
    const expandSwitch = $('#expand-items-switch').checked;
    setItemExpandState(expandSwitch);
    ioHelper.setSetting('expand-items-state', expandSwitch);
}

export function setItemExpandState(show) {
    [...$$('.additional-code-div')].forEach(cd => {
        if (show && jq(cd).prop('isHidden')) {
            jq(cd).slideDown();
            jq(cd).prop('isHidden', false)
            jq(cd.parentElement.querySelector('span.codeSpan')).addClass('is-hidden')
        } else if(!show && !jq(cd).prop('isHidden')){
            jq(cd).slideUp();
            jq(cd).prop('isHidden', true)
            jq(cd.parentElement.querySelector('span.codeSpan')).removeClass('is-hidden')
        }
    })
}


export function toggleStickGroupState() {
    const expandSwitch = $('#stick-group-switch').checked;
    setStickGroupState(expandSwitch);
    ioHelper.setSetting('stick-group-state', expandSwitch);  
}

export function setStickGroupState(show) {
    if(show)[...$$('.coloredRow')].forEach(r => r.classList.add('is-sticky-row'));
    else [...$$('.coloredRow')].forEach(r => r.classList.remove('is-sticky-row'));
}

export function toggleUseColorsState() {
    const expandSwitch = $('#use-colors-switch').checked;
    setUseColorsState(expandSwitch);
    ioHelper.setSetting('use-colors-state', expandSwitch);  
}

export function setUseColorsState(show) {
    [...$$('.coloredCodeDiv')].forEach(div => {
        if (show) {
            jq(div).css('color', div.color);
        } else if(!show){
            jq(div).css('color', '');
        }
    })
}