function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

export default function Button(_ref) {
    var onClick = _ref.onClick,
        icon = _ref.icon,
        text = _ref.text,
        className = _ref.className;

    return React.createElement(
        "button",
        { className: className ? [].concat(_toConsumableArray(className.split(" ")), ["button"]).join(" ") : 'button', onClick: onClick },
        text,
        icon
    );
}