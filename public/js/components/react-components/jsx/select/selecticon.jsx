import Icon from "../../preprocessed/icon.js";
import { useSingleSelectContext } from "../../preprocessed/select/singleselectcontext.js";

export default function SelectIcon() {
    const { iconClassName } = useSingleSelectContext();
    return (
        <Icon iconClassName={iconClassName}/>
    )
}