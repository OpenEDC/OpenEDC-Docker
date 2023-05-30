export default function Icon({iconClassName, className, onClick}) {
    return (
        <div className={className ? [...className.split(" "), "icon"].join(" ") : 'icon'} onClick={onClick}>
            <i className={`${iconClassName}`}></i>
        </div>
    )
}