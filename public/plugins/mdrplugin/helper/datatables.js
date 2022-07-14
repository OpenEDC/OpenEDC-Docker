import ODMPath from "../../../js/odmwrapper/odmpath.js"
import * as languageHelper from "../../../js/helper/languagehelper.js"

let dataTables = {}
let itemgroupDataTable = {
    "paging": false,
    "searching": false,
    "autoWidth": false,
    "bInfo" : false,
    "order": [[ 0, "desc" ]],
    "data": [],
    "createdRow": function( row, data, dataIndex){
        if( data.lang.indexOf(languageHelper.getCurrentLocale()) >= 0) {
            jq(row).addClass('highlight');
        }
        else {
            jq(row).removeClass('highlight');
        }
    },
    "columns": [
        {"data": "freq"},
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
                if (type === 'display' && data.length > 1) {
                    return `<span><abbr title="${data.join(', ')}">${data[0]}</abbr></span>`;
                }
                else if(data.length === 1) {
                    return `<span>${data[0]}</span>`;
                }
                else {
                    return `<span/>`;
                }
            } 
        },
        {
            "data": "items",
            render: (data, type, full, meta) => {
                if (type === 'display' && data.length > 1) {
                    return `<span class="break" onclick="showItemDetails(event, ${meta.row})"><abbr title="${data.join(', ')}">${data[0]}</abbr></span>`;
                }
                else if(data.length === 1) {
                    return `<span class="break">${data[0]}</span>`;
                }
                else {
                    return `<span/>`;
                }
            }
            
        },
        {
            "data": "desc",
            render: (data, type) => {
                if (type === 'display' && data && data.length > 0) {
                    return `<span><abbr title="${data}">show</abbr></span>`;
                }
                else {
                    return `<span></span>`;
                }
            }
            
        },
        {
            "data": "lang",
            render: (data, type) => {
                if (type === 'display' && data) {
                    if(data.length > 1)
                        return `<span><abbr title="${data.join(", ")}">${data[0]}</abbr></span>`;
                    else
                        return `<span>${data[0]}</span>`
                }
                else {
                    return `<span></span>`;
                }
            }
            
        },
        {
            "data": "item",
            render: (data, type, full, meta) => {
                if (type === 'display') 
                    return `<div class="has-text-link" onclick="showAddItemgroupFromMDRMessage(${meta.row})"><button class="button is-rounded is-link is-inverted is-transparent is-small"><span class="icon mdrspan"><i class="fa-solid fa-plus hover-icon"></i></span></button></div>`
                else
                    return '';
            }
        }
    ]
}

let itemDataTable = {
    "paging": false,
    "searching": false,
    "autoWidth": false,
    "bInfo" : false,
    "order": [[ 0, "desc" ]],
    "data": [],
    "columns": [
        {"data": "freq"},
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
                if (type === 'display' && data.length > 1) {
                    return `<span><abbr title="${data.join(', ')}">${data[0]}</abbr></span>`;
                }
                else if(data.length === 1) {
                    return `<span>${data[0]}</span>`;
                }
                else {
                    return `<span/>`;
                }
            }
            
        },
        {
            "data": "unit",
            render: (data, type) => {
                if (type === 'display' && data.length > 0) 
                    return data.map(m => m.definition.name).join(', ');
                else
                    return '';
            }
        },
        {"data": "datatype"},
        {
            "data": "question",
            render: (data, type) => {
                if (type === 'display' && data && data.length > 0) {
                    return `<span><abbr title="${data}">show</abbr></span>`;
                }
                else {
                    return `<span></span>`;
                }
            }
            
        },
        {
            "data": "codelistitems",
            render: (data, type) => {
                if (type === 'display' && data.length > 1) {
                    return `<span><abbr title="${data.map(d => d.text).join(', ')}">${data[0].text}</abbr></span>`;
                }
                else if(data.length === 1) {
                    return `<span>${data[0]}</span>`;
                }
                else {
                    return `<span/>`;
                }
            }
        },
        {
            "data": "lang",
            render: (data, type) => {
                if (type === 'display' && data) {
                    if(data.length > 1)
                        return `<span><abbr title="${data.join(", ")}">${data[0]}</abbr></span>`;
                    else
                        return `<span>${data[0]}</span>`
                }
                else {
                    return `<span></span>`;
                }
            }
            
        },
        {
            "data": "item",
            render: (data, type, full, meta) => {
                if (type === 'display') 
                    return `<div class="has-text-link" onclick="showAddItemFromMDRMessage(${meta.row})"><button class="button is-rounded is-link is-inverted is-transparent is-small"><span class="icon mdrspan"><i class="fa-solid fa-plus hover-icon"></i></span></button></div>`
                else
                    return '';
            }
        }
    ]
}

let itemPopupDataTable = {
    "paging": false,
    "pagingType": "simple",
    "searching": false,
    "autoWidth": false,
    "bInfo" : false,
    "scrollY": "400px",
    "scrollCollapse": true,
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
                if (type === 'display' && data && data.length > 0) {
                    return `<span>${data.join('<br>')}</span>`;
                }
                else {
                    return `<span/>`;
                }
            }
            
        },
        {
            "data": "codelistitems",
            render: (data, type) => {
                if (type === 'display' && data && data.length > 0) {
                    return `<span>${data.map(d => d.text).join('<br>')}</span>`;
                }
                else {
                    return `<span/>`;
                }
            }
        }
    ]
}

dataTables[ODMPath.elements.ITEMGROUP] = itemgroupDataTable;
dataTables[ODMPath.elements.ITEM] = itemDataTable;
dataTables.ITEM_POPUP = itemPopupDataTable;

export default dataTables;