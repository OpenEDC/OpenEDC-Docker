import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as metadataController from "../metadatacontroller.js"

export const metadataRouter = new Router();
metadataRouter
.get("/:fileName", (ctx) => authorizationMiddleware(ctx, metadataController.getMetadata, [], false))
.get("/raw/:fileName", (ctx) => authorizationMiddleware(ctx, metadataController.getMetadataRaw, [], true))
.put("/:fileName", (ctx) => authorizationMiddleware(ctx, metadataController.setMetadata, [userRights.EDITMETADATA], false))
.delete("/:fileName", (ctx) => authorizationMiddleware(ctx, metadataController.deleteMetadata, [userRights.EDITMETADATA], false))