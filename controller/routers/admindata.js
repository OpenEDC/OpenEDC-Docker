import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as admindataController from "../admindatacontroller.js"

export const admindataRouter = new Router();
admindataRouter
.get("/:fileName", (ctx) => authorizationMiddleware(ctx, admindataController.getAdmindata, [], false))
.put("/:fileName", (ctx) => authorizationMiddleware(ctx, admindataController.setAdmindata, [userRights.PROJECTOPTIONS], false))
.delete("/:fileName", (ctx) => authorizationMiddleware(ctx, admindataController.deleteAdmindata, [userRights.PROJECTOPTIONS], false))