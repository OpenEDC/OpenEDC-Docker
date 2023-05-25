const SingleSelectContext = React.createContext();

export function useSingleSelectContext() {
    const context = React.useContext(SingleSelectContext);
    if(!context) {
        throw new Error("SingleSelect.* component must be rendered as child of SingleSelect component.")
    }
    return context;
}

export default SingleSelectContext;