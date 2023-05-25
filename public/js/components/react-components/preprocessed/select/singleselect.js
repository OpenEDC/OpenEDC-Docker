import SelectIcon from "../../preprocessed/select/selecticon.js";
import SingleSelectContext from "../../preprocessed/select/singleselectcontext.js";

export default function SingleSelect(props) {
    var singleSelectProps = props.singleSelectProps,
        icon = props.icon;

    var onInput = function onInput(event) {
        if (singleSelectProps.handleOnInput) singleSelectProps.handleOnInput(singleSelectProps.name, event.target.value, singleSelectProps.parentId);
    };

    var options = [];
    for (var i = 0; i < singleSelectProps.values.length; i++) {
        var option = {};
        option.value = singleSelectProps.values[i];
        option.textContent = singleSelectProps.displayTexts ? singleSelectProps.displayTexts[i] : singleSelectProps.values[i];
        if (singleSelectProps.i18n) option.i18n = singleSelectProps.values[i].toLowerCase();
        options.push(option);
    }

    return React.createElement(
        SingleSelectContext.Provider,
        { value: singleSelectProps },
        React.createElement(
            "div",
            { className: "field " + (singleSelectProps.isFullwidth ? 'is-fullwidth' : '') },
            React.createElement(
                "div",
                { className: "control has-icons-left is-fullwidth", id: "filter-site-control" },
                icon,
                React.createElement(
                    "div",
                    { id: singleSelectProps.name + "-select-outer", className: "select " + (singleSelectProps.isFullwidth ? 'is-fullwidth' : '') },
                    React.createElement(
                        "select",
                        { id: singleSelectProps.name + "-select-inner", onInput: onInput, value: singleSelectProps.selectedValue },
                        options.map(function (_ref) {
                            var value = _ref.value,
                                textContent = _ref.textContent,
                                i18n = _ref.i18n;

                            return React.createElement(
                                "option",
                                { value: value, i18n: i18n, key: value },
                                textContent
                            );
                        })
                    )
                )
            )
        )
    );
}

export var getSingleSelectProps = function getSingleSelectProps(iconClassName, name, isFullwidth, values, selectedValue, displayTexts, i18n, parentId, handleOnInput) {
    return { iconClassName: iconClassName, name: name, isFullwidth: isFullwidth, values: values, selectedValue: selectedValue, displayTexts: displayTexts, i18n: i18n, parentId: parentId, handleOnInput: handleOnInput };
};

SingleSelect.Icon = SelectIcon;