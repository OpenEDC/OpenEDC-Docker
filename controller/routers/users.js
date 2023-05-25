import { Router } from "../../denodependencies/oakMod.bundle.js"
import { rights as userRights, authorizationMiddleware } from "../../controller/helper/authorizationhelper.js";
import * as usersController from "../userscontroller.js"

export const usersRouter = new Router();
usersRouter
.get("/", (ctx) => authorizationMiddleware(ctx, usersController.getUsers, [userRights.PROJECTOPTIONS], false))
.get("/rights", (ctx) => authorizationMiddleware(ctx, usersController.getRights, [], false))
.get("/me", (ctx) => authorizationMiddleware(ctx, usersController.getMe, [], false))
.get("/authenticationkey", (ctx) => authorizationMiddleware(ctx, usersController.getAuthenticationKey, [], true))
.get("/logout", (ctx) => authorizationMiddleware(ctx, usersController.logout, [], false))
.put("/me", (ctx) => authorizationMiddleware(ctx, usersController.setMe, [], false))
.put("/initialize/:oid", usersController.initializeUser)
.get("/:oid", (ctx) => authorizationMiddleware(ctx, usersController.getUser, [userRights.PROJECTOPTIONS], false))
.put("/:oid", (ctx) => authorizationMiddleware(ctx, usersController.setUser, [userRights.PROJECTOPTIONS], false))
.delete("/:oid", (ctx) => authorizationMiddleware(ctx, usersController.deleteUser, [userRights.PROJECTOPTIONS], false))
