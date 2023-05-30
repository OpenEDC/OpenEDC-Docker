import { storeLog } from "./helper/storagehelper.js"

export const LogEvent = {
    USERDATA: 'userlogs',
    METADATA: 'metadata',
    CLINICALDATA: 'clinicaldata',
    ADMINDATA: 'admindata',
    JSON_AND_SETTINGS: 'jsonandsettings',
    DELETE: 'delete',
    EDIT: "edit",
    CREATE: 'create',
    CRIICAL: 'critical'
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Octr", "Nov", "Dec"
];

export const log = async (logEvents, text, createNew) => {
    logEvents.forEach(element => {
        storeLog(element, appendTimestamp(text), createNew);
    });  
};

const appendTimestamp = (text) => {
    const date = new Date();
    return `${date.getDate()}/${monthNames[date.getMonth()]}/${date.getFullYear()}@${date.toLocaleTimeString()}: ${text}`;
}