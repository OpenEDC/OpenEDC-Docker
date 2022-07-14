import * as storageHelper from "./helper/storagehelper.js";
import { User } from "../models/usermodel.js";
import { rights } from "./helper/authorizationhelper.js";

export let users = [];

export const init = () => {
    try {
        const usersJSON = storageHelper.loadJSON(storageHelper.directories.ROOT, "users");
        for (const userJSON of usersJSON) {
            users.push(new User(
                userJSON.oid,
                userJSON.username,
                userJSON.authenticationKey,
                userJSON.hasInitialPassword,
                userJSON.encryptedDecryptionKey,
                userJSON.rights,
                userJSON.site
            ));
        }
    } catch {}
}

export const getUsers = context => {
    return context.json(users);
};

export const getUser = context => {
    const oid = context.params.oid;

    const user = users.find(user => user.oid == oid);
    if (!user) return context.string("User could not be found.", 404);

    return context.json(user, 200);
};

export const getRights = context => {
    return context.json(rights, 200);
};

export const getMe = (context, user) => {
    return context.json(user, 200);
}

export const setMe = async (context, user) => {
    const { username, authenticationKey, encryptedDecryptionKey } = await context.body;

    if (!username) return context.string("Username is missing in the request body.", 400);
    if (!authenticationKey) return context.string("Password is missing in the request body.", 400);
    if (!encryptedDecryptionKey) return context.string("An encrypted decryption key is missing in the request body.", 400);

    user.username = username;
    user.authenticationKey = authenticationKey;
    user.hasInitialPassword = false;
    user.encryptedDecryptionKey = encryptedDecryptionKey;
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);
    
    return context.json(user, 201);
}

export const initializeUser = async context => {
    if (users.length > 0) return context.string("The server has already been initialized.", 400);

    const oid = context.params.oid;
    const { username, authenticationKey, encryptedDecryptionKey } = await context.body;
    
    if (!username) return context.string("Username is missing in the request body.", 400);
    if (!authenticationKey) return context.string("Password is missing in the request body.", 400);
    if (!encryptedDecryptionKey) return context.string("An encrypted decryption key is missing in the request body.", 400);

    const user = new User(oid, username, authenticationKey, false, encryptedDecryptionKey, Object.values(rights));
    users.push(user);
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    return context.json(user, 201);
};

export const setUser = async context => {
    const oid = context.params.oid;
    const { username, authenticationKey, encryptedDecryptionKey, rights, site } = await context.body;
    
    // This function may be used to set the login credentials, rights, or site of a user -- however, not all information must be present together
    let user = users.find(user => user.oid == oid);
    if (user) {
        if (username && authenticationKey && encryptedDecryptionKey) {
            user.username = username;
            user.authenticationKey = authenticationKey;
            user.hasInitialPassword = true;
            user.encryptedDecryptionKey = encryptedDecryptionKey;
        }
        user.rights = rights;
        user.site = site;
    } else {
        // Test if the username is already occupied
        const existingUser = users.find(user => user.username == username);
        if (username && existingUser && existingUser.oid != oid) return context.string("There exists another user with the same username.", 400);

        user = new User(oid, username, authenticationKey, true, encryptedDecryptionKey, rights, site);
        users.push(user);
    }

    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    return context.json(user, 201);
};

export const deleteUser = context => {
    const oid = context.params.oid;

    const user = users.find(user => user.oid == oid);
    if (!user) return context.string("User could not be found.", 404);

    users = users.filter(user => user.oid != oid);
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    return context.json(user, 200);
};
