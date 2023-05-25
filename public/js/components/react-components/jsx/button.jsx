export default function Button({onClick, icon, text, className}) {
    return (
        <button className={className ? [...className.split(" "), "button"].join(" ") : 'button'} onClick={onClick}>
            {text}
            {icon}
        </button>
    )
}