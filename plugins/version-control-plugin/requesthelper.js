import * as storageHelper from "../../controller/helper/storagehelper.js";

const constFileName = 'metadata_current'

export async function getVersions() {
    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "log", "--graph"], stdout: "piped" }
    );
    await p1.status();
    let output = await p1.output();
    let json = JSON.parse(JSON.stringify(new TextDecoder().decode(output).split(/\r?\n/).filter(function(e) { return e; })));
    let logArray = [];
    json.forEach((v, i) => {
        if(i%6 == 0) logArray[i/6] = {};
        let index = Math.floor(i/6)
        switch(i%6) {
            case 0: 
                let [, hash] = v.match(/^[|*\s\\]+commit\s+([a-f0-9]+)/);
                logArray[index].hash = hash;
                break;
            case 1:
                let [, author] = v.match(/^[|*\s\\]+Author:\s+([a-zA-ZäöüßÄÖÜ0-9\s]+)\s\<[a-zA-ZäöüßÄÖÜ0-9\-\@\.]*\>/);
                logArray[index].author = author;
                break;
            case 2:
                let [, date] = v.match(/^[|*\s\\]+Date:\s+([a-zA-ZäöüßÄÖÜ\s\d:\+]+)\s*/);
                logArray[index].date = date;
                break;
            case 3:
                break;
            case 4:
                //let [, comment] = v.match(/^[|*\s\\]*\s+([a-zA-ZäöüßÄÖÜ\s\d\/\$&\+,:;=?\@#\|'\\<\>\.\^\*\(\)%!-]+)\s*/);
                logArray[index].comment = v.substring(1).trim();
                break;
            case 5: break;
            default:
                break;
        }  
        
    });
    return logArray;
}

export async function saveVersion(context, comment) {

    const authentication = context.request.headers.get("Authorization");
    let username;
    if (!authentication || !authentication.split(" ")[0] == "Basic") username = 'anonymous'
    else {
        const basicAuthParts = atob(authentication.split(" ")[1]).split(":");
        username = basicAuthParts[0];
    }

    copyCurrentMetadataToGitFile();

    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "commit", `--author="${username}<>"`, "-a", "-m", `${comment}`], stdout: "piped" }
    );
    await p1.status();
    let output = await p1.output();
    if(new TextDecoder().decode(output).includes('nothing added to commit')) return context.json(JSON.stringify("unchanged"), 200);
    return context.json(JSON.stringify("ok"), 200);
}

export async function initGit(context,comment) {

    try {
        if(storageHelper.getFileNamesOfDirectory(storageHelper.directories.METADATA + "/.git").length > 0) {
            return context.json(JSON.stringify("Git has already been initialized"), 200);
        }
    }
    catch(e){
        
        const p1 = Deno.run(
            { cwd: storageHelper.directories.METADATA, cmd: ["git", "init"], stdout: "piped" }
        );
        await p1.status();

        const p2 = Deno.run(
            { cwd: storageHelper.directories.METADATA, cmd: ["touch", constFileName], stdout: "piped" }
        );
        await p2.status();

        const p3 = Deno.run(
            { cwd: storageHelper.directories.METADATA, cmd: ["git", "add", constFileName], stdout: "piped" }
        );
        await p3.status();

        copyCurrentMetadataToGitFile();

        const p4 = Deno.run(
            { cwd: storageHelper.directories.METADATA, cmd: ["git", "commit", "-a", "-m", comment], stdout: "piped" }
        );
        await p4.status();

        return context.json(JSON.stringify("initialized"), 200);
    }
}

export async function resetToHash(context, hash) {
    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "reset", "--hard", hash], stdout: "piped" }
    );
    await p1.status();
    let output = await p1.output();
    if(new TextDecoder().decode(output).includes('HEAD is now at')) {
        const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, constFileName);
        storageHelper.storeXML(storageHelper.directories.METADATA, getLastMetadataName(), metadata);
        return context.json(JSON.stringify("resetted"), 200);
    }
    throw new Error('Reset failed');
}

export async function checkGitStatus(context) {
    try {
        if(storageHelper.getFileNamesOfDirectory(storageHelper.directories.METADATA + "/.git").length > 0) {
            return context.json(JSON.stringify(true), 200);
        }
    }
    catch(e){
        return context.json(JSON.stringify(false), 200);
    }
}

export async function getPreviousVersion(context, hash) {
    const p1 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "rev-parse", "HEAD"], stdout: "piped" }
    );
    await p1.status();
    let output = await p1.output();
    const oldHash = new TextDecoder().decode(output).trim().replace(/^\s+|\s+$/g, '');

    const p2 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "checkout", hash], stdout: "piped" }
    );
    await p2.status();

    const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, constFileName);

    const p3 = Deno.run(
        { cwd: storageHelper.directories.METADATA, cmd: ["git", "checkout", oldHash], stdout: "piped" }
    );
    await p3.status();
    return context.string(metadata, 200);
}

function getLastMetadataName() {
    const fileNames = [];
    for (const file of Deno.readDirSync(storageHelper.directories.METADATA)) {
        fileNames.push(file.name);
    }
    let lastMetadataName = fileNames.reduce((lastUpdated, fileName) => {
        const modifiedDate = storageHelper.getMetadataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    return `metadata__${lastMetadataName}`;
}

function copyCurrentMetadataToGitFile() {
    let lastMetadataName = getLastMetadataName();

    const metadata = storageHelper.loadXML(storageHelper.directories.METADATA, lastMetadataName);
    storageHelper.storeXML(storageHelper.directories.METADATA, constFileName, metadata);
}