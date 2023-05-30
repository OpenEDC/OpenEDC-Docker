// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Cors {
    constructor(props){
        this.props = props;
        this.configureHeaders = ()=>{
            const { props: { corsOptions , requestMethod , setResponseHeader , setStatus , next , end ,  } , configureOrigin ,  } = this;
            if (typeof requestMethod === "string" && requestMethod.toUpperCase() === "OPTIONS") {
                configureOrigin().configureCredentials().configureMethods().configureAllowedHeaders().configureMaxAge().configureExposedHeaders();
                if (corsOptions.preflightContinue) return next();
                else {
                    setStatus(corsOptions.optionsSuccessStatus);
                    setResponseHeader("Content-Length", "0");
                    return end();
                }
            } else {
                configureOrigin().configureCredentials().configureExposedHeaders();
                return next();
            }
        };
        this.configureOrigin = ()=>{
            const { props: { corsOptions , getRequestHeader , setResponseHeader  } , setVaryHeader ,  } = this;
            if (!corsOptions.origin || corsOptions.origin === "*") {
                setResponseHeader("Access-Control-Allow-Origin", "*");
            } else if (typeof corsOptions.origin === "string") {
                setResponseHeader("Access-Control-Allow-Origin", corsOptions.origin);
                setVaryHeader("Origin");
            } else {
                const requestOrigin = getRequestHeader("origin") ?? getRequestHeader("Origin");
                setResponseHeader("Access-Control-Allow-Origin", Cors.isOriginAllowed(requestOrigin, corsOptions.origin) ? requestOrigin : "false");
                setVaryHeader("Origin");
            }
            return this;
        };
        this.configureCredentials = ()=>{
            const { corsOptions , setResponseHeader  } = this.props;
            if (corsOptions.credentials === true) {
                setResponseHeader("Access-Control-Allow-Credentials", "true");
            }
            return this;
        };
        this.configureMethods = ()=>{
            const { corsOptions , setResponseHeader  } = this.props;
            let methods = corsOptions.methods;
            setResponseHeader("Access-Control-Allow-Methods", Array.isArray(methods) ? methods.join(",") : methods);
            return this;
        };
        this.configureAllowedHeaders = ()=>{
            const { props: { corsOptions , getRequestHeader , setResponseHeader  } , setVaryHeader ,  } = this;
            let allowedHeaders = corsOptions.allowedHeaders;
            if (!allowedHeaders) {
                allowedHeaders = (getRequestHeader("access-control-request-headers") ?? getRequestHeader("Access-Control-Request-Headers")) ?? undefined;
                setVaryHeader("Access-Control-request-Headers");
            }
            if (allowedHeaders?.length) {
                setResponseHeader("Access-Control-Allow-Headers", Array.isArray(allowedHeaders) ? allowedHeaders.join(",") : allowedHeaders);
            }
            return this;
        };
        this.configureMaxAge = ()=>{
            const { corsOptions , setResponseHeader  } = this.props;
            const maxAge = (typeof corsOptions.maxAge === "number" || typeof corsOptions.maxAge === "string") && corsOptions.maxAge.toString();
            if (maxAge && maxAge.length) {
                setResponseHeader("Access-Control-Max-Age", maxAge);
            }
            return this;
        };
        this.configureExposedHeaders = ()=>{
            const { corsOptions , setResponseHeader  } = this.props;
            let exposedHeaders = corsOptions.exposedHeaders;
            if (exposedHeaders?.length) {
                setResponseHeader("Access-Control-Expose-Headers", Array.isArray(exposedHeaders) ? exposedHeaders.join(",") : exposedHeaders);
            }
            return this;
        };
        this.setVaryHeader = (field)=>{
            const { props: { getResponseHeader , setResponseHeader  } , appendVaryHeader ,  } = this;
            let existingHeader = getResponseHeader("Vary") ?? "";
            if (existingHeader && typeof existingHeader === "string" && (existingHeader = appendVaryHeader(existingHeader, field))) {
                setResponseHeader("Vary", existingHeader);
            }
        };
        this.appendVaryHeader = (header, field)=>{
            const { parseVaryHeader  } = this;
            if (header === "*") return header;
            let varyHeader = header;
            const fields = parseVaryHeader(field);
            const headers = parseVaryHeader(header.toLocaleLowerCase());
            if (fields.includes("*") || headers.includes("*")) return "*";
            fields.forEach((field)=>{
                const fld = field.toLowerCase();
                if (headers.includes(fld)) {
                    headers.push(fld);
                    varyHeader = varyHeader ? `${varyHeader}, ${field}` : field;
                }
            });
            return varyHeader;
        };
        this.parseVaryHeader = (header)=>{
            let end = 0;
            const list = [];
            let start = 0;
            for(let i = 0, len = header.length; i < len; i++){
                switch(header.charCodeAt(i)){
                    case 0x20:
                        if (start === end) start = end = i + 1;
                        break;
                    case 0x2c:
                        list.push(header.substring(start, end));
                        start = end = i + 1;
                        break;
                    default:
                        end = i + 1;
                        break;
                }
            }
            list.push(header.substring(start, end));
            return list;
        };
    }
    static produceCorsOptions = (corsOptions = {}, defaultCorsOptions = {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204
    })=>({
            ...defaultCorsOptions,
            ...corsOptions
        });
    static produceCorsOptionsDelegate = (o)=>typeof o === "function" ? o : (_request)=>o;
    static produceOriginDelegate = (corsOptions)=>{
        if (corsOptions.origin) {
            if (typeof corsOptions.origin === "function") {
                return corsOptions.origin;
            }
            return (_requestOrigin)=>corsOptions.origin;
        }
    };
    static isOriginAllowed = (requestOrigin, allowedOrigin)=>{
        if (Array.isArray(allowedOrigin)) {
            return allowedOrigin.some((ao)=>Cors.isOriginAllowed(requestOrigin, ao));
        } else if (typeof allowedOrigin === "string") {
            return requestOrigin === allowedOrigin;
        } else if (allowedOrigin instanceof RegExp && typeof requestOrigin === "string") {
            return allowedOrigin.test(requestOrigin);
        } else return !!allowedOrigin;
    };
    configureHeaders;
    configureOrigin;
    configureCredentials;
    configureMethods;
    configureAllowedHeaders;
    configureMaxAge;
    configureExposedHeaders;
    setVaryHeader;
    appendVaryHeader;
    parseVaryHeader;
    props;
}
const oakCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async ({ request , response  }, next)=>{
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status = statusCode;
                const end = ()=>{};
                const origin = await originDelegate(getRequestHeader("origin"));
                if (!origin) next();
                else {
                    corsOptions.origin = origin;
                    return new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next,
                        end
                    }).configureHeaders();
                }
            }
        } catch (error) {
            console.error(error);
        }
        next();
    };
};
const abcCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return (abcNext)=>async (context)=>{
            const next = ()=>abcNext(context);
            try {
                const { request , response  } = context;
                const options = await corsOptionsDelegate(request);
                const corsOptions = Cors.produceCorsOptions(options || {});
                const originDelegate = Cors.produceOriginDelegate(corsOptions);
                if (originDelegate) {
                    const requestMethod = request.method;
                    const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                    const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                    const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                    const setStatus = (statusCode)=>response.status = statusCode;
                    const end = ()=>{};
                    const origin = await originDelegate(getRequestHeader("origin"));
                    if (!origin) return next();
                    else {
                        corsOptions.origin = origin;
                        return new Cors({
                            corsOptions,
                            requestMethod,
                            getRequestHeader,
                            getResponseHeader,
                            setResponseHeader,
                            setStatus,
                            next,
                            end
                        }).configureHeaders();
                    }
                }
            } catch (error) {
                console.error(error);
            }
            return next();
        };
};
const opineCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async (request, response, next)=>{
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.setStatus(statusCode);
                const end = ()=>response.end();
                const origin = await originDelegate(getRequestHeader("origin"));
                if (!origin) return next();
                else {
                    corsOptions.origin = origin;
                    return new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next,
                        end
                    }).configureHeaders();
                }
            }
        } catch (error) {
            console.error(error);
        }
        return next();
    };
};
const mithCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async (request, response, next)=>{
        const serverRequest = request.serverRequest;
        try {
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = serverRequest.method;
                const getRequestHeader = (headerKey)=>serverRequest.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status = statusCode;
                const end = ()=>{};
                const origin = await originDelegate(getRequestHeader("origin"));
                if (!origin) return next();
                else {
                    corsOptions.origin = origin;
                    return new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next,
                        end
                    }).configureHeaders();
                }
            }
        } catch (error) {
            console.error(error);
        }
        return next();
    };
};
const attainCors = (o)=>{
    const corsOptionsDelegate = Cors.produceCorsOptionsDelegate(o);
    return async function cors(request, response) {
        try {
            const fakeNext = ()=>undefined;
            const options = await corsOptionsDelegate(request);
            const corsOptions = Cors.produceCorsOptions(options || {});
            const originDelegate = Cors.produceOriginDelegate(corsOptions);
            if (originDelegate) {
                const requestMethod = request.method;
                const getRequestHeader = (headerKey)=>request.headers.get(headerKey);
                const getResponseHeader = (headerKey)=>response.headers.get(headerKey);
                const setResponseHeader = (headerKey, headerValue)=>response.headers.set(headerKey, headerValue);
                const setStatus = (statusCode)=>response.status(statusCode);
                const end = response.end();
                const origin = await originDelegate(getRequestHeader("origin"));
                if (origin) {
                    corsOptions.origin = origin;
                    new Cors({
                        corsOptions,
                        requestMethod,
                        getRequestHeader,
                        getResponseHeader,
                        setResponseHeader,
                        setStatus,
                        next: fakeNext,
                        end
                    }).configureHeaders();
                }
            }
            if (request.method === "OPTIONS") {
                response.send("");
            }
        } catch (error) {
            console.error(error);
        }
    };
};
export { oakCors as oakCors };
export { abcCors as abcCors };
export { opineCors as opineCors };
export { mithCors as mithCors };
export { attainCors as attainCors };
