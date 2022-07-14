import { Application } from "./application.mod.js";
import { cors } from "./cors.js";

import Endpoint from "./models/endpoint.js";
import { rights as userRights } from "./controller/helper/authorizationhelper.js";
import * as storageHelper from "./controller/helper/storagehelper.js";
import * as statusController from "./controller/statuscontroller.js";
import * as usersController from "./controller/userscontroller.js";
import * as metadataController from "./controller/metadatacontroller.js";
import * as admindataController from "./controller/admindatacontroller.js";
import * as clinicaldataController from "./controller/clinicaldatacontroller.js";
import * as jsonController from "./controller/jsoncontroller.js";
import * as manifestController from "./controller/manifestcontroller.js"

const server = new Application();
const port = parseInt(Deno.args[0]);

// Enable CORS
const corsConfig = {
    allowOrigins: ["*"],
    allowMethods: ["GET", "PUT", "DELETE"],
    allowHeaders: ["Authorization", "Content-Type"]
};
server.use(cors(corsConfig));

// Serve static files
server.static("/", "./public");

// Define default request route endpoints
const routes = [
    new Endpoint(Endpoint.methods.GET, "/", context => context.file("./public/index.html"), false, false),
    new Endpoint(Endpoint.methods.GET, "/api/status", statusController.getStatus, false),
    new Endpoint(Endpoint.methods.GET, "/api/lastupdate", statusController.getLastUpdate),
    new Endpoint(Endpoint.methods.GET, "/api/users", usersController.getUsers, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/users/:oid", usersController.getUser, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/users/rights", usersController.getRights),
    new Endpoint(Endpoint.methods.GET, "/api/users/me", usersController.getMe),
    new Endpoint(Endpoint.methods.PUT, "/api/users/me", usersController.setMe),
    new Endpoint(Endpoint.methods.PUT, "/api/users/initialize/:oid", usersController.initializeUser, false),
    new Endpoint(Endpoint.methods.PUT, "/api/users/:oid", usersController.setUser, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/users/:oid", usersController.deleteUser, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/metadata/:fileName", metadataController.getMetadata),
    new Endpoint(Endpoint.methods.PUT, "/api/metadata/:fileName", metadataController.setMetadata, userRights.EDITMETADATA),
    new Endpoint(Endpoint.methods.DELETE, "/api/metadata/:fileName", metadataController.deleteMetadata, userRights.EDITMETADATA),
    new Endpoint(Endpoint.methods.GET, "/api/admindata/:fileName", admindataController.getAdmindata),
    new Endpoint(Endpoint.methods.PUT, "/api/admindata/:fileName", admindataController.setAdmindata, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/admindata/:fileName", admindataController.deleteAdmindata, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/clinicaldata", clinicaldataController.getSubjects),
    new Endpoint(Endpoint.methods.GET, "/api/clinicaldata/:fileName", clinicaldataController.getClinicaldata),
    new Endpoint(Endpoint.methods.PUT, "/api/clinicaldata/:fileName", clinicaldataController.setClinicaldata, userRights.ADDSUBJECTDATA),
    new Endpoint(Endpoint.methods.DELETE, "/api/clinicaldata/:fileName", clinicaldataController.deleteClinicaldata, userRights.ADDSUBJECTDATA),
    new Endpoint(Endpoint.methods.GET, "/api/json/:fileName", jsonController.getJSON),
    new Endpoint(Endpoint.methods.PUT, "/api/json/:fileName", jsonController.setJSON, userRights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/json/:fileName", jsonController.deleteJSON, userRights.PROJECTOPTIONS),
    //new Endpoint(Endpoint.methods.GET, "/manifest.json", manifestController.getManifest, false),
];

// Add request routes defined by plugins
for (const fileName of storageHelper.getFileNamesOfDirectory("./plugins")) {
    if(fileName.split('.').pop() === 'js')
        await import("./plugins/" + fileName).then(plugin => plugin.default().forEach(route => routes.push(route)));
}
console.log(routes);

// Route default and plugin requests
routes.forEach(route => server[route.method](route.path, route.logic, route.middleware));

// Initialize storage
const instance = Deno.args.length > 1 ? Deno.args[1] : null;
storageHelper.init(instance);

// Initialize users
usersController.init();

// Start server
server.start({ port });
console.log("OpenEDC Server started successfully.");
