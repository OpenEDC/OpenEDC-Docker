import SelectIcon from "../../preprocessed/select/selecticon";
import SingleSelectContext from "../../preprocessed/select/singleselectcontext";

export default function SingleSelectWithIcon(props) {
    var singleSelectProps = props.singleSelectProps,
        icon = props.icon,
        name = props.name,
        isUnique = props.isUnique,
        isFullwidth = props.isFullwidth,
        values = props.values,
        selectedValue = props.selectedValue,
        displayTexts = props.displayTexts,
        i18n = props.i18n,
        parentI = props.parentI,
        handleChange = props.handleChange;


    React.useEffect(function () {
        setInternValue(value ? value : "");
    }, [value]);

    var onChange = function onChange(event) {
        return setInternValue(event.currentTarget.value);
    };

    var onBlur = function onBlur(event) {
        if (handleSave) handleSave(identifier, event.target.value, parentId);
    };

    return React.createElement(
        SingleSelectContext.Provider,
        { value: singleSelectProps },
        React.createElement(
            "div",
            { className: "field " + (singleSelectProps.isFullwidth ? 'is-fullwidth' : '') },
            React.createElement(
                "div",
                { "class": "control has-icons-left is-fullwidth", id: "filter-site-control" },
                icon
            )
        )
    );

    SingleSelect.Icon = SelectIcon;
}