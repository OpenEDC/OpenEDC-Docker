import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as statusController from "../statuscontroller.js"

export const projectRouter = new Router();
projectRouter
.delete("/delete", (ctx) => authorizationMiddleware(ctx, statusController.initiateProjectDeletion, [userRights.PROJECTOPTIONS], false))
.delete("/clinicaldata/delete", (ctx) => authorizationMiddleware(ctx, statusController.initiateClinicalDataDeletion, [userRights.PROJECTOPTIONS], false))