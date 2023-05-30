import * as storageHelper from "./helper/storagehelper.js";
import { User } from "../models/usermodel.js";
import { rights } from "./helper/authorizationhelper.js";
import * as cryptoHelper from "./helper/cryptohelper.js"
import { parse, stringify  } from "../denodependencies/xmlparser.bundle.js";
import * as admindataController from "./admindatacontroller.js"
import * as loggingController from "./loggingcontroller.js"

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
                userJSON.ownerProtected??false,
                userJSON.site
            ));
        }
    } catch {}
}

export const getUsers = context => {
    context.response.status = 200;
    context.response.body = users;
};

export const getUser = context => {
    const oid = context.params.oid;
    const user = users.find(user => user.oid == oid);
    if (!user) {
        context.response.status = 404;
        context.response.body = "User could not be found.";
        return;
    }
    context.response.status = 200;
    context.response.body = user;
};

export const getRights = context => {
    context.response.status = 200;
    context.response.body = rights;
};

export const getMe = (context, user) => {
    context.state.session.set('username', user.username);
    context.state.session.set('authenticationKey', user.authenticationKey);

    loggingController.log([loggingController.LogEvent.USERDATA], `${user.username}: Login`);
    context.response.status = 200;
    context.response.body = user;
}

export const setMe = async (context, user) => {
    const { username, authenticationKey, encryptedDecryptionKey } = await context.request.body().value;
    checkUserdataPresent(username, authenticationKey, encryptedDecryptionKey,context);

    user.username = username;
    user.authenticationKey = authenticationKey;
    user.hasInitialPassword = false;
    user.encryptedDecryptionKey = encryptedDecryptionKey;
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    loggingController.log([loggingController.LogEvent.EDIT, loggingController.LogEvent.USERDATA], `${user.username}: Changed his profile`);
    context.response.status = 201;
    context.response.body = user;
}

export const logout = async(context, user) => {
    context.state.session.deleteSession()
    context.response.redirect('/');
}

export const initializeUser = async context => {
    if (users.length > 0) {
        context.response.status = 400;
        context.response.body = "The server has already been initialized.";
        return;
    }
    const oid = context.params.oid;
    const { username, authenticationKey, encryptedDecryptionKey, ownerProtected } = await context.request.body().value;
    checkUserdataPresent(username, authenticationKey, encryptedDecryptionKey, context);
    
    const user = new User(oid, username, authenticationKey, false, encryptedDecryptionKey, Object.values(rights), ownerProtected?? false);
    users.push(user);
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    loggingController.log([loggingController.LogEvent.CREATE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.USERDATA], `${user.username}: Initialized server`);
    context.response.status = 201;
    context.response.body = user;
};

export const setUser = async (context, currentUser) => {
    const oid = context.params.oid;
    const { username, authenticationKey, encryptedDecryptionKey, rights, site, ownerProtected } = await context.request.body().value;;
    
    // This function may be used to set the login credentials, rights, or site of a user -- however, not all information must be present together
    let user = users.find(user => user.oid == oid);
    if(user && user.ownerProtected && currentUser.oid != user.oid) {
        context.response.status = 400;
        context.response.body = "User is protected and cannot be changed.";
        return;
    }
    if (user) {
        if (username && authenticationKey && encryptedDecryptionKey) {
            user.username = username;
            user.authenticationKey = authenticationKey;
            user.hasInitialPassword = true;
            user.encryptedDecryptionKey = encryptedDecryptionKey;
        }
        user.rights = rights;
        user.site = site;
        if(currentUser.oid == user.oid) user.ownerProtected = ownerProtected;
    } else {
        // Test if the username is already occupied
        const existingUser = users.find(user => user.username == username);
        if (username && existingUser && existingUser.oid != oid) {
            context.response.status = 400;
            context.response.body = "There exists another user with the same username.";
            return;
        }

        user = new User(oid, username, authenticationKey, true, encryptedDecryptionKey, rights, false, site);
        users.push(user);
    }

    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    loggingController.log([loggingController.LogEvent.CREATE, loggingController.LogEvent.USERDATA], `${currentUser.username}: Changed user ${user.username}`);
    context.response.status = 201;
    context.response.body = user;
};

