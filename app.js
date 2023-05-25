import * as storageHelper from "./controller/helper/storagehelper.js";
import * as usersController from "./controller/userscontroller.js";
import { Application, Router } from "./denodependencies/oakMod.bundle.js"
import { oakCors } from "./denodependencies/corsMod.bundle.js"
import { Session, CookieStore } from "./denodependencies/oakSessionsMod.bundle.js"
import { apiRouter } from "./controller/routers/api.js";
import * as configHelper from "./controller/helper/configHelper.js"

// Initialize storage
const instance = Deno.args.length > 1 ? Deno.args[1] : null;
storageHelper.init(instance);
configHelper.init();

const server = new Application();
const store = new CookieStore(configHelper.get("sessionSecret"))
const port = parseInt(Deno.args[0]);

// Enable CORS
const corsOptions = {
    origin: true,
    methods: "GET, PUT, DELETE",
    allowedHeaders: ["Authorization", "Content-Type"]
  };

server.use(Session.initMiddleware(store));

const router = new Router();


router.get("/", (ctx) => {
    const text = Deno.readTextFileSync('./public/index.html');
    ctx.response.headers.set("Content-Type", "text/html")
    ctx.response.body = text;
})
router.use("/api", apiRouter.routes())
// Add request routes defined by plugins
 for (const fileName of storageHelper.getFileNamesOfDirectory("./plugins")) {
    if(fileName.split('.').pop() === 'js')
        await import("./plugins/" + fileName).then(plugin => server.use(plugin.default().routes()));
} 
server.use(oakCors(corsOptions)); 
server.use(router.routes());
server.use(router.allowedMethods());

server.use(async (context, next) => {
    const root = `${Deno.cwd()}/public`
    try {
        await context.send({ root })
    } catch {
        next()
    }
})
// Route default and plugin requests
//routes.forEach(route => server[route.method](route.path, route.logic, route.middleware));

// Initialize users
usersController.init();

// Start server
server.listen({ port: port });
console.log("OpenEDC Server started successfully.");
