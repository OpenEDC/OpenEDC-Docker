
const manifest = `{
    "name": "ImiEDC",
    "short_name": "ImiEDC",
    "scope": ".<url>",
    "start_url": ".<url>",
    "display": "standalone",
    "background_color": "#FFFFFF",
    "theme_color": "#FFFFFF",
    "icons": [
        {
            "src": "<url2>img/android-chrome-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "<url2>img/android-chrome-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}`

export const getManifest = async (context, user) => {
    const params = await context.queryParams;

    let man = manifest.replace(/\<url\>/g, params.path);
    man = man.replace(/\<url2\>/g, params.path == "/" ? "" : params.path + "/");
    return JSON.stringify(JSON.parse(man), null, 2);
}