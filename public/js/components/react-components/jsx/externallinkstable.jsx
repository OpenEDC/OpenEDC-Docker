import BulmaTable from "../preprocessed/bulmaTable.js"
import CallbackInput from "../preprocessed/callbackinput.js";
import * as languageHelper from "../../../helper/languagehelper.js"
import * as metadataWrapper from "../../../odmwrapper/metadatawrapper.js"
import SingleSelect, { getSingleSelectProps } from "../preprocessed/select/singleselect.js";
import Icon from "../preprocessed/icon.js";
import Button from "../preprocessed/button.js";
import ParameterComponent from "../preprocessed/parametercomponent.js";

export function ExternalLinksTable (props) {
    const {aliasses, path, onSave} = props;
    const headers = [
        {title: languageHelper.getTranslation('identifier'), width: '10%'}, 
        {title: languageHelper.getTranslation('name'), width: '15%'}, 
        {title: languageHelper.getTranslation('url'), width: '35%'}, 
        {title: languageHelper.getTranslation('method'), width: '10%'}, 
        {title: languageHelper.getTranslation('parameters'), width: '25%'},
        {title: "", width: '5%'}
    ]

    const [links, setLinks] = React.useState(() => []);
    const [otherAliasses, setOtherAliasses] = React.useState(() => []);
    const [error, setError] = React.useState("");

    const addRow = () => {
       setLinks([...links, getEmptyRow()]);
    }

    const changeLinkEntry = React.useCallback((identifier, value, key) => {

        if(!key || !identifier) return;
        let newLinks = [...links];
        const index = newLinks.findIndex(link => link.key == key);
        if(index < 0) return;
        newLinks[index].elements[identifier] = value;
        setLinks(newLinks);
    },[links])

    const getNewRow = React.useCallback((values = {}) => {
        const parentId =  createID();
        return {
            key: parentId,
            elements: values
        } 
    },[]);

    const getEmptyRow = React.useCallback(() => {
        return getNewRow();
    }, [])

    const getParamterObject = React.useCallback((parameter) => {
        return {key: createID(), value: parameter}
    }, [])

    const deleteLink = React.useCallback((key) => {
        setLinks([...links.filter(link => link.key !== key)]);
    }, [links])

    const addParameter = React.useCallback((parameter, key) => {
        if(!key) return;
        let newLinks = [...links];
        const index = newLinks.findIndex(link => link.key == key);
        if(index < 0) return;
        if(!newLinks[index].elements.parameters) newLinks[index].elements.parameters = [];
        newLinks[index].elements.parameters.push(getParamterObject(parameter));
        setLinks(newLinks);
    },[links])

    const deleteParameter = React.useCallback((parameterKey, parentKey) => {
        if(!parentKey || !parameterKey) return;
        let newLinks = [...links];
        const index = newLinks.findIndex(link => link.key == parentKey);
        if(index < 0) return;
        const parameterIndex = newLinks[index].elements["parameters"].findIndex(parameter => parameter.key == parameterKey)
        if(parameterIndex < 0) return;
        newLinks[index].elements["parameters"].splice(parameterIndex, 1)
        setLinks(newLinks);
    },[links])

    const changeParameter = React.useCallback((parameterKey, parentKey, value) => {
        if(!parameterKey || !parentKey) return;
        let newLinks = [...links];
        const index = newLinks.findIndex(link => link.key == parentKey);
        if(index < 0) return;
        const parameterIndex = newLinks[index].elements["parameters"].findIndex(parameter => parameter.key == parameterKey)
        if(parameterIndex < 0) return;
        newLinks[index].elements.parameters[parameterIndex].value = value;
        setLinks(newLinks);
    }, [links])

    const formatRow = ({key, elements}) => {
        let {identifier, name, url, method, parameters} = elements;
        let methodSelectProps = getSingleSelectProps("fa-solid fa-sort-alpha-down", "method", true, ["GET", "POST"], method, ["Get", "Post"], true, key, changeLinkEntry);
        //const params = [...elements.parameters]
        return {
            key,
            elements: {
                identifier: {element: <CallbackInput type="text" placeholder={languageHelper.getTranslation('identifier')} identifier="identifier" parentId={key} handleSave={changeLinkEntry} value={identifier}/>, width: '10%' },
                name: {element: <CallbackInput type="text" placeholder={languageHelper.getTranslation('name')} identifier="name" parentId={key} handleSave={changeLinkEntry} value={name}/>, width: '15%' }, 
                url: {element: <CallbackInput type="text" placeholder={languageHelper.getTranslation('url')} identifier="url" parentId={key} handleSave={changeLinkEntry} value={url} />, width: '35%' }, 
                method: {element: <SingleSelect type="text" placeholder={languageHelper.getTranslation('method')} singleSelectProps={methodSelectProps} icon={<SingleSelect.Icon />}/>, width: '10%' }, 
                parameters: {element: <ParameterComponent parameters={parameters ? parameters : []} onAdd={(parameter) => addParameter(parameter, key)} onDelete={(parameterKey) => deleteParameter(parameterKey, key)} placeholder={languageHelper.getTranslation('parameter')} onChange={(parameterKey, value) => changeParameter(parameterKey, key, value)}></ParameterComponent>, width: '25%'},
                delete: {element: <Icon iconClassName={'fas fa-trash has-text-link'} onClick={() => deleteLink(key)} className={"is-fullwidth is-fullheight"}></Icon>, width: '5%'}
            }
        } 
    }

    const formatAliasses = React.useCallback((aliasses) => {
        if(!aliasses) return;
        const regex = new RegExp('external_[A-Za-z]+_[A-Za-z]+', 'g');
        const filteredAliasses = [...aliasses].filter(alias => alias.getAttribute('Context').match(regex));
        setOtherAliasses([...aliasses].filter(alias => !filteredAliasses.includes(alias)));
        if(filteredAliasses.length == 0) return;

        let aliasMap = new Map();
        filteredAliasses.forEach(alias => {
            let splits = alias.getAttribute('Context').split('_');
            if (splits.length < 3) return;
            let name = splits[2];
            let type = splits[1];
            if(!aliasMap.has(name)) aliasMap.set(name, {});
            let value = alias.getAttribute('Name');
            if(type == "parameters") value = value.split("&").map(parameter => getParamterObject(parameter));
            aliasMap.get(name)[type] = value;
        })
        let newLinks = [];
        aliasMap.forEach((value, key) => {
            newLinks.push(getNewRow({identifier: key, ...value}))
        })
        setLinks(newLinks);
    },[]);

    const checkLinksValid = React.useCallback(() => {
        return links.map(link => link.elements.identifier).filter((value, index, array) => array.indexOf(value) === index).length === links.length;
    },[links]);

    const save = React.useCallback(() => {
        if(!checkLinksValid()) {
            setError(languageHelper.getTranslation('all-must-be-unique'))
            return;
        }
        const lastElement = path.last;
        const isCodeListitem = lastElement.element == 'codelistitem';
        let saveMethod;
        if(isCodeListitem) saveMethod = (context, name) => metadataWrapper.setElementAliasForCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem, context, name);
        else saveMethod = (context, name) => metadataWrapper.setElementAliasForElement(lastElement.value, context, name)

        if (isCodeListitem)
            metadataWrapper.deleteElementAliasesForCodeList(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem);
        else
            metadataWrapper.deleteElementAliasesForElement(lastElement.value);

        otherAliasses.forEach(alias => {
            saveMethod(alias.getAttribute('Context'), alias.getAttribute('Name'))
        });
        links.forEach(({elements}) => {
            let {identifier, name, url, method, parameters} = elements;
            if(name) saveMethod(`external_name_${identifier}`, name);
            if(url) saveMethod(`external_url_${identifier}`, url);
            if(method) saveMethod(`external_method_${identifier}`, method);
            if(parameters) saveMethod(`external_parameters_${identifier}`, parameters.map(parameter => parameter.value).join("&"));

        })
        if(onSave) onSave();
    },[path, links, otherAliasses, onSave])

    React.useEffect(() => {
        formatAliasses(aliasses);
    }, [aliasses])

    return (
        <div>
            <div className="mb-2">
                <span dangerouslySetInnerHTML={{ __html: languageHelper.getTranslation('external-links-text')}}></span>
            </div>
            <div>
                {error ? <span className={"has-text-danger"}>{error}</span> : ''}
            </div>
            <Button className={"is-link is-small mb-1"} onClick={() => addRow()} icon={<Icon iconClassName={'fas fa-add'} className={"is-small"}></Icon>}></Button>
            <BulmaTable headers={headers} rows={links.map(link => formatRow(link))}></BulmaTable>
            <Button className={"button is-link is-pulled-right"} onClick={() => save()} text={languageHelper.getTranslation('save')}></Button>
            
        </div>
    );
};

function createID() {
    return "_" + Math.random().toString(36).substring(2, 9);
}

/* const container = document.getElementById('no-subjects-hint');
const root = ReactDOM.createRoot(container);
root.render(<TestComponent />); */

export function renderToContainer(container, props) {
    const root = ReactDOM.createRoot(container);
    root.render(<ExternalLinksTable {...props}/>);
}