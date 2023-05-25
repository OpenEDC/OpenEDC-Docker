import SelectIcon from "../../preprocessed/select/selecticon.js";
import SingleSelectContext from "../../preprocessed/select/singleselectcontext.js";

export default function SingleSelect(props) {
    let {singleSelectProps, icon} = props;
    const onInput = (event) => {
        if(singleSelectProps.handleOnInput) singleSelectProps.handleOnInput(singleSelectProps.name, event.target.value, singleSelectProps.parentId);
    }

    const options = [];
    for (let i = 0; i < singleSelectProps.values.length; i++) {
        let option = {};
        option.value = singleSelectProps.values[i];
        option.textContent = singleSelectProps.displayTexts ? singleSelectProps.displayTexts[i] : singleSelectProps.values[i];
        if (singleSelectProps.i18n) option.i18n =  singleSelectProps.values[i].toLowerCase();
        options.push(option);
    }

    return (
        <SingleSelectContext.Provider value={singleSelectProps}>
            <div className={`field ${singleSelectProps.isFullwidth ? 'is-fullwidth' :''}`}>
                <div className="control has-icons-left is-fullwidth" id="filter-site-control">
                    {icon}
                    <div id={`${singleSelectProps.name}-select-outer`} className={`select ${singleSelectProps.isFullwidth ? 'is-fullwidth' :''}`}>
                        <select id={`${singleSelectProps.name}-select-inner`} onInput={onInput} value={singleSelectProps.selectedValue}>
                            {
                                options.map(({value, textContent, i18n}) => {
                                    return (
                                        <option value={value} i18n={i18n} key={value}>{textContent}</option>
                                    )
                                })
                            }
                        </select>
                    </div>
                </div>
            </div>
        </SingleSelectContext.Provider>
    )

}

export const getSingleSelectProps = (iconClassName, name, isFullwidth, values, selectedValue, displayTexts, i18n, parentId, handleOnInput) => {
    return {iconClassName, name, isFullwidth, values, selectedValue, displayTexts, i18n, parentId, handleOnInput}
}

SingleSelect.Icon = SelectIcon;