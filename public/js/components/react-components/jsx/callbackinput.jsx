
export default function CallbackInput(props) {
    let {handleSave, type, placeholder, identifier, parentId, value} = props;

    const [internValue, setInternValue] = React.useState("");

    React.useEffect(() => {
        setInternValue(value ? value : "");
    }, [value])

    const onChange = (event) => setInternValue(event.currentTarget.value);

    const onBlur = (event) => {
        if(handleSave) handleSave(identifier, event.target.value, parentId);
    }

    return (
        <input className="is-fullwidth input" type={type} placeholder={placeholder} value={internValue} onChange={onChange} onBlur={onBlur}/>
    )
}