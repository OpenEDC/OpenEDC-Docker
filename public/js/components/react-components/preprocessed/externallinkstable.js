var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

import BulmaTable from "../preprocessed/bulmaTable.js";
import CallbackInput from "../preprocessed/callbackinput.js";
import * as languageHelper from "../../../helper/languagehelper.js";
import * as metadataWrapper from "../../../odmwrapper/metadatawrapper.js";
import SingleSelect, { getSingleSelectProps } from "../preprocessed/select/singleselect.js";
import Icon from "../preprocessed/icon.js";
import Button from "../preprocessed/button.js";
import ParameterComponent from "../preprocessed/parametercomponent.js";

export function ExternalLinksTable(props) {
    var aliasses = props.aliasses,
        path = props.path,
        onSave = props.onSave;

    var headers = [{ title: languageHelper.getTranslation('identifier'), width: '10%' }, { title: languageHelper.getTranslation('name'), width: '15%' }, { title: languageHelper.getTranslation('url'), width: '35%' }, { title: languageHelper.getTranslation('method'), width: '10%' }, { title: languageHelper.getTranslation('parameters'), width: '25%' }, { title: "", width: '5%' }];

    var _React$useState = React.useState(function () {
        return [];
    }),
        _React$useState2 = _slicedToArray(_React$useState, 2),
        links = _React$useState2[0],
        setLinks = _React$useState2[1];

    var _React$useState3 = React.useState(function () {
        return [];
    }),
        _React$useState4 = _slicedToArray(_React$useState3, 2),
        otherAliasses = _React$useState4[0],
        setOtherAliasses = _React$useState4[1];

    var _React$useState5 = React.useState(""),
        _React$useState6 = _slicedToArray(_React$useState5, 2),
        error = _React$useState6[0],
        setError = _React$useState6[1];

    var addRow = function addRow() {
        setLinks([].concat(_toConsumableArray(links), [getEmptyRow()]));
    };

    var changeLinkEntry = React.useCallback(function (identifier, value, key) {

        if (!key || !identifier) return;
        var newLinks = [].concat(_toConsumableArray(links));
        var index = newLinks.findIndex(function (link) {
            return link.key == key;
        });
        if (index < 0) return;
        newLinks[index].elements[identifier] = value;
        setLinks(newLinks);
    }, [links]);

    var getNewRow = React.useCallback(function () {
        var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var parentId = createID();
        return {
            key: parentId,
            elements: values
        };
    }, []);

    var getEmptyRow = React.useCallback(function () {
        return getNewRow();
    }, []);

    var getParamterObject = React.useCallback(function (parameter) {
        return { key: createID(), value: parameter };
    }, []);

    var deleteLink = React.useCallback(function (key) {
        setLinks([].concat(_toConsumableArray(links.filter(function (link) {
            return link.key !== key;
        }))));
    }, [links]);

    var addParameter = React.useCallback(function (parameter, key) {
        if (!key) return;
        var newLinks = [].concat(_toConsumableArray(links));
        var index = newLinks.findIndex(function (link) {
            return link.key == key;
        });
        if (index < 0) return;
        if (!newLinks[index].elements.parameters) newLinks[index].elements.parameters = [];
        newLinks[index].elements.parameters.push(getParamterObject(parameter));
        setLinks(newLinks);
    }, [links]);

    var deleteParameter = React.useCallback(function (parameterKey, parentKey) {
        if (!parentKey || !parameterKey) return;
        var newLinks = [].concat(_toConsumableArray(links));
        var index = newLinks.findIndex(function (link) {
            return link.key == parentKey;
        });
        if (index < 0) return;
        var parameterIndex = newLinks[index].elements["parameters"].findIndex(function (parameter) {
            return parameter.key == parameterKey;
        });
        if (parameterIndex < 0) return;
        newLinks[index].elements["parameters"].splice(parameterIndex, 1);
        setLinks(newLinks);
    }, [links]);

    var changeParameter = React.useCallback(function (parameterKey, parentKey, value) {
        if (!parameterKey || !parentKey) return;
        var newLinks = [].concat(_toConsumableArray(links));
        var index = newLinks.findIndex(function (link) {
            return link.key == parentKey;
        });
        if (index < 0) return;
        var parameterIndex = newLinks[index].elements["parameters"].findIndex(function (parameter) {
            return parameter.key == parameterKey;
        });
        if (parameterIndex < 0) return;
        newLinks[index].elements.parameters[parameterIndex].value = value;
        setLinks(newLinks);
    }, [links]);

    var formatRow = function formatRow(_ref) {
        var key = _ref.key,
            elements = _ref.elements;
        var identifier = elements.identifier,
            name = elements.name,
            url = elements.url,
            method = elements.method,
            parameters = elements.parameters;

        var methodSelectProps = getSingleSelectProps("fa-solid fa-sort-alpha-down", "method", true, ["GET", "POST"], method, ["Get", "Post"], true, key, changeLinkEntry);
        //const params = [...elements.parameters]
        return {
            key: key,
            elements: {
                identifier: { element: React.createElement(CallbackInput, { type: "text", placeholder: languageHelper.getTranslation('identifier'), identifier: "identifier", parentId: key, handleSave: changeLinkEntry, value: identifier }), width: '10%' },
                name: { element: React.createElement(CallbackInput, { type: "text", placeholder: languageHelper.getTranslation('name'), identifier: "name", parentId: key, handleSave: changeLinkEntry, value: name }), width: '15%' },
                url: { element: React.createElement(CallbackInput, { type: "text", placeholder: languageHelper.getTranslation('url'), identifier: "url", parentId: key, handleSave: changeLinkEntry, value: url }), width: '35%' },
                method: { element: React.createElement(SingleSelect, { type: "text", placeholder: languageHelper.getTranslation('method'), singleSelectProps: methodSelectProps, icon: React.createElement(SingleSelect.Icon, null) }), width: '10%' },
                parameters: { element: React.createElement(ParameterComponent, { parameters: parameters ? parameters : [], onAdd: function onAdd(parameter) {
                            return addParameter(parameter, key);
                        }, onDelete: function onDelete(parameterKey) {
                            return deleteParameter(parameterKey, key);
                        }, placeholder: languageHelper.getTranslation('parameter'), onChange: function onChange(parameterKey, value) {
                            return changeParameter(parameterKey, key, value);
                        } }), width: '25%' },
                delete: { element: React.createElement(Icon, { iconClassName: 'fas fa-trash has-text-link', onClick: function onClick() {
                            return deleteLink(key);
                        }, className: "is-fullwidth is-fullheight" }), width: '5%' }
            }
        };
    };

    var formatAliasses = React.useCallback(function (aliasses) {
        if (!aliasses) return;
        var regex = new RegExp('external_[A-Za-z]+_[A-Za-z]+', 'g');
        var filteredAliasses = [].concat(_toConsumableArray(aliasses)).filter(function (alias) {
            return alias.getAttribute('Context').match(regex);
        });
        setOtherAliasses([].concat(_toConsumableArray(aliasses)).filter(function (alias) {
            return !filteredAliasses.includes(alias);
        }));
        if (filteredAliasses.length == 0) return;

        var aliasMap = new Map();
        filteredAliasses.forEach(function (alias) {
            var splits = alias.getAttribute('Context').split('_');
            if (splits.length < 3) return;
            var name = splits[2];
            var type = splits[1];
            if (!aliasMap.has(name)) aliasMap.set(name, {});
            var value = alias.getAttribute('Name');
            if (type == "parameters") value = value.split("&").map(function (parameter) {
                return getParamterObject(parameter);
            });
            aliasMap.get(name)[type] = value;
        });
        var newLinks = [];
        aliasMap.forEach(function (value, key) {
            newLinks.push(getNewRow(Object.assign({ identifier: key }, value)));
        });
        setLinks(newLinks);
    }, []);

    var checkLinksValid = React.useCallback(function () {
        return links.map(function (link) {
            return link.elements.identifier;
        }).filter(function (value, index, array) {
            return array.indexOf(value) === index;
        }).length === links.length;
    }, [links]);

    var save = React.useCallback(function () {
        if (!checkLinksValid()) {
            setError(languageHelper.getTranslation('all-must-be-unique'));
            return;
        }
        var lastElement = path.last;
        var isCodeListitem = lastElement.element == 'codelistitem';
        var saveMethod = void 0;
        if (isCodeListitem) saveMethod = function saveMethod(context, name) {
            return metadataWrapper.setElementAliasForCodeListItem(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem, context, name);
        };else saveMethod = function saveMethod(context, name) {
            return metadataWrapper.setElementAliasForElement(lastElement.value, context, name);
        };

        if (isCodeListitem) metadataWrapper.deleteElementAliasesForCodeList(metadataWrapper.getCodeListOIDByItem(path.itemOID), path.codeListItem);else metadataWrapper.deleteElementAliasesForElement(lastElement.value);

        otherAliasses.forEach(function (alias) {
            saveMethod(alias.getAttribute('Context'), alias.getAttribute('Name'));
        });
        links.forEach(function (_ref2) {
            var elements = _ref2.elements;
            var identifier = elements.identifier,
                name = elements.name,
                url = elements.url,
                method = elements.method,
                parameters = elements.parameters;

            if (name) saveMethod("external_name_" + identifier, name);
            if (url) saveMethod("external_url_" + identifier, url);
            if (method) saveMethod("external_method_" + identifier, method);
            if (parameters) saveMethod("external_parameters_" + identifier, parameters.map(function (parameter) {
                return parameter.value;
            }).join("&"));
        });
        if (onSave) onSave();
    }, [path, links, otherAliasses, onSave]);

    React.useEffect(function () {
        formatAliasses(aliasses);
    }, [aliasses]);

    return React.createElement(
        "div",
        null,
        React.createElement(
            "div",
            { className: "mb-2" },
            React.createElement("span", { dangerouslySetInnerHTML: { __html: languageHelper.getTranslation('external-links-text') } })
        ),
        React.createElement(
            "div",
            null,
            error ? React.createElement(
                "span",
                { className: "has-text-danger" },
                error
            ) : ''
        ),
        React.createElement(Button, { className: "is-link is-small mb-1", onClick: function onClick() {
                return addRow();
            }, icon: React.createElement(Icon, { iconClassName: 'fas fa-add', className: "is-small" }) }),
        React.createElement(BulmaTable, { headers: headers, rows: links.map(function (link) {
                return formatRow(link);
            }) }),
        React.createElement(Button, { className: "button is-link is-pulled-right", onClick: function onClick() {
                return save();
            }, text: languageHelper.getTranslation('save') })
    );
};

function createID() {
    return "_" + Math.random().toString(36).substring(2, 9);
}

/* const container = document.getElementById('no-subjects-hint');
const root = ReactDOM.createRoot(container);
root.render(<TestComponent />); */

export function renderToContainer(container, props) {
    var root = ReactDOM.createRoot(container);
    root.render(React.createElement(ExternalLinksTable, props));
}