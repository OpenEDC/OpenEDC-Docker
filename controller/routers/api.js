import { Router } from "../../denodependencies/oakMod.bundle.js"
import { usersRouter } from "./users.js"
import { clinicaldataRouter } from "./clinicaldata.js"
import { metadataRouter } from "./metadata.js"
import { admindataRouter } from "./admindata.js"
import { jsonRouter } from "./json.js"
import { projectRouter } from "./project.js"
import * as statusController from "../statuscontroller.js"
import * as generalDataController from "../generaldatacontroller.js"
import { rights as userRights, authorizationMiddleware } from "../helper/authorizationhelper.js";

export const apiRouter = new Router();
apiRouter
.get("/status", statusController.getStatus)
.get("/lastupdate", (ctx) => authorizationMiddleware(ctx, statusController.getLastUpdate, [], false))
.get("/export/raw", (ctx) => authorizationMiddleware(ctx, generalDataController.exportODMRaw, [userRights.EXPORTDATA], true))
.use("/users", usersRouter.routes())
.use("/clinicaldata", clinicaldataRouter.routes())
.use("/metadata", metadataRouter.routes())
.use("/admindata", admindataRouter.routes())
.use("/project", projectRouter.routes())
.use("/json", jsonRouter.routes())
