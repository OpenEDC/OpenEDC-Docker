
export default function BulmaTable(props) {
    let {headers, rows} = props;
    return (
        <div className="table is-striped is-fullwidth" style={{border: '5px solid var(--link-color)', borderRadius: '5px'}}>
            <div className="mb-0 is-sticky-header has-background-link has-text-white p-2" style={{boxShadow: '0px 2px var(--link-active-color)'}}>
                <div className="is-flex is-fullwidth mb-0 is-justify-content-space-between is-flex-direction-row">
                    {headers ? headers.map(({title, width}) => {
                        return (
                            <div className="is-flex-grow-1 has-text-weight-bold ml-1" style={{width}} key={title}>{title}</div>
                        )
                    }) : ''}
                </div>
            </div>
            <div className="has-background-link" style={{overflowY: 'auto', maxHeight: '270px'}}>
                {rows ? rows.map(row => {
                    const {key, elements} = row;
                    return (
                        <div className="is-flex mb-0 is-justify-content-space-between is-flex-direction-row m-2 has-background-light p-1" key={`row_${key}`} style={{gap: '5px', border: '3px solid var(----link-light-color)', borderRadius: '3px'}}>
                            {Object.entries(elements).map(([identifier, {element, width}]) => {
                                return <div className="is-flex-grow-1 is-flex " style={{width}} key={identifier}>{element}</div>
                            })}
                        </div>
                    )
                }) : ''}
            </div>
        </div>
    )
}