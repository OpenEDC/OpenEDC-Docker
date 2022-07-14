import * as languageHelper from "../../../js/helper/languagehelper.js"

let dataTables = {}
let umlsSearchDatatable = {
    //"paging": false,
    "bLengthChange": false,
    "pagingType": "first_last_numbers",
    "searching": false,
    "autoWidth": false,
    "bInfo" : false,
    "order": [[ 2, "desc" ]],
    "data": [],
    "columns": [
        {
            "data": "name",
            render: (data, type) => {
                if (type === 'display') {
                    return `<span class="break">${data}</span>`
                }
                else {
                    return data;
                }
            }
        },
        {
            "data": "code",
            render: (data, type) => {
                if (type === 'display') {
                    return data.map(d => `<b>${d.concept}</b>: ${d.name}`).join('<br>');
                }
                else {
                    return data;
                }
            } 
        },
        {
            "data": "occurrences",
            render: (data, type) => {
                if (type === 'display') {
                    return `<span>${data.length}</span>`;
                }
                else
                    return data;
            }
        },
        {
            "data": "item",
            render: (data, type, full, meta) => {
                if (type === 'display') 
                    return `<button class="button is-link is-light is-small is-displaced-top" onclick="addUMLSCodeToList(${meta.row})"><span class="icon"><i class="fa-solid fa-plus"></i></span>`
                else
                    return '';
            }
        }
    ]
}

dataTables["UMLS_SEARCH"] = umlsSearchDatatable;
export default dataTables;