import Icon from "../../preprocessed/icon.js";
import { useSingleSelectContext } from "../../preprocessed/select/singleselectcontext.js";

export default function SelectIcon() {
    var _useSingleSelectConte = useSingleSelectContext(),
        iconClassName = _useSingleSelectConte.iconClassName;

    return React.createElement(Icon, { iconClassName: iconClassName });
}