export const deleteUser = (context, loggedInUser) => {
    const oid = context.params.oid;

    const user = users.find(user => user.oid == oid);
    if (!user) {
        context.response.status = 404;
        context.response.body = "User could not be found.";
        return;
    } 

    users = users.filter(user => user.oid != oid);
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);

    loggingController.log([loggingController.LogEvent.DELETE, loggingController.LogEvent.CRIICAL, loggingController.LogEvent.USERDATA], `${loggedInUser.username}: Deleted ${user.username} (OID: ${user.oid})`);
    context.response.status = 200;
    context.response.body = user;
};

export const getAuthenticationKey = async context => {
    const queryParams = await context.request.url.searchParams;
    if(!queryParams.get('username') || !queryParams.get('password')) {
        context.response.status = 400;
        context.response.body = "Parameter missing";
    }
    const key = await cryptoHelper.PBKDF2.generateAuthenticationKey(params.username.toLowerCase(), params.password);
    context.response.status = 200;
    context.response.body =  window.btoa(`${params.username.toLowerCase()}:${key}`);
}

const checkUserdataPresent = (username, authenticationKey, encryptedDecryptionKey, context) => {
    if (!username) {
        noUsernamePresent(context);
        return;
    }
    if (!authenticationKey) {
        noAuthenticationKeyPresent(context);
        return;
    }
    if (!encryptedDecryptionKey) {
        noDecryptionKeyPresent(context);
        return;
    }
}

const noUsernamePresent = context => {
    context.response.status = 400;
    context.response.body = "Username is missing in the request body."
}

const noAuthenticationKeyPresent= context => {
    context.response.status = 400;
    context.response.body = "Password is missing in the request body."
}

const noDecryptionKeyPresent = context => {
    context.response.status = 400;
    context.response.body = "An encrypted decryption key is missing in the request body."
}

export const getTempUser = (username, authenticationKey) => {
    addUser();
    return new User(-1, username, authenticationKey, false, null, [rights.ADDSUBJECTDATA, rights.MANAGESUBJECTS, rights.VALIDATEFORMS, rights.PROJECTOPTIONS, rights.EDITMETADATA], false);
}

 export function addUser(username, authenticationKey) {
    console.log("Add user");
    const oldFileName = storageHelper.getFileNamesOfDirectory(storageHelper.directories.ADMINDATA).at(-1);
    let adminData = storageHelper.loadXML(storageHelper.directories.ADMINDATA, oldFileName);
    adminData = parse(adminData);
    const newUserOID = generateUniqueOID("U.", adminData);
    const newUser = {"@OID": newUserOID, "FirstName": username, "LastName": username };
    if(Array.isArray(adminData.AdminData.User)) {
        adminData.AdminData.User.push(newUser);
    }
    else {
        adminData.AdminData.User = [adminData.AdminData.User]
        adminData.AdminData.User.push(newUser);
    }
    admindataController.setAdminDataServer(stringify(adminData), oldFileName);
    let user = new User(newUserOID, username, authenticationKey, false, null, [rights.ADDSUBJECTDATA, rights.MANAGESUBJECTS, rights.VALIDATEFORMS], false);
    users.push(user);
    storageHelper.storeJSON(storageHelper.directories.ROOT, "users", users);
    return user;
}

function generateUniqueOID(oidPrefix, adminData) {
    let count = 1;
    let oid = oidPrefix + count;
    
    if(Array.isArray(adminData.AdminData.User)) {
        console.log("before loop")
        while (adminData.AdminData.User.find(user => user["@OID"] == oid)) {
            count += 1;
            oid = oidPrefix + count;
        }
        console.log("after loop")
    }
    else {
        if(oid == adminData.AdminData.User["@OID"]) oid = oidPrefix + 2;
    }
    
    return oid;
}
