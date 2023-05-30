function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

export default function Icon(_ref) {
    var iconClassName = _ref.iconClassName,
        className = _ref.className,
        onClick = _ref.onClick;

    return React.createElement(
        "div",
        { className: className ? [].concat(_toConsumableArray(className.split(" ")), ["icon"]).join(" ") : 'icon', onClick: onClick },
        React.createElement("i", { className: "" + iconClassName })
    );
}