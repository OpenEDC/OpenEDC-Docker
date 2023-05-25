var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import Icon from "../preprocessed/icon.js";

export default function ParameterComponent(_ref) {
    var placeholder = _ref.placeholder,
        parameters = _ref.parameters,
        onAdd = _ref.onAdd,
        onDelete = _ref.onDelete,
        onChange = _ref.onChange;

    var _React$useState = React.useState(""),
        _React$useState2 = _slicedToArray(_React$useState, 2),
        value = _React$useState2[0],
        setValue = _React$useState2[1];

    var _React$useState3 = React.useState({}),
        _React$useState4 = _slicedToArray(_React$useState3, 2),
        parameterValues = _React$useState4[0],
        setParameterValues = _React$useState4[1];

    var handleOnClick = function handleOnClick() {
        if (onAdd) onAdd(value);
        setValue("");
    };

    var handleOnDelete = function handleOnDelete(key) {
        if (onDelete) onDelete(key);
    };

    var setInitialStates = function setInitialStates() {
        if (!parameters) return;
        var newParameters = {};
        parameters.forEach(function (parameter) {
            return newParameters[parameter.key] = parameter.value;
        });
        setParameterValues(newParameters);
    };

    React.useEffect(function () {
        setInitialStates();
    }, [parameters, parameters.length]);

    var onParameterChange = function onParameterChange(event, key) {
        var newParameterValues = Object.assign({}, parameterValues, _defineProperty({}, key, event.target.value));
        setParameterValues(newParameterValues);
    };

    var onInputBlur = function onInputBlur(key) {
        if (onChange) onChange(key, parameterValues[key]);
    };

    return React.createElement(
        "div",
        null,
        React.createElement(
            "div",
            { className: "field has-addons mb-0" },
            React.createElement(
                "div",
                { className: "control" },
                React.createElement("input", { className: "input", type: "text", placeholder: placeholder, value: value, onChange: function onChange(event) {
                        return setValue(event.target.value);
                    } })
            ),
            React.createElement(
                "div",
                { className: "control" },
                React.createElement(
                    "a",
                    { className: "button is-link", onClick: handleOnClick },
                    "Add"
                )
            )
        ),
        React.createElement(
            "div",
            { className: "has-background-white", style: { border: "1px solid #dbdbdb", borderRadius: '4px' } },
            parameters.map(function (_ref2) {
                var key = _ref2.key,
                    value = _ref2.value;

                return React.createElement(
                    "div",
                    { className: "is-flex is-align-items-center", key: key },
                    React.createElement("input", { className: "input p-1 m-1", style: { border: "1px solid var(--link-color)", borderRadius: '3px' }, value: parameterValues[key] || '', onChange: function onChange(event) {
                            return onParameterChange(event, key);
                        }, onBlur: function onBlur() {
                            return onInputBlur(key);
                        } }),
                    React.createElement(Icon, { iconClassName: "fas fa-trash has-text-link", className: "is-pulled-right", onClick: function onClick() {
                            return handleOnDelete(key);
                        } })
                );
            })
        )
    );
}