// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const $XML = Symbol("x/xml");
const schema = {
    comment: "#comment",
    text: "#text",
    stylesheets: "$stylesheets",
    attribute: {
        prefix: "@"
    },
    property: {
        prefix: "@"
    }
};
const SeekMode = Object.freeze({
    Current: Deno?.SeekMode?.Current ?? 0,
    Start: Deno?.SeekMode?.Start ?? 1,
    End: Deno?.SeekMode?.End ?? 2
});
const entities = {
    xml: {
        "&lt;": "<",
        "&gt;": ">",
        "&apos;": "'",
        "&quot;": '"',
        "&amp;": "&"
    },
    char: {
        "&": "&amp;",
        '"': "&quot;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&apos;"
    }
};
const tokens = {
    entity: {
        regex: {
            entities: /&#(?<hex>x?)(?<code>\d+);/g
        }
    },
    prolog: {
        start: "<?xml",
        end: "?>"
    },
    stylesheet: {
        start: "<?xml-stylesheet",
        end: "?>"
    },
    doctype: {
        start: "<!DOCTYPE",
        end: ">",
        elements: {
            start: "[",
            end: "]"
        },
        element: {
            start: "<!ELEMENT",
            end: ">",
            value: {
                start: "(",
                end: ")",
                regex: {
                    end: {
                        until: /\)/,
                        bytes: 1
                    }
                }
            }
        }
    },
    comment: {
        start: "<!--",
        end: "-->",
        regex: {
            end: {
                until: /(?<!-)-->/,
                bytes: 4,
                length: 3
            }
        }
    },
    cdata: {
        start: "<![CDATA[",
        end: "]]>",
        regex: {
            end: {
                until: /\]\]>/,
                bytes: 3
            }
        }
    },
    tag: {
        start: "<",
        end: ">",
        close: {
            start: "</",
            end: ">",
            self: "/",
            regex: {
                start: /<\//,
                end: /\/?>/
            }
        },
        attribute: {
            regex: {
                name: {
                    until: /=/,
                    bytes: 1
                }
            }
        },
        regex: {
            name: {
                until: /[\s\/>]/,
                bytes: 1
            },
            start: {
                until: /</,
                bytes: 1
            }
        }
    },
    text: {
        regex: {
            end: {
                until: /(<\/)|(<!)/,
                bytes: 2
            }
        }
    }
};
class Parser {
    constructor(stream, options = {}){
        this.#stream = stream;
        this.#options = options;
        this.#options.reviver ??= function({ value  }) {
            return value;
        };
    }
    parse() {
        return this.#document();
    }
    #options;
    #debug(path, string) {
        if (this.#options.debug) {
            console.debug(`${path.map((node)=>node[$XML].name).join(" > ")} | ${string}`.trim());
        }
    }
    #document() {
        const document = {};
        const path1 = [];
        const comments = [];
        let root = false;
        let clean;
        this.#trim();
        try {
            while(true){
                clean = true;
                if (this.#peek(tokens.comment.start)) {
                    clean = false;
                    comments.push(this.#comment({
                        path: path1
                    }));
                    continue;
                }
                if (this.#peek(tokens.prolog.start) && !this.#peek(tokens.stylesheet.start)) {
                    if (document.xml) {
                        throw Object.assign(new SyntaxError("Multiple prolog declaration found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#prolog({
                        path: path1
                    }));
                    continue;
                }
                if (this.#peek(tokens.stylesheet.start)) {
                    clean = false;
                    const stylesheets = document[schema.stylesheets] ??= [];
                    stylesheets.push(this.#stylesheet({
                        path: path1
                    }).stylesheet);
                    continue;
                }
                if (this.#peek(tokens.doctype.start)) {
                    if (document.doctype) {
                        throw Object.assign(new SyntaxError("Multiple doctype declaration found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#doctype({
                        path: path1
                    }));
                    continue;
                }
                if (this.#peek(tokens.tag.start)) {
                    if (root) {
                        throw Object.assign(new SyntaxError("Multiple root elements found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#node({
                        path: path1
                    }));
                    this.#trim();
                    root = true;
                    continue;
                }
            }
        } catch (error) {
            if (error instanceof Deno.errors.UnexpectedEof && clean) {
                if (comments.length) {
                    document[schema.comment] = comments;
                }
                return document;
            }
            throw error;
        }
    }
    #node({ path: path2  }) {
        if (this.#options.progress) {
            this.#options.progress(this.#stream.cursor);
        }
        if (this.#peek(tokens.comment.start)) {
            return {
                [schema.comment]: this.#comment({
                    path: path2
                })
            };
        }
        return this.#tag({
            path: path2
        });
    }
    #prolog({ path: path3  }) {
        this.#debug(path3, "parsing prolog");
        const prolog = this.#make.node({
            name: "xml",
            path: path3
        });
        this.#consume(tokens.prolog.start);
        while(!this.#peek(tokens.prolog.end)){
            Object.assign(prolog, this.#attribute({
                path: [
                    ...path3,
                    prolog
                ]
            }));
        }
        this.#consume(tokens.prolog.end);
        return {
            xml: prolog
        };
    }
    #stylesheet({ path: path4  }) {
        this.#debug(path4, "parsing stylesheet");
        const stylesheet = this.#make.node({
            name: "xml-stylesheet",
            path: path4
        });
        this.#consume(tokens.stylesheet.start);
        while(!this.#peek(tokens.stylesheet.end)){
            Object.assign(stylesheet, this.#attribute({
                path: [
                    ...path4,
                    stylesheet
                ]
            }));
        }
        this.#consume(tokens.stylesheet.end);
        return {
            stylesheet
        };
    }
    #doctype({ path: path5  }) {
        this.#debug(path5, "parsing doctype");
        const doctype = this.#make.node({
            name: "doctype",
            path: path5
        });
        Object.defineProperty(doctype, $XML, {
            enumerable: false,
            writable: true
        });
        this.#consume(tokens.doctype.start);
        while(!this.#peek(tokens.doctype.end)){
            if (this.#peek(tokens.doctype.elements.start)) {
                this.#consume(tokens.doctype.elements.start);
                while(!this.#peek(tokens.doctype.elements.end)){
                    Object.assign(doctype, this.#doctypeElement({
                        path: path5
                    }));
                }
                this.#consume(tokens.doctype.elements.end);
            } else {
                Object.assign(doctype, this.#property({
                    path: path5
                }));
            }
        }
        this.#stream.consume({
            content: tokens.doctype.end
        });
        return {
            doctype
        };
    }
    #doctypeElement({ path: path6  }) {
        this.#debug(path6, "parsing doctype element");
        this.#consume(tokens.doctype.element.start);
        const element = Object.keys(this.#property({
            path: path6
        })).shift().substring(schema.property.prefix.length);
        this.#debug(path6, `found doctype element "${element}"`);
        this.#consume(tokens.doctype.element.value.start);
        const value = this.#capture(tokens.doctype.element.value.regex.end);
        this.#consume(tokens.doctype.element.value.end);
        this.#debug(path6, `found doctype element value "${value}"`);
        this.#consume(tokens.doctype.element.end);
        return {
            [element]: value
        };
    }
    #tag({ path: path7  }) {
        this.#debug(path7, "parsing tag");
        const tag = this.#make.node({
            path: path7
        });
        this.#consume(tokens.tag.start);
        const name = this.#capture(tokens.tag.regex.name);
        Object.assign(tag[$XML], {
            name
        });
        this.#debug(path7, `found tag "${name}"`);
        while(!tokens.tag.close.regex.end.test(this.#stream.peek(2))){
            Object.assign(tag, this.#attribute({
                path: [
                    ...path7,
                    tag
                ]
            }));
        }
        const selfclosed = this.#peek(tokens.tag.close.self);
        if (selfclosed) {
            this.#debug(path7, `tag "${name}" is self-closed`);
            this.#consume(tokens.tag.close.self);
        }
        this.#consume(tokens.tag.end);
        if (!selfclosed) {
            if (this.#peek(tokens.cdata.start) || !this.#peek(tokens.tag.start)) {
                Object.assign(tag, this.#text({
                    close: name,
                    path: [
                        ...path7,
                        tag
                    ]
                }));
            } else {
                while(!tokens.tag.close.regex.start.test(this.#stream.peek(2))){
                    const child = this.#node({
                        path: [
                            ...path7,
                            tag
                        ]
                    });
                    const [key, value1] = Object.entries(child).shift();
                    if (Array.isArray(tag[key])) {
                        tag[key].push(value1);
                        this.#debug([
                            ...path7,
                            tag
                        ], `add new child "${key}" to array`);
                    } else if (key in tag) {
                        const array = [
                            tag[key],
                            value1
                        ];
                        Object.defineProperty(array, $XML, {
                            enumerable: false,
                            writable: true
                        });
                        if (tag[key]?.[$XML]) {
                            Object.assign(array, {
                                [$XML]: tag[key][$XML]
                            });
                        }
                        tag[key] = array;
                        this.#debug([
                            ...path7,
                            tag
                        ], `multiple children named "${key}", using array notation`);
                    } else {
                        Object.assign(tag, child);
                        this.#debug([
                            ...path7,
                            tag
                        ], `add new child "${key}"`);
                    }
                }
            }
            this.#consume(tokens.tag.close.start);
            this.#consume(name);
            this.#consume(tokens.tag.close.end);
            this.#debug(path7, `found closing tag for "${name}"`);
        }
        for (const [key1] of Object.entries(tag).filter(([_, value])=>typeof value === "undefined")){
            delete tag[key1];
        }
        if (!Object.keys(tag).includes(schema.text)) {
            const children = Object.keys(tag).filter((key)=>!key.startsWith(schema.attribute.prefix) && key !== schema.text);
            if (!children.length) {
                this.#debug(path7, `tag "${name}" has implictely obtained a text node as it has no children but has attributes`);
                tag[schema.text] = this.#revive({
                    key: schema.text,
                    value: "",
                    tag
                });
            }
        }
        if ((this.#options.flatten ?? true) && Object.keys(tag).includes(schema.text) && Object.keys(tag).length === 1) {
            this.#debug(path7, `tag "${name}" has been implicitely flattened as it only has a text node`);
            return {
                [name]: tag[schema.text]
            };
        }
        return {
            [name]: tag
        };
    }
    #attribute({ path: path8  }) {
        this.#debug(path8, "parsing attribute");
        const attribute = this.#capture(tokens.tag.attribute.regex.name);
        this.#debug(path8, `found attribute "${attribute}"`);
        this.#consume("=");
        const quote = this.#stream.peek();
        this.#consume(quote);
        const value2 = this.#capture({
            until: new RegExp(quote),
            bytes: quote.length
        });
        this.#consume(quote);
        this.#debug(path8, `found attribute value "${value2}"`);
        return {
            [`${schema.attribute.prefix}${attribute}`]: this.#revive({
                key: `${schema.attribute.prefix}${attribute}`,
                value: value2,
                tag: path8.at(-1)
            })
        };
    }
    #property({ path: path9  }) {
        this.#debug(path9, "parsing property");
        const quote1 = this.#stream.peek();
        const delimiter = /["']/.test(quote1) ? quote1 : " ";
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        const property = this.#capture({
            until: new RegExp(delimiter),
            bytes: delimiter.length
        });
        this.#debug(path9, `found property ${property}`);
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        return {
            [`${schema.property.prefix}${property}`]: true
        };
    }
    #text({ close , path: path10  }) {
        this.#debug(path10, "parsing text");
        const tag1 = this.#make.node({
            name: schema.text,
            path: path10
        });
        let text = "";
        const comments1 = [];
        while(this.#peek(tokens.cdata.start) || !this.#peeks([
            tokens.tag.close.start,
            close,
            tokens.tag.close.end
        ])){
            if (this.#peek(tokens.cdata.start)) {
                text += this.#cdata({
                    path: [
                        ...path10,
                        tag1
                    ]
                });
            } else if (this.#peek(tokens.comment.start)) {
                comments1.push(this.#comment({
                    path: [
                        ...path10,
                        tag1
                    ]
                }));
            } else {
                text += this.#capture(tokens.text.regex.end);
                if (this.#peek(tokens.cdata.start) || this.#peek(tokens.comment.start)) {
                    continue;
                }
                if (!this.#peeks([
                    tokens.tag.close.start,
                    close,
                    tokens.tag.close.end
                ])) {
                    text += tokens.tag.close.start;
                    this.#consume(tokens.tag.close.start);
                }
            }
        }
        this.#debug(path10, `parsed text "${text}"`);
        if (comments1.length) {
            this.#debug(path10, `parsed comments ${JSON.stringify(comments1)}`);
        }
        Object.assign(tag1, {
            [schema.text]: this.#revive({
                key: schema.text,
                value: text.trim(),
                tag: path10.at(-1)
            }),
            ...comments1.length ? {
                [schema.comment]: comments1
            } : {}
        });
        return tag1;
    }
    #cdata({ path: path11  }) {
        this.#debug(path11, "parsing cdata");
        this.#consume(tokens.cdata.start);
        const data = this.#capture(tokens.cdata.regex.end);
        this.#consume(tokens.cdata.end);
        return data;
    }
    #comment({ path: path12  }) {
        this.#debug(path12, "parsing comment");
        this.#consume(tokens.comment.start);
        const comment = this.#capture(tokens.comment.regex.end).trim();
        this.#consume(tokens.comment.end);
        return comment;
    }
    #revive({ key: key2 , value: value3 , tag: tag2  }) {
        return this.#options.reviver.call(tag2, {
            key: key2,
            tag: tag2[$XML].name,
            properties: !(key2.startsWith(schema.attribute.prefix) || key2.startsWith(schema.property.prefix)) ? {
                ...tag2
            } : null,
            value: (()=>{
                switch(true){
                    case (this.#options.emptyToNull ?? true) && /^\s*$/.test(value3):
                        return null;
                    case (this.#options.reviveBooleans ?? true) && /^(?:true|false)$/i.test(value3):
                        return /^true$/i.test(value3);
                    case this.#options.reviveNumbers ?? true:
                        {
                            const num = Number(value3);
                            if (Number.isFinite(num)) {
                                return num;
                            }
                        }
                    default:
                        value3 = value3.replace(tokens.entity.regex.entities, (_, hex, code)=>String.fromCharCode(parseInt(code, hex ? 16 : 10)));
                        for (const [entity, character] of Object.entries(entities.xml)){
                            value3 = value3.replaceAll(entity, character);
                        }
                        return value3;
                }
            })()
        });
    }
    #make = {
        node ({ name ="" , path =[]  }) {
            const node = {
                [$XML]: {
                    name,
                    parent: path[path.length - 1] ?? null
                }
            };
            Object.defineProperty(node, $XML, {
                enumerable: false,
                writable: true
            });
            return node;
        }
    };
    #stream;
    #peek(token) {
        return this.#stream.peek(token.length) === token;
    }
    #peeks(tokens1) {
        let offset = 0;
        for(let i = 0; i < tokens1.length; i++){
            const token1 = tokens1[i];
            while(true){
                if (/\s/.test(this.#stream.peek(1, offset))) {
                    offset++;
                    continue;
                }
                if (this.#stream.peek(token1.length, offset) === token1) {
                    offset += token1.length;
                    break;
                }
                return false;
            }
        }
        return true;
    }
    #consume(token2) {
        return this.#stream.consume({
            content: token2
        });
    }
    #capture(token3) {
        return this.#stream.capture(token3);
    }
    #trim() {
        return this.#stream.trim();
    }
}
class Stream {
    constructor(content){
        this.#content = content;
    }
    #decoder = new TextDecoder();
    #encoder = new TextEncoder();
    #content;
    get cursor() {
        return this.#content.seekSync(0, SeekMode.Current);
    }
    peek(bytes = 1, offset = 0) {
        const buffer = new Uint8Array(bytes);
        const cursor = this.cursor;
        if (offset) {
            this.#content.seekSync(offset, SeekMode.Current);
        }
        if (this.#content.readSync(buffer)) {
            this.#content.seekSync(cursor, SeekMode.Start);
            return this.#decoder.decode(buffer);
        }
        throw new Deno.errors.UnexpectedEof();
    }
    read(bytes = 1) {
        const buffer = new Uint8Array(bytes);
        if (this.#content.readSync(buffer)) {
            return buffer;
        }
        throw new Deno.errors.UnexpectedEof();
    }
    capture({ until , bytes , trim =true , length =bytes  }) {
        if (trim) {
            this.trim();
        }
        const buffer = [];
        while(!until.test(this.peek(bytes))){
            buffer.push(this.read(1)[0]);
        }
        if (bytes !== length) {
            buffer.push(...this.read(bytes - length));
        }
        if (trim) {
            this.trim();
        }
        return this.#decoder.decode(Uint8Array.from(buffer));
    }
    consume({ content , trim =true  }) {
        if (trim) {
            this.trim();
        }
        const bytes = this.#encoder.encode(content).length;
        if (content === this.peek(bytes)) {
            this.read(bytes);
            if (trim) {
                this.trim();
            }
            return;
        }
        throw Object.assign(new SyntaxError(`Expected next sequence to be "${content}", got "${this.peek(bytes)}" instead`), {
            stack: false
        });
    }
    trim() {
        try {
            while(/\s/.test(this.peek())){
                this.read(1);
            }
        } catch (error) {
            if (error instanceof Deno.errors.UnexpectedEof) {
                return;
            }
            throw error;
        }
    }
}
class Streamable {
    constructor(string){
        this.#buffer = new TextEncoder().encode(string);
    }
    #buffer;
    #cursor = 0;
    readSync(buffer) {
        const bytes = this.#buffer.slice(this.#cursor, this.#cursor + buffer.length);
        buffer.set(bytes);
        this.#cursor = Math.min(this.#cursor + bytes.length, this.#buffer.length);
        return bytes.length || null;
    }
    seekSync(offset, whence) {
        switch(whence){
            case SeekMode.Start:
                this.#cursor = offset;
                break;
            case SeekMode.Current:
                this.#cursor += offset;
                break;
            case SeekMode.End:
                this.#cursor = this.#buffer.length + offset;
                break;
        }
        return this.#cursor;
    }
}
function parse(content, options) {
    if (typeof content === "string") {
        content = new Streamable(content);
    }
    return new Parser(new Stream(content), options).parse();
}
class Stringifier {
    constructor(document, options = {}){
        this.#document = document;
        this.#options = options;
        this.#options.replacer ??= function({ value  }) {
            return value;
        };
    }
    stringify() {
        const document = this.#make.extraction(this.#document);
        if (document.raw.xml) {
            this.#prolog(document);
        }
        if (document.raw[schema.stylesheets]) {
            this.#stylesheet(document);
        }
        if (document.raw.doctype) {
            this.#doctype(document);
        }
        this.#tag({
            path: [],
            name: "",
            ...document
        });
        return this.#result.trim();
    }
    #options;
    #document;
    #debug(path13, string1) {
        if (this.#options.debug) {
            console.debug(`${path13.join(" > ")} | ${string1}`.trim());
        }
    }
    #prolog({ raw: node  }) {
        this.#debug([], "stringifying prolog");
        const attributes = this.#attributes({
            tag: "prolog",
            ...this.#make.extraction(node.xml)
        });
        this.#write(`${tokens.prolog.start}${attributes}${tokens.prolog.end}`);
    }
    #stylesheet({ raw: node1  }) {
        this.#debug([], "stringifying stylesheets");
        for (const stylesheet1 of node1[schema.stylesheets]){
            const attributes1 = this.#attributes({
                tag: "stylesheet",
                ...this.#make.extraction(stylesheet1)
            });
            this.#write(`${tokens.stylesheet.start}${attributes1}${tokens.stylesheet.end}`);
        }
    }
    #doctype({ raw: node2  }) {
        this.#debug([], "stringifying doctype");
        const { raw: doctype1 , attributes: attributes2 , children: elements  } = this.#make.extraction(node2.doctype);
        this.#write(`${tokens.doctype.start}${this.#properties({
            attributes: attributes2
        })}`, {
            newline: !!elements.length
        });
        if (elements.length) {
            this.#debug([], "stringifying doctype elements");
            this.#down();
            this.#write(tokens.doctype.elements.start);
            this.#down();
            for (const key3 of elements){
                this.#debug([], `stringifying doctype elements ${key3}`);
                const value4 = `${tokens.doctype.element.value.start}${doctype1[key3]}${tokens.doctype.element.value.end}`;
                this.#write(`${tokens.doctype.element.start} ${this.#quote(key3, {
                    optional: true
                })} ${value4} ${tokens.doctype.element.end}`);
            }
            this.#up();
            this.#write(tokens.doctype.elements.end);
            this.#up();
        }
        this.#write(tokens.doctype.end);
    }
    #tag({ path: path14 , name: name1 , raw: node3 , text: content , comments: comments2 , attributes: attributes3 , children: children1  }) {
        if (name1) {
            this.#debug(path14, `stringifying tag ${name1}`);
        }
        if (this.#options.progress) {
            this.#options.progress(this.#result.length);
        }
        const selfclosed1 = content === null && !comments2.length && !children1.length;
        let inline = false;
        if (name1) {
            this.#write(`${tokens.tag.start}${name1}${this.#attributes({
                raw: node3,
                attributes: attributes3,
                tag: name1
            })}${selfclosed1 ? tokens.tag.close.self : ""}${tokens.tag.end}`);
            this.#down();
        }
        if (!selfclosed1) {
            if ([
                "string",
                "boolean",
                "number",
                "undefined"
            ].includes(typeof content) || content === null) {
                this.#debug(path14, `stringifying text content`);
                inline = this.#text({
                    text: content,
                    tag: name1,
                    properties: Object.fromEntries(attributes3.map((attribute)=>[
                            attribute.substring(schema.attribute.prefix.length),
                            node3[attribute]
                        ]))
                });
            }
            if (comments2.length) {
                this.#debug(path14, `stringifying comments`);
                const commentArr = Array.isArray(comments2) ? comments2 : [
                    comments2
                ];
                for (const comment1 of commentArr){
                    this.#write("\n", {
                        newline: false,
                        indent: false
                    });
                    this.#comment({
                        text: comment1,
                        tag: name1
                    });
                }
            }
            if (children1.length) {
                this.#debug(path14, `stringifying children`);
                this.#write("\n", {
                    newline: false,
                    indent: false
                });
                const handle = ({ child , name  })=>{
                    switch(true){
                        case Array.isArray(child):
                            {
                                for (const value of child){
                                    handle({
                                        child: value,
                                        name
                                    });
                                }
                                break;
                            }
                        case typeof child === "object" && !!child:
                            {
                                this.#tag({
                                    name,
                                    path: [
                                        ...path14,
                                        name
                                    ],
                                    ...this.#make.extraction(child)
                                });
                                break;
                            }
                        default:
                            {
                                this.#tag({
                                    name,
                                    path: [
                                        ...path14,
                                        name
                                    ],
                                    ...this.#make.extraction({
                                        [schema.text]: child
                                    })
                                });
                                break;
                            }
                    }
                };
                for (const name11 of children1){
                    const child1 = node3[name11];
                    handle({
                        child: child1,
                        name: name11
                    });
                }
                inline = false;
            }
        }
        if (name1) {
            this.#up();
            if (!selfclosed1) {
                this.#write(`${tokens.tag.close.start}${name1}${tokens.tag.close.end}`, {
                    indent: !inline
                });
            }
        }
    }
    #comment({ text: text1 , tag: tag3  }) {
        const comment11 = this.#replace({
            value: text1,
            key: schema.comment,
            tag: tag3,
            properties: null
        });
        this.#write(`${tokens.comment.start} ${comment11} ${tokens.comment.end}`, {
            newline: false
        });
    }
    #text({ text: text11 , tag: tag11 , properties  }) {
        const lines = this.#replace({
            value: text11,
            key: schema.text,
            tag: tag11,
            properties
        }).split("\n");
        const inline1 = lines.length <= 1;
        if (inline1) {
            this.#trim();
        }
        for (const line of lines){
            this.#write(line.trimStart(), {
                indent: !inline1,
                newline: !inline1
            });
        }
        return inline1;
    }
    #attributes({ raw: node4 , attributes: attributes4 , tag: tag21  }) {
        const stringified = attributes4.map((key)=>`${key.substring(schema.attribute.prefix.length)}=${this.#quote(this.#replace({
                key,
                value: node4[key],
                tag: tag21,
                properties: null
            }))}`).join(" ");
        return stringified.length ? ` ${stringified}` : "";
    }
    #properties({ attributes: attributes5  }) {
        const stringified1 = attributes5.map((key)=>`${this.#quote(key.substring(schema.property.prefix.length), {
                optional: true
            })}`).join(" ");
        return stringified1.length ? ` ${stringified1}` : "";
    }
    #replace({ key: key11 , value: value11 , tag: tag31 , properties: properties1  }) {
        return `${this.#options.replacer.call(null, {
            key: key11,
            tag: tag31,
            properties: properties1,
            value: (()=>{
                switch(true){
                    case (this.#options.nullToEmpty ?? true) && value11 === null:
                        return "";
                    default:
                        {
                            for (const [__char, entity] of Object.entries(entities.char)){
                                value11 = `${value11}`.replaceAll(__char, entity);
                            }
                        }
                }
                return `${value11}`;
            })()
        })}`;
    }
    #result = "";
    #write(text2, { newline =true , indent =true  } = {}) {
        this.#result += `${`${indent ? " ".repeat((this.#options?.indentSize ?? 2) * this.#depth) : ""}`}${text2}${newline ? "\n" : ""}`;
    }
    #trim() {
        this.#result = this.#result.trim();
    }
    #depth = 0;
    #down() {
        this.#depth++;
    }
    #up() {
        this.#depth--;
        this.#depth = Math.max(0, this.#depth);
    }
    #quote(content1, { optional =false  } = {}) {
        if (optional) {
            if (/^[\w_]+$/i.test(`${content1}`)) {
                return `${content1}`;
            }
        }
        return `"${`${content1}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    #make = {
        extraction (node) {
            const keys = Object.keys(node ?? {});
            return {
                raw: node,
                text: node?.[schema.text] ?? null,
                comments: node?.[schema.comment] ?? [],
                attributes: keys.filter((key)=>key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix)),
                children: keys.filter((key)=>![
                        schema.text,
                        schema.comment,
                        schema.stylesheets,
                        "xml",
                        "doctype"
                    ].includes(key) && !(key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix))),
                meta: node?.[$XML] ?? {}
            };
        }
    };
}
function stringify(content, options) {
    return new Stringifier(content, options).stringify();
}
export { parse as parse };
export { stringify as stringify };
export { $XML as $XML };
