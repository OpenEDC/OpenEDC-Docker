import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as jsonController from "../jsoncontroller.js"

export const jsonRouter = new Router();
jsonRouter
.get("/:fileName", (ctx) => authorizationMiddleware(ctx, jsonController.getJSON, [], false))
.put("/:fileName", (ctx) => authorizationMiddleware(ctx, jsonController.setJSON, [userRights.PROJECTOPTIONS], false))
.delete("/:fileName", (ctx) => authorizationMiddleware(ctx, jsonController.deleteJSON, [userRights.PROJECTOPTIONS], false))