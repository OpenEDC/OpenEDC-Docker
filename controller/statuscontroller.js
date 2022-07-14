import { Status } from "../models/statusmodel.js";
import { Update } from "../models/updatemodel.js";
import { users } from "./userscontroller.js";

const serverVersion = "0.3.0";

export const lastUpdate = new Update();

export const getStatus = context => {
    const isInitialized = users.length > 0;
    const status = new Status(serverVersion, isInitialized);
    
    return context.json(status, 200);
};

export const getLastUpdate = context => {
    return context.json(lastUpdate, 200);
}
