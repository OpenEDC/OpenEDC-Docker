import Icon from "../preprocessed/icon.js";

export default function ParameterComponent({ placeholder, parameters, onAdd, onDelete, onChange }) {

    const [value, setValue] = React.useState("");
    const [parameterValues, setParameterValues] = React.useState({});

    const handleOnClick = () => {
        if(onAdd) onAdd(value);
        setValue("")
    }

    const handleOnDelete = (key) => {
        if(onDelete) onDelete(key);
    }

    const setInitialStates = () => {
        if(!parameters) return;
        let newParameters = {}
        parameters.forEach(parameter => newParameters[parameter.key] = parameter.value)
        setParameterValues(newParameters);
    }

    React.useEffect(() => {
        setInitialStates();
    },[parameters, parameters.length])

    const onParameterChange = (event, key) => {
        let newParameterValues = {...parameterValues, [key]: event.target.value};
        setParameterValues(newParameterValues);
    }

    const onInputBlur = (key) => {
        if(onChange) onChange(key, parameterValues[key]);
    }

    return (
        <div>
            <div className="field has-addons mb-0">
                <div className="control">
                    <input className="input" type="text" placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)}/>
                </div>
                <div className="control">
                    <a className="button is-link" onClick={handleOnClick}>Add</a>
                </div>
            </div>
            <div className="has-background-white" style={{border: "1px solid #dbdbdb", borderRadius: '4px'}}>
                {parameters.map(({key, value}) => {
                    return (
                        <div className="is-flex is-align-items-center" key={key}>
                            <input className="input p-1 m-1"  style={{border: "1px solid var(--link-color)", borderRadius: '3px'}} value={parameterValues[key] || ''} onChange={(event) => onParameterChange(event, key)} onBlur={() => onInputBlur(key)}/>
                            <Icon iconClassName="fas fa-trash has-text-link" className="is-pulled-right" onClick={() => handleOnDelete(key)}></Icon>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}