import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as clinicaldataController from "../clinicaldatacontroller.js"

export const clinicaldataRouter = new Router();
clinicaldataRouter
.get("/", (ctx) => authorizationMiddleware(ctx, clinicaldataController.getSubjects, [], false))
.get("/:fileName", (ctx) => authorizationMiddleware(ctx, clinicaldataController.getClinicaldata, [], false))
.get("/raw/:fileName", (ctx) => authorizationMiddleware(ctx, clinicaldataController.getClinicalDataRaw, [], true))
.put("/:fileName", (ctx) => authorizationMiddleware(ctx, clinicaldataController.setClinicaldata, [userRights.ADDSUBJECTDATA], false))
.delete("/:fileName", (ctx) => authorizationMiddleware(ctx, clinicaldataController.deleteClinicaldata, [userRights.ADDSUBJECTDATA], false))