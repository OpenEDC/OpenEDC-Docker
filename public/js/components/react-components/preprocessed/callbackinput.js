var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

export default function CallbackInput(props) {
    var handleSave = props.handleSave,
        type = props.type,
        placeholder = props.placeholder,
        identifier = props.identifier,
        parentId = props.parentId,
        value = props.value;

    var _React$useState = React.useState(""),
        _React$useState2 = _slicedToArray(_React$useState, 2),
        internValue = _React$useState2[0],
        setInternValue = _React$useState2[1];

    React.useEffect(function () {
        setInternValue(value ? value : "");
    }, [value]);

    var onChange = function onChange(event) {
        return setInternValue(event.currentTarget.value);
    };

    var onBlur = function onBlur(event) {
        if (handleSave) handleSave(identifier, event.target.value, parentId);
    };

    return React.createElement("input", { className: "is-fullwidth input", type: type, placeholder: placeholder, value: internValue, onChange: onChange, onBlur: onBlur });
}