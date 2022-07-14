function indexOf(source, pat, start = 0) {
    if (start >= source.length) {
        return -1;
    }
    if (start < 0) {
        start = 0;
    }
    const s = pat[0];
    for(let i = start; i < source.length; i++){
        if (source[i] !== s) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < pat.length){
            j++;
            if (source[j] !== pat[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === pat.length) {
            return pin;
        }
    }
    return -1;
}
function lastIndexOf(source, pat, start = source.length - 1) {
    if (start < 0) {
        return -1;
    }
    if (start >= source.length) {
        start = source.length - 1;
    }
    const e = pat[pat.length - 1];
    for(let i = start; i >= 0; i--){
        if (source[i] !== e) continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while(matched < pat.length){
            j--;
            if (source[j] !== pat[pat.length - 1 - (pin - j)]) {
                break;
            }
            matched++;
        }
        if (matched === pat.length) {
            return pin - pat.length + 1;
        }
    }
    return -1;
}
function equals(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < b.length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
function startsWith(source, prefix) {
    for(let i = 0, max = prefix.length; i < max; i++){
        if (source[i] !== prefix[i]) return false;
    }
    return true;
}
function concat(...buf) {
    let length = 0;
    for (const b of buf){
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b1 of buf){
        output.set(b1, index);
        index += b1.length;
    }
    return output;
}
function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
class Buffer {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    empty() {
        return this.#buf.byteLength <= this.#off;
    }
    get length() {
        return this.#buf.byteLength - this.#off;
    }
    get capacity() {
        return this.#buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
     #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
     #reslice(len) {
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    readSync(p) {
        if (this.empty()) {
            this.reset();
            if (p.byteLength === 0) {
                return 0;
            }
            return null;
        }
        const nread = copy(this.#buf.subarray(this.#off), p);
        this.#off += nread;
        return nread;
    }
    read(p) {
        const rr = this.readSync(p);
        return Promise.resolve(rr);
    }
    writeSync(p) {
        const m = this.#grow(p.byteLength);
        return copy(p, this.#buf, m);
    }
    write(p) {
        const n = this.writeSync(p);
        return Promise.resolve(n);
    }
     #grow(n) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            copy(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
            copy(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n, MAX_SIZE));
        return m;
    }
    grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
    async readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
    readFromSync(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
}
const noColor = globalThis.Deno?.noColor ?? true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {
}));
const DEFAULT_BUFFER_SIZE = 32 * 1024;
async function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += await w.write(arr.subarray(nwritten));
    }
}
function writeAllSync(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.writeSync(arr.subarray(nwritten));
    }
}
async function* iter(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = await r.read(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
    }
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i = 100; i > 0; i--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert(nread >= 0, "negative read");
                return rr;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copy(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                err.partial = p.subarray(0, bytesRead);
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            let { partial  } = err;
            assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            if (!this.eof && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            return {
                line: partial,
                more: !this.eof
            };
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.buf.subarray(this.r, this.r + i + 1);
                this.r += i + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            } catch (err) {
                err.partial = slice;
                throw err;
            }
        }
        return slice;
    }
    async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err) {
                err.partial = this.buf.subarray(this.r, this.w);
                throw err;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            await writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    this.err = e;
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
class BufWriterSync extends AbstractBufBase {
    writer;
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    this.err = e;
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
const CHAR_SPACE = " ".charCodeAt(0);
const CHAR_TAB = "\t".charCodeAt(0);
const CHAR_COLON = ":".charCodeAt(0);
const WHITESPACES = [
    CHAR_SPACE,
    CHAR_TAB
];
const decoder = new TextDecoder();
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/g;
function str(buf) {
    return !buf ? "" : decoder.decode(buf);
}
class TextProtoReader {
    r;
    constructor(r){
        this.r = r;
    }
    async readLine() {
        const s = await this.readLineSlice();
        return s === null ? null : str(s);
    }
    async readMIMEHeader() {
        const m = new Headers();
        let line;
        let buf = await this.r.peek(1);
        if (buf === null) {
            return null;
        } else if (WHITESPACES.includes(buf[0])) {
            line = await this.readLineSlice();
        }
        buf = await this.r.peek(1);
        if (buf === null) {
            throw new Deno.errors.UnexpectedEof();
        } else if (WHITESPACES.includes(buf[0])) {
            throw new Deno.errors.InvalidData(`malformed MIME header initial line: ${str(line)}`);
        }
        while(true){
            const kv = await this.readLineSlice();
            if (kv === null) throw new Deno.errors.UnexpectedEof();
            if (kv.byteLength === 0) return m;
            let i = kv.indexOf(CHAR_COLON);
            if (i < 0) {
                throw new Deno.errors.InvalidData(`malformed MIME header line: ${str(kv)}`);
            }
            const key = str(kv.subarray(0, i));
            if (key == "") {
                continue;
            }
            i++;
            while(i < kv.byteLength && WHITESPACES.includes(kv[i])){
                i++;
            }
            const value = str(kv.subarray(i)).replace(invalidHeaderCharRegex, encodeURI);
            try {
                m.append(key, value);
            } catch  {
            }
        }
    }
    async readLineSlice() {
        let line = new Uint8Array(0);
        let r = null;
        do {
            r = await this.r.readLine();
            if (r !== null && this.skipSpace(r.line) !== 0) {
                line = concat(line, r.line);
            }
        }while (r !== null && r.more)
        return r === null ? null : line;
    }
    skipSpace(l) {
        let n = 0;
        for (const val of l){
            if (!WHITESPACES.includes(val)) {
                n++;
            }
        }
        return n;
    }
}
var Status;
(function(Status) {
    Status[Status["Continue"] = 100] = "Continue";
    Status[Status["SwitchingProtocols"] = 101] = "SwitchingProtocols";
    Status[Status["Processing"] = 102] = "Processing";
    Status[Status["EarlyHints"] = 103] = "EarlyHints";
    Status[Status["OK"] = 200] = "OK";
    Status[Status["Created"] = 201] = "Created";
    Status[Status["Accepted"] = 202] = "Accepted";
    Status[Status["NonAuthoritativeInfo"] = 203] = "NonAuthoritativeInfo";
    Status[Status["NoContent"] = 204] = "NoContent";
    Status[Status["ResetContent"] = 205] = "ResetContent";
    Status[Status["PartialContent"] = 206] = "PartialContent";
    Status[Status["MultiStatus"] = 207] = "MultiStatus";
    Status[Status["AlreadyReported"] = 208] = "AlreadyReported";
    Status[Status["IMUsed"] = 226] = "IMUsed";
    Status[Status["MultipleChoices"] = 300] = "MultipleChoices";
    Status[Status["MovedPermanently"] = 301] = "MovedPermanently";
    Status[Status["Found"] = 302] = "Found";
    Status[Status["SeeOther"] = 303] = "SeeOther";
    Status[Status["NotModified"] = 304] = "NotModified";
    Status[Status["UseProxy"] = 305] = "UseProxy";
    Status[Status["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    Status[Status["PermanentRedirect"] = 308] = "PermanentRedirect";
    Status[Status["BadRequest"] = 400] = "BadRequest";
    Status[Status["Unauthorized"] = 401] = "Unauthorized";
    Status[Status["PaymentRequired"] = 402] = "PaymentRequired";
    Status[Status["Forbidden"] = 403] = "Forbidden";
    Status[Status["NotFound"] = 404] = "NotFound";
    Status[Status["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    Status[Status["NotAcceptable"] = 406] = "NotAcceptable";
    Status[Status["ProxyAuthRequired"] = 407] = "ProxyAuthRequired";
    Status[Status["RequestTimeout"] = 408] = "RequestTimeout";
    Status[Status["Conflict"] = 409] = "Conflict";
    Status[Status["Gone"] = 410] = "Gone";
    Status[Status["LengthRequired"] = 411] = "LengthRequired";
    Status[Status["PreconditionFailed"] = 412] = "PreconditionFailed";
    Status[Status["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
    Status[Status["RequestURITooLong"] = 414] = "RequestURITooLong";
    Status[Status["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
    Status[Status["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
    Status[Status["ExpectationFailed"] = 417] = "ExpectationFailed";
    Status[Status["Teapot"] = 418] = "Teapot";
    Status[Status["MisdirectedRequest"] = 421] = "MisdirectedRequest";
    Status[Status["UnprocessableEntity"] = 422] = "UnprocessableEntity";
    Status[Status["Locked"] = 423] = "Locked";
    Status[Status["FailedDependency"] = 424] = "FailedDependency";
    Status[Status["TooEarly"] = 425] = "TooEarly";
    Status[Status["UpgradeRequired"] = 426] = "UpgradeRequired";
    Status[Status["PreconditionRequired"] = 428] = "PreconditionRequired";
    Status[Status["TooManyRequests"] = 429] = "TooManyRequests";
    Status[Status["RequestHeaderFieldsTooLarge"] = 431] = "RequestHeaderFieldsTooLarge";
    Status[Status["UnavailableForLegalReasons"] = 451] = "UnavailableForLegalReasons";
    Status[Status["InternalServerError"] = 500] = "InternalServerError";
    Status[Status["NotImplemented"] = 501] = "NotImplemented";
    Status[Status["BadGateway"] = 502] = "BadGateway";
    Status[Status["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    Status[Status["GatewayTimeout"] = 504] = "GatewayTimeout";
    Status[Status["HTTPVersionNotSupported"] = 505] = "HTTPVersionNotSupported";
    Status[Status["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
    Status[Status["InsufficientStorage"] = 507] = "InsufficientStorage";
    Status[Status["LoopDetected"] = 508] = "LoopDetected";
    Status[Status["NotExtended"] = 510] = "NotExtended";
    Status[Status["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(Status || (Status = {
}));
const STATUS_TEXT = new Map([
    [
        Status.Continue,
        "Continue"
    ],
    [
        Status.SwitchingProtocols,
        "Switching Protocols"
    ],
    [
        Status.Processing,
        "Processing"
    ],
    [
        Status.EarlyHints,
        "Early Hints"
    ],
    [
        Status.OK,
        "OK"
    ],
    [
        Status.Created,
        "Created"
    ],
    [
        Status.Accepted,
        "Accepted"
    ],
    [
        Status.NonAuthoritativeInfo,
        "Non-Authoritative Information"
    ],
    [
        Status.NoContent,
        "No Content"
    ],
    [
        Status.ResetContent,
        "Reset Content"
    ],
    [
        Status.PartialContent,
        "Partial Content"
    ],
    [
        Status.MultiStatus,
        "Multi-Status"
    ],
    [
        Status.AlreadyReported,
        "Already Reported"
    ],
    [
        Status.IMUsed,
        "IM Used"
    ],
    [
        Status.MultipleChoices,
        "Multiple Choices"
    ],
    [
        Status.MovedPermanently,
        "Moved Permanently"
    ],
    [
        Status.Found,
        "Found"
    ],
    [
        Status.SeeOther,
        "See Other"
    ],
    [
        Status.NotModified,
        "Not Modified"
    ],
    [
        Status.UseProxy,
        "Use Proxy"
    ],
    [
        Status.TemporaryRedirect,
        "Temporary Redirect"
    ],
    [
        Status.PermanentRedirect,
        "Permanent Redirect"
    ],
    [
        Status.BadRequest,
        "Bad Request"
    ],
    [
        Status.Unauthorized,
        "Unauthorized"
    ],
    [
        Status.PaymentRequired,
        "Payment Required"
    ],
    [
        Status.Forbidden,
        "Forbidden"
    ],
    [
        Status.NotFound,
        "Not Found"
    ],
    [
        Status.MethodNotAllowed,
        "Method Not Allowed"
    ],
    [
        Status.NotAcceptable,
        "Not Acceptable"
    ],
    [
        Status.ProxyAuthRequired,
        "Proxy Authentication Required"
    ],
    [
        Status.RequestTimeout,
        "Request Timeout"
    ],
    [
        Status.Conflict,
        "Conflict"
    ],
    [
        Status.Gone,
        "Gone"
    ],
    [
        Status.LengthRequired,
        "Length Required"
    ],
    [
        Status.PreconditionFailed,
        "Precondition Failed"
    ],
    [
        Status.RequestEntityTooLarge,
        "Request Entity Too Large"
    ],
    [
        Status.RequestURITooLong,
        "Request URI Too Long"
    ],
    [
        Status.UnsupportedMediaType,
        "Unsupported Media Type"
    ],
    [
        Status.RequestedRangeNotSatisfiable,
        "Requested Range Not Satisfiable"
    ],
    [
        Status.ExpectationFailed,
        "Expectation Failed"
    ],
    [
        Status.Teapot,
        "I'm a teapot"
    ],
    [
        Status.MisdirectedRequest,
        "Misdirected Request"
    ],
    [
        Status.UnprocessableEntity,
        "Unprocessable Entity"
    ],
    [
        Status.Locked,
        "Locked"
    ],
    [
        Status.FailedDependency,
        "Failed Dependency"
    ],
    [
        Status.TooEarly,
        "Too Early"
    ],
    [
        Status.UpgradeRequired,
        "Upgrade Required"
    ],
    [
        Status.PreconditionRequired,
        "Precondition Required"
    ],
    [
        Status.TooManyRequests,
        "Too Many Requests"
    ],
    [
        Status.RequestHeaderFieldsTooLarge,
        "Request Header Fields Too Large"
    ],
    [
        Status.UnavailableForLegalReasons,
        "Unavailable For Legal Reasons"
    ],
    [
        Status.InternalServerError,
        "Internal Server Error"
    ],
    [
        Status.NotImplemented,
        "Not Implemented"
    ],
    [
        Status.BadGateway,
        "Bad Gateway"
    ],
    [
        Status.ServiceUnavailable,
        "Service Unavailable"
    ],
    [
        Status.GatewayTimeout,
        "Gateway Timeout"
    ],
    [
        Status.HTTPVersionNotSupported,
        "HTTP Version Not Supported"
    ],
    [
        Status.VariantAlsoNegotiates,
        "Variant Also Negotiates"
    ],
    [
        Status.InsufficientStorage,
        "Insufficient Storage"
    ],
    [
        Status.LoopDetected,
        "Loop Detected"
    ],
    [
        Status.NotExtended,
        "Not Extended"
    ],
    [
        Status.NetworkAuthenticationRequired,
        "Network Authentication Required"
    ], 
]);
function deferred() {
    let methods;
    const promise = new Promise((resolve, reject)=>{
        methods = {
            resolve,
            reject
        };
    });
    return Object.assign(promise, methods);
}
class MuxAsyncIterator {
    iteratorCount = 0;
    yields = [];
    throws = [];
    signal = deferred();
    add(iterable) {
        ++this.iteratorCount;
        this.callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async callIteratorNext(iterator) {
        try {
            const { value , done  } = await iterator.next();
            if (done) {
                --this.iteratorCount;
            } else {
                this.yields.push({
                    iterator,
                    value
                });
            }
        } catch (e) {
            this.throws.push(e);
        }
        this.signal.resolve();
    }
    async *iterate() {
        while(this.iteratorCount > 0){
            await this.signal;
            for(let i = 0; i < this.yields.length; i++){
                const { iterator , value  } = this.yields[i];
                yield value;
                this.callIteratorNext(iterator);
            }
            if (this.throws.length) {
                for (const e of this.throws){
                    throw e;
                }
                this.throws.length = 0;
            }
            this.yields.length = 0;
            this.signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
const encoder = new TextEncoder();
function emptyReader() {
    return {
        read (_) {
            return Promise.resolve(null);
        }
    };
}
function bodyReader(contentLength, r) {
    let totalRead = 0;
    let finished = false;
    async function read(buf) {
        if (finished) return null;
        let result;
        const remaining = contentLength - totalRead;
        if (remaining >= buf.byteLength) {
            result = await r.read(buf);
        } else {
            const readBuf = buf.subarray(0, remaining);
            result = await r.read(readBuf);
        }
        if (result !== null) {
            totalRead += result;
        }
        finished = totalRead === contentLength;
        return result;
    }
    return {
        read
    };
}
function chunkedBodyReader(h, r) {
    const tp = new TextProtoReader(r);
    let finished = false;
    const chunks = [];
    async function read(buf) {
        if (finished) return null;
        const [chunk] = chunks;
        if (chunk) {
            const chunkRemaining = chunk.data.byteLength - chunk.offset;
            const readLength = Math.min(chunkRemaining, buf.byteLength);
            for(let i = 0; i < readLength; i++){
                buf[i] = chunk.data[chunk.offset + i];
            }
            chunk.offset += readLength;
            if (chunk.offset === chunk.data.byteLength) {
                chunks.shift();
                if (await tp.readLine() === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
            }
            return readLength;
        }
        const line = await tp.readLine();
        if (line === null) throw new Deno.errors.UnexpectedEof();
        const [chunkSizeString] = line.split(";");
        const chunkSize = parseInt(chunkSizeString, 16);
        if (Number.isNaN(chunkSize) || chunkSize < 0) {
            throw new Deno.errors.InvalidData("Invalid chunk size");
        }
        if (chunkSize > 0) {
            if (chunkSize > buf.byteLength) {
                let eof = await r.readFull(buf);
                if (eof === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                const restChunk = new Uint8Array(chunkSize - buf.byteLength);
                eof = await r.readFull(restChunk);
                if (eof === null) {
                    throw new Deno.errors.UnexpectedEof();
                } else {
                    chunks.push({
                        offset: 0,
                        data: restChunk
                    });
                }
                return buf.byteLength;
            } else {
                const bufToFill = buf.subarray(0, chunkSize);
                const eof = await r.readFull(bufToFill);
                if (eof === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                if (await tp.readLine() === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                return chunkSize;
            }
        } else {
            assert(chunkSize === 0);
            if (await r.readLine() === null) {
                throw new Deno.errors.UnexpectedEof();
            }
            await readTrailers(h, r);
            finished = true;
            return null;
        }
    }
    return {
        read
    };
}
function isProhibidedForTrailer(key) {
    const s = new Set([
        "transfer-encoding",
        "content-length",
        "trailer"
    ]);
    return s.has(key.toLowerCase());
}
async function readTrailers(headers, r) {
    const trailers = parseTrailer(headers.get("trailer"));
    if (trailers == null) return;
    const trailerNames = [
        ...trailers.keys()
    ];
    const tp = new TextProtoReader(r);
    const result = await tp.readMIMEHeader();
    if (result == null) {
        throw new Deno.errors.InvalidData("Missing trailer header.");
    }
    const undeclared = [
        ...result.keys()
    ].filter((k)=>!trailerNames.includes(k)
    );
    if (undeclared.length > 0) {
        throw new Deno.errors.InvalidData(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
    }
    for (const [k, v] of result){
        headers.append(k, v);
    }
    const missingTrailers = trailerNames.filter((k)=>!result.has(k)
    );
    if (missingTrailers.length > 0) {
        throw new Deno.errors.InvalidData(`Missing trailers: ${Deno.inspect(missingTrailers)}.`);
    }
    headers.delete("trailer");
}
function parseTrailer(field) {
    if (field == null) {
        return undefined;
    }
    const trailerNames = field.split(",").map((v)=>v.trim().toLowerCase()
    );
    if (trailerNames.length === 0) {
        throw new Deno.errors.InvalidData("Empty trailer header.");
    }
    const prohibited = trailerNames.filter((k)=>isProhibidedForTrailer(k)
    );
    if (prohibited.length > 0) {
        throw new Deno.errors.InvalidData(`Prohibited trailer names: ${Deno.inspect(prohibited)}.`);
    }
    return new Headers(trailerNames.map((key)=>[
            key,
            ""
        ]
    ));
}
async function writeChunkedBody(w, r) {
    for await (const chunk of iter(r)){
        if (chunk.byteLength <= 0) continue;
        const start = encoder.encode(`${chunk.byteLength.toString(16)}\r\n`);
        const end = encoder.encode("\r\n");
        await w.write(start);
        await w.write(chunk);
        await w.write(end);
        await w.flush();
    }
    const endChunk = encoder.encode("0\r\n\r\n");
    await w.write(endChunk);
}
async function writeTrailers(w, headers, trailers) {
    const trailer = headers.get("trailer");
    if (trailer === null) {
        throw new TypeError("Missing trailer header.");
    }
    const transferEncoding = headers.get("transfer-encoding");
    if (transferEncoding === null || !transferEncoding.match(/^chunked/)) {
        throw new TypeError(`Trailers are only allowed for "transfer-encoding: chunked", got "transfer-encoding: ${transferEncoding}".`);
    }
    const writer = BufWriter.create(w);
    const trailerNames = trailer.split(",").map((s)=>s.trim().toLowerCase()
    );
    const prohibitedTrailers = trailerNames.filter((k)=>isProhibidedForTrailer(k)
    );
    if (prohibitedTrailers.length > 0) {
        throw new TypeError(`Prohibited trailer names: ${Deno.inspect(prohibitedTrailers)}.`);
    }
    const undeclared = [
        ...trailers.keys()
    ].filter((k)=>!trailerNames.includes(k)
    );
    if (undeclared.length > 0) {
        throw new TypeError(`Undeclared trailers: ${Deno.inspect(undeclared)}.`);
    }
    for (const [key, value] of trailers){
        await writer.write(encoder.encode(`${key}: ${value}\r\n`));
    }
    await writer.write(encoder.encode("\r\n"));
    await writer.flush();
}
async function writeResponse(w, r) {
    const statusCode = r.status || 200;
    const statusText = (r.statusText ?? STATUS_TEXT.get(statusCode)) ?? null;
    const writer = BufWriter.create(w);
    if (statusText === null) {
        throw new Deno.errors.InvalidData("Empty statusText (explicitely pass an empty string if this was intentional)");
    }
    if (!r.body) {
        r.body = new Uint8Array();
    }
    if (typeof r.body === "string") {
        r.body = encoder.encode(r.body);
    }
    let out = `HTTP/${1}.${1} ${statusCode} ${statusText}\r\n`;
    const headers = r.headers ?? new Headers();
    if (r.body && !headers.get("content-length")) {
        if (r.body instanceof Uint8Array) {
            out += `content-length: ${r.body.byteLength}\r\n`;
        } else if (!headers.get("transfer-encoding")) {
            out += "transfer-encoding: chunked\r\n";
        }
    }
    for (const [key, value] of headers){
        out += `${key}: ${value}\r\n`;
    }
    out += `\r\n`;
    const header = encoder.encode(out);
    const n = await writer.write(header);
    assert(n === header.byteLength);
    if (r.body instanceof Uint8Array) {
        const n = await writer.write(r.body);
        assert(n === r.body.byteLength);
    } else if (headers.has("content-length")) {
        const contentLength = headers.get("content-length");
        assert(contentLength != null);
        const bodyLength = parseInt(contentLength);
        const n = await Deno.copy(r.body, writer);
        assert(n === bodyLength);
    } else {
        await writeChunkedBody(writer, r.body);
    }
    if (r.trailers) {
        const t = await r.trailers();
        await writeTrailers(writer, headers, t);
    }
    await writer.flush();
}
class ServerRequest {
    url;
    method;
    proto;
    protoMinor;
    protoMajor;
    headers;
    conn;
    r;
    w;
    #done = deferred();
    #contentLength = undefined;
    #body = undefined;
    #finalized = false;
    get done() {
        return this.#done.then((e)=>e
        );
    }
    get contentLength() {
        if (this.#contentLength === undefined) {
            const cl = this.headers.get("content-length");
            if (cl) {
                this.#contentLength = parseInt(cl);
                if (Number.isNaN(this.#contentLength)) {
                    this.#contentLength = null;
                }
            } else {
                this.#contentLength = null;
            }
        }
        return this.#contentLength;
    }
    get body() {
        if (!this.#body) {
            if (this.contentLength != null) {
                this.#body = bodyReader(this.contentLength, this.r);
            } else {
                const transferEncoding = this.headers.get("transfer-encoding");
                if (transferEncoding != null) {
                    const parts = transferEncoding.split(",").map((e)=>e.trim().toLowerCase()
                    );
                    assert(parts.includes("chunked"), 'transfer-encoding must include "chunked" if content-length is not set');
                    this.#body = chunkedBodyReader(this.headers, this.r);
                } else {
                    this.#body = emptyReader();
                }
            }
        }
        return this.#body;
    }
    async respond(r) {
        let err;
        try {
            await writeResponse(this.w, r);
        } catch (e) {
            try {
                this.conn.close();
            } catch  {
            }
            err = e;
        }
        this.#done.resolve(err);
        if (err) {
            throw err;
        }
    }
    async finalize() {
        if (this.#finalized) return;
        const body = this.body;
        const buf = new Uint8Array(1024);
        while(await body.read(buf) !== null){
        }
        this.#finalized = true;
    }
}
function parseHTTPVersion(vers) {
    switch(vers){
        case "HTTP/1.1":
            return [
                1,
                1
            ];
        case "HTTP/1.0":
            return [
                1,
                0
            ];
        default:
            {
                if (!vers.startsWith("HTTP/")) {
                    break;
                }
                const dot = vers.indexOf(".");
                if (dot < 0) {
                    break;
                }
                const majorStr = vers.substring(vers.indexOf("/") + 1, dot);
                const major = Number(majorStr);
                if (!Number.isInteger(major) || major < 0 || major > 1000000) {
                    break;
                }
                const minorStr = vers.substring(dot + 1);
                const minor = Number(minorStr);
                if (!Number.isInteger(minor) || minor < 0 || minor > 1000000) {
                    break;
                }
                return [
                    major,
                    minor
                ];
            }
    }
    throw new Error(`malformed HTTP version ${vers}`);
}
async function readRequest(conn, bufr) {
    const tp = new TextProtoReader(bufr);
    const firstLine = await tp.readLine();
    if (firstLine === null) return null;
    const headers = await tp.readMIMEHeader();
    if (headers === null) throw new Deno.errors.UnexpectedEof();
    const req = new ServerRequest();
    req.conn = conn;
    req.r = bufr;
    [req.method, req.url, req.proto] = firstLine.split(" ", 3);
    [req.protoMajor, req.protoMinor] = parseHTTPVersion(req.proto);
    req.headers = headers;
    fixLength(req);
    return req;
}
class Server {
    listener;
    #closing = false;
    #connections = [];
    constructor(listener){
        this.listener = listener;
    }
    close() {
        this.#closing = true;
        this.listener.close();
        for (const conn of this.#connections){
            try {
                conn.close();
            } catch (e) {
                if (!(e instanceof Deno.errors.BadResource)) {
                    throw e;
                }
            }
        }
    }
    async *iterateHttpRequests(conn) {
        const reader = new BufReader(conn);
        const writer = new BufWriter(conn);
        while(!this.#closing){
            let request;
            try {
                request = await readRequest(conn, reader);
            } catch (error) {
                if (error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof) {
                    try {
                        await writeResponse(writer, {
                            status: 400,
                            body: new TextEncoder().encode(`${error.message}\r\n\r\n`)
                        });
                    } catch  {
                    }
                }
                break;
            }
            if (request === null) {
                break;
            }
            request.w = writer;
            yield request;
            const responseError = await request.done;
            if (responseError) {
                this.untrackConnection(request.conn);
                return;
            }
            try {
                await request.finalize();
            } catch  {
                break;
            }
        }
        this.untrackConnection(conn);
        try {
            conn.close();
        } catch  {
        }
    }
    trackConnection(conn) {
        this.#connections.push(conn);
    }
    untrackConnection(conn) {
        const index = this.#connections.indexOf(conn);
        if (index !== -1) {
            this.#connections.splice(index, 1);
        }
    }
    async *acceptConnAndIterateHttpRequests(mux) {
        if (this.#closing) return;
        let conn;
        try {
            conn = await this.listener.accept();
        } catch (error) {
            if (error instanceof Deno.errors.BadResource || error instanceof Deno.errors.InvalidData || error instanceof Deno.errors.UnexpectedEof || error instanceof Deno.errors.ConnectionReset) {
                return mux.add(this.acceptConnAndIterateHttpRequests(mux));
            }
            throw error;
        }
        this.trackConnection(conn);
        mux.add(this.acceptConnAndIterateHttpRequests(mux));
        yield* this.iterateHttpRequests(conn);
    }
    [Symbol.asyncIterator]() {
        const mux = new MuxAsyncIterator();
        mux.add(this.acceptConnAndIterateHttpRequests(mux));
        return mux.iterate();
    }
}
function _parseAddrFromStr(addr) {
    let url;
    try {
        const host = addr.startsWith(":") ? `0.0.0.0${addr}` : addr;
        url = new URL(`http://${host}`);
    } catch  {
        throw new TypeError("Invalid address.");
    }
    if (url.username || url.password || url.pathname != "/" || url.search || url.hash) {
        throw new TypeError("Invalid address.");
    }
    return {
        hostname: url.hostname,
        port: url.port === "" ? 80 : Number(url.port)
    };
}
function serve(addr) {
    if (typeof addr === "string") {
        addr = _parseAddrFromStr(addr);
    }
    const listener = Deno.listen(addr);
    return new Server(listener);
}
function serveTLS(options) {
    const tlsOptions = {
        ...options,
        transport: "tcp"
    };
    const listener = Deno.listenTls(tlsOptions);
    return new Server(listener);
}
function fixLength(req) {
    const contentLength = req.headers.get("Content-Length");
    if (contentLength) {
        const arrClen = contentLength.split(",");
        if (arrClen.length > 1) {
            const distinct = [
                ...new Set(arrClen.map((e)=>e.trim()
                ))
            ];
            if (distinct.length > 1) {
                throw Error("cannot contain multiple Content-Length headers");
            } else {
                req.headers.set("Content-Length", distinct[0]);
            }
        }
        const c = req.headers.get("Content-Length");
        if (req.method === "HEAD" && c && c !== "0") {
            throw Error("http: method cannot contain a Content-Length");
        }
        if (c && req.headers.has("transfer-encoding")) {
            throw new Error("http: Transfer-Encoding and Content-Length cannot be send together");
        }
    }
}
const osType = (()=>{
    if (globalThis.Deno != null) {
        return Deno.build.os;
    }
    const navigator = globalThis.navigator;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
            } else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (globalThis.Deno == null) {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno.cwd();
        } else {
            if (globalThis.Deno == null) {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno.env.get(`=${resolvedDevice}`) || Deno.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            if (globalThis.Deno == null) {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename1(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path2 = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path2;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
[
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
var Day;
(function(Day) {
    Day[Day["Sun"] = 0] = "Sun";
    Day[Day["Mon"] = 1] = "Mon";
    Day[Day["Tue"] = 2] = "Tue";
    Day[Day["Wed"] = 3] = "Wed";
    Day[Day["Thu"] = 4] = "Thu";
    Day[Day["Fri"] = 5] = "Fri";
    Day[Day["Sat"] = 6] = "Sat";
})(Day || (Day = {
}));
function toIMF(date) {
    function dtPad(v, lPad = 2) {
        return v.padStart(lPad, "0");
    }
    const d = dtPad(date.getUTCDate().toString());
    const h = dtPad(date.getUTCHours().toString());
    const min = dtPad(date.getUTCMinutes().toString());
    const s = dtPad(date.getUTCSeconds().toString());
    const y = date.getUTCFullYear();
    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec", 
    ];
    return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} ${h}:${min}:${s} GMT`;
}
const FIELD_CONTENT_REGEXP = /^(?=[\x20-\x7E]*$)[^()@<>,;:\\"\[\]?={}\s]+$/;
function toString(cookie) {
    if (!cookie.name) {
        return "";
    }
    const out = [];
    validateName(cookie.name);
    validateValue(cookie.name, cookie.value);
    out.push(`${cookie.name}=${cookie.value}`);
    if (cookie.name.startsWith("__Secure")) {
        cookie.secure = true;
    }
    if (cookie.name.startsWith("__Host")) {
        cookie.path = "/";
        cookie.secure = true;
        delete cookie.domain;
    }
    if (cookie.secure) {
        out.push("Secure");
    }
    if (cookie.httpOnly) {
        out.push("HttpOnly");
    }
    if (typeof cookie.maxAge === "number" && Number.isInteger(cookie.maxAge)) {
        assert(cookie.maxAge > 0, "Max-Age must be an integer superior to 0");
        out.push(`Max-Age=${cookie.maxAge}`);
    }
    if (cookie.domain) {
        out.push(`Domain=${cookie.domain}`);
    }
    if (cookie.sameSite) {
        out.push(`SameSite=${cookie.sameSite}`);
    }
    if (cookie.path) {
        validatePath(cookie.path);
        out.push(`Path=${cookie.path}`);
    }
    if (cookie.expires) {
        const dateString = toIMF(cookie.expires);
        out.push(`Expires=${dateString}`);
    }
    if (cookie.unparsed) {
        out.push(cookie.unparsed.join("; "));
    }
    return out.join("; ");
}
function validateName(name) {
    if (name && !FIELD_CONTENT_REGEXP.test(name)) {
        throw new TypeError(`Invalid cookie name: "${name}".`);
    }
}
function validatePath(path) {
    if (path == null) {
        return;
    }
    for(let i = 0; i < path.length; i++){
        const c = path.charAt(i);
        if (c < String.fromCharCode(32) || c > String.fromCharCode(126) || c == ";") {
            throw new Error(path + ": Invalid cookie path char '" + c + "'");
        }
    }
}
function validateValue(name, value) {
    if (value == null || name == null) return;
    for(let i = 0; i < value.length; i++){
        const c = value.charAt(i);
        if (c < String.fromCharCode(33) || c == String.fromCharCode(34) || c == String.fromCharCode(44) || c == String.fromCharCode(59) || c == String.fromCharCode(92) || c == String.fromCharCode(127)) {
            throw new Error("RFC2616 cookie '" + name + "' cannot have '" + c + "' as value");
        }
        if (c > String.fromCharCode(128)) {
            throw new Error("RFC2616 cookie '" + name + "' can only have US-ASCII chars as value" + c.charCodeAt(0).toString(16));
        }
    }
}
function getCookies(req) {
    const cookie = req.headers.get("Cookie");
    if (cookie != null) {
        const out = {
        };
        const c = cookie.split(";");
        for (const kv of c){
            const [cookieKey, ...cookieVal] = kv.split("=");
            assert(cookieKey != null);
            const key = cookieKey.trim();
            out[key] = cookieVal.join("=");
        }
        return out;
    }
    return {
    };
}
function setCookie(res, cookie) {
    if (!res.headers) {
        res.headers = new Headers();
    }
    const v = toString(cookie);
    if (v) {
        res.headers.append("Set-Cookie", v);
    }
}
const DEFAULT_BUFFER_SIZE1 = 32 * 1024;
async function copyN(r, dest, size) {
    let bytesRead = 0;
    let buf = new Uint8Array(DEFAULT_BUFFER_SIZE1);
    while(bytesRead < size){
        if (size - bytesRead < DEFAULT_BUFFER_SIZE1) {
            buf = new Uint8Array(size - bytesRead);
        }
        const result = await r.read(buf);
        const nread = result ?? 0;
        bytesRead += nread;
        if (nread > 0) {
            let n = 0;
            while(n < nread){
                n += await dest.write(buf.slice(n, nread));
            }
            assert(n === nread, "could not write");
        }
        if (result === null) {
            break;
        }
    }
    return bytesRead;
}
BigInt(Number.MAX_SAFE_INTEGER);
class MultiReader {
    readers;
    currentIndex = 0;
    constructor(...readers){
        this.readers = readers;
    }
    async read(p) {
        const r = this.readers[this.currentIndex];
        if (!r) return null;
        const result = await r.read(p);
        if (result === null) {
            this.currentIndex++;
            return 0;
        }
        return result;
    }
}
const encoder1 = new TextEncoder();
function matchAfterPrefix(buf, prefix, eof) {
    if (buf.length === prefix.length) {
        return eof ? 1 : 0;
    }
    const c = buf[prefix.length];
    if (c === " ".charCodeAt(0) || c === "\t".charCodeAt(0) || c === "\r".charCodeAt(0) || c === "\n".charCodeAt(0) || c === "-".charCodeAt(0)) {
        return 1;
    }
    return -1;
}
function scanUntilBoundary(buf, dashBoundary, newLineDashBoundary, total, eof) {
    if (total === 0) {
        if (startsWith(buf, dashBoundary)) {
            switch(matchAfterPrefix(buf, dashBoundary, eof)){
                case -1:
                    return dashBoundary.length;
                case 0:
                    return 0;
                case 1:
                    return null;
            }
        }
        if (startsWith(dashBoundary, buf)) {
            return 0;
        }
    }
    const i = indexOf(buf, newLineDashBoundary);
    if (i >= 0) {
        switch(matchAfterPrefix(buf.slice(i), newLineDashBoundary, eof)){
            case -1:
                return i + newLineDashBoundary.length;
            case 0:
                return i;
            case 1:
                return i > 0 ? i : null;
        }
    }
    if (startsWith(newLineDashBoundary, buf)) {
        return 0;
    }
    const j = lastIndexOf(buf, newLineDashBoundary.slice(0, 1));
    if (j >= 0 && startsWith(newLineDashBoundary, buf.slice(j))) {
        return j;
    }
    return buf.length;
}
class PartReader {
    mr;
    headers;
    n = 0;
    total = 0;
    constructor(mr, headers){
        this.mr = mr;
        this.headers = headers;
    }
    async read(p) {
        const br = this.mr.bufReader;
        let peekLength = 1;
        while(this.n === 0){
            peekLength = Math.max(peekLength, br.buffered());
            const peekBuf = await br.peek(peekLength);
            if (peekBuf === null) {
                throw new Deno.errors.UnexpectedEof();
            }
            const eof = peekBuf.length < peekLength;
            this.n = scanUntilBoundary(peekBuf, this.mr.dashBoundary, this.mr.newLineDashBoundary, this.total, eof);
            if (this.n === 0) {
                assert(eof === false);
                peekLength++;
            }
        }
        if (this.n === null) {
            return null;
        }
        const nread = Math.min(p.length, this.n);
        const buf = p.subarray(0, nread);
        const r = await br.readFull(buf);
        assert(r === buf);
        this.n -= nread;
        this.total += nread;
        return nread;
    }
    close() {
    }
    contentDisposition;
    contentDispositionParams;
    getContentDispositionParams() {
        if (this.contentDispositionParams) return this.contentDispositionParams;
        const cd = this.headers.get("content-disposition");
        const params = {
        };
        assert(cd != null, "content-disposition must be set");
        const comps = decodeURI(cd).split(";");
        this.contentDisposition = comps[0];
        comps.slice(1).map((v)=>v.trim()
        ).map((kv)=>{
            const [k, v] = kv.split("=");
            if (v) {
                const s = v.charAt(0);
                const e = v.charAt(v.length - 1);
                if (s === e && s === '"' || s === "'") {
                    params[k] = v.substr(1, v.length - 2);
                } else {
                    params[k] = v;
                }
            }
        });
        return this.contentDispositionParams = params;
    }
    get fileName() {
        return this.getContentDispositionParams()["filename"];
    }
    get formName() {
        const p = this.getContentDispositionParams();
        if (this.contentDisposition === "form-data") {
            return p["name"];
        }
        return "";
    }
}
function skipLWSPChar(u) {
    const ret = new Uint8Array(u.length);
    const sp = " ".charCodeAt(0);
    const ht = "\t".charCodeAt(0);
    let j = 0;
    for(let i = 0; i < u.length; i++){
        if (u[i] === sp || u[i] === ht) continue;
        ret[j++] = u[i];
    }
    return ret.slice(0, j);
}
class MultipartReader {
    boundary;
    newLine;
    newLineDashBoundary;
    dashBoundaryDash;
    dashBoundary;
    bufReader;
    constructor(reader, boundary){
        this.boundary = boundary;
        this.newLine = encoder1.encode("\r\n");
        this.newLineDashBoundary = encoder1.encode(`\r\n--${boundary}`);
        this.dashBoundaryDash = encoder1.encode(`--${this.boundary}--`);
        this.dashBoundary = encoder1.encode(`--${this.boundary}`);
        this.bufReader = new BufReader(reader);
    }
    async readForm(maxMemoryOrOptions) {
        const options = typeof maxMemoryOrOptions === "number" ? {
            maxMemory: maxMemoryOrOptions
        } : maxMemoryOrOptions;
        let maxMemory = options?.maxMemory ?? 10 << 20;
        const fileMap = new Map();
        const valueMap = new Map();
        let maxValueBytes = maxMemory + (10 << 20);
        const buf = new Buffer(new Uint8Array(maxValueBytes));
        for(;;){
            const p = await this.nextPart();
            if (p === null) {
                break;
            }
            if (p.formName === "") {
                continue;
            }
            buf.reset();
            if (!p.fileName) {
                const n = await copyN(p, buf, maxValueBytes);
                maxValueBytes -= n;
                if (maxValueBytes < 0) {
                    throw new RangeError("message too large");
                }
                const value = new TextDecoder().decode(buf.bytes());
                valueMap.set(p.formName, value);
                continue;
            }
            let formFile;
            const n = await copyN(p, buf, maxValueBytes);
            const contentType = p.headers.get("content-type");
            assert(contentType != null, "content-type must be set");
            if (n > maxMemory) {
                const ext = extname2(p.fileName);
                const filepath = await Deno.makeTempFile({
                    dir: options?.dir ?? ".",
                    prefix: options?.prefix ?? "multipart-",
                    suffix: options?.suffix ?? ext
                });
                const file = await Deno.open(filepath, {
                    write: true
                });
                try {
                    const size = await Deno.copy(new MultiReader(buf, p), file);
                    file.close();
                    formFile = {
                        filename: p.fileName,
                        type: contentType,
                        tempfile: filepath,
                        size
                    };
                } catch (e) {
                    await Deno.remove(filepath);
                    throw e;
                }
            } else {
                formFile = {
                    filename: p.fileName,
                    type: contentType,
                    content: buf.bytes(),
                    size: buf.length
                };
                maxMemory -= n;
                maxValueBytes -= n;
            }
            if (formFile) {
                const mapVal = fileMap.get(p.formName);
                if (mapVal !== undefined) {
                    if (Array.isArray(mapVal)) {
                        mapVal.push(formFile);
                    } else {
                        fileMap.set(p.formName, [
                            mapVal,
                            formFile
                        ]);
                    }
                } else {
                    fileMap.set(p.formName, formFile);
                }
            }
        }
        return multipartFormData(fileMap, valueMap);
    }
    currentPart;
    partsRead = 0;
    async nextPart() {
        if (this.currentPart) {
            this.currentPart.close();
        }
        if (equals(this.dashBoundary, encoder1.encode("--"))) {
            throw new Error("boundary is empty");
        }
        let expectNewPart = false;
        for(;;){
            const line = await this.bufReader.readSlice("\n".charCodeAt(0));
            if (line === null) {
                throw new Deno.errors.UnexpectedEof();
            }
            if (this.isBoundaryDelimiterLine(line)) {
                this.partsRead++;
                const r = new TextProtoReader(this.bufReader);
                const headers = await r.readMIMEHeader();
                if (headers === null) {
                    throw new Deno.errors.UnexpectedEof();
                }
                const np = new PartReader(this, headers);
                this.currentPart = np;
                return np;
            }
            if (this.isFinalBoundary(line)) {
                return null;
            }
            if (expectNewPart) {
                throw new Error(`expecting a new Part; got line ${line}`);
            }
            if (this.partsRead === 0) {
                continue;
            }
            if (equals(line, this.newLine)) {
                expectNewPart = true;
                continue;
            }
            throw new Error(`unexpected line in nextPart(): ${line}`);
        }
    }
    isFinalBoundary(line) {
        if (!startsWith(line, this.dashBoundaryDash)) {
            return false;
        }
        const rest = line.slice(this.dashBoundaryDash.length, line.length);
        return rest.length === 0 || equals(skipLWSPChar(rest), this.newLine);
    }
    isBoundaryDelimiterLine(line) {
        if (!startsWith(line, this.dashBoundary)) {
            return false;
        }
        const rest = line.slice(this.dashBoundary.length);
        return equals(skipLWSPChar(rest), this.newLine);
    }
}
function multipartFormData(fileMap, valueMap) {
    function file(key) {
        return fileMap.get(key);
    }
    function value(key) {
        return valueMap.get(key);
    }
    function* entries() {
        yield* fileMap;
        yield* valueMap;
    }
    async function removeAll() {
        const promises = [];
        for (const val of fileMap.values()){
            if (Array.isArray(val)) {
                for (const subVal of val){
                    if (!subVal.tempfile) continue;
                    promises.push(Deno.remove(subVal.tempfile));
                }
            } else {
                if (!val.tempfile) continue;
                promises.push(Deno.remove(val.tempfile));
            }
        }
        await Promise.all(promises);
    }
    return {
        file,
        value,
        entries,
        removeAll,
        [Symbol.iterator] () {
            return entries();
        }
    };
}
const Get = "GET", Head = "HEAD", Post = "POST", Put = "PUT", Patch = "PATCH", Delete = "DELETE", Connect = "CONNECT", Options = "OPTIONS", Trace = "TRACE";
const mod2 = {
    Get: Get,
    Head: Head,
    Post: Post,
    Put: Put,
    Patch: Patch,
    Delete: Delete,
    Connect: Connect,
    Options: Options,
    Trace: Trace
};
const Accept = "Accept", AcceptEncoding = "Accept-Encoding", Allow = "Allow", Authorization = "Authorization", ContentDisposition = "Content-Disposition", ContentEncoding = "Content-Encoding", ContentLength = "Content-Length", ContentType = "Content-Type", Cookie = "Cookie", SetCookie = "Set-Cookie", IfModifiedSince = "If-Modified-Since", LastModified = "Last-Modified", Location = "Location", Upgrade = "Upgrade", Vary = "Vary", WWWAuthenticate = "WWW-Authenticate", XForwardedFor = "X-Forwarded-For", XForwardedProto = "X-Forwarded-Proto", XForwardedProtocol = "X-Forwarded-Protocol", XForwardedSsl = "X-Forwarded-Ssl", XUrlScheme = "X-Url-Scheme", XHTTPMethodOverride = "X-HTTP-Method-Override", XRealIP = "X-Real-IP", XRequestID = "X-Request-ID", XRequestedWith = "X-Requested-With", Server1 = "Server", Origin = "Origin", AccessControlRequestMethod = "Access-Control-Request-Method", AccessControlRequestHeaders = "Access-Control-Request-Headers", AccessControlAllowOrigin = "Access-Control-Allow-Origin", AccessControlAllowMethods = "Access-Control-Allow-Methods", AccessControlAllowHeaders = "Access-Control-Allow-Headers", AccessControlAllowCredentials = "Access-Control-Allow-Credentials", AccessControlExposeHeaders = "Access-Control-Expose-Headers", AccessControlMaxAge = "Access-Control-Max-Age", StrictTransportSecurity = "Strict-Transport-Security", XContentTypeOptions = "X-Content-Type-Options", XXSSProtection = "X-XSS-Protection", XFrameOptions = "X-Frame-Options", ContentSecurityPolicy = "Content-Security-Policy", ContentSecurityPolicyReportOnly = "Content-Security-Policy-Report-Only", XCSRFToken = "X-CSRF-Token", ReferrerPolicy = "Referrer-Policy";
const mod3 = {
    Accept: Accept,
    AcceptEncoding: AcceptEncoding,
    Allow: Allow,
    Authorization: Authorization,
    ContentDisposition: ContentDisposition,
    ContentEncoding: ContentEncoding,
    ContentLength: ContentLength,
    ContentType: ContentType,
    Cookie: Cookie,
    SetCookie: SetCookie,
    IfModifiedSince: IfModifiedSince,
    LastModified: LastModified,
    Location: Location,
    Upgrade: Upgrade,
    Vary: Vary,
    WWWAuthenticate: WWWAuthenticate,
    XForwardedFor: XForwardedFor,
    XForwardedProto: XForwardedProto,
    XForwardedProtocol: XForwardedProtocol,
    XForwardedSsl: XForwardedSsl,
    XUrlScheme: XUrlScheme,
    XHTTPMethodOverride: XHTTPMethodOverride,
    XRealIP: XRealIP,
    XRequestID: XRequestID,
    XRequestedWith: XRequestedWith,
    Server: Server1,
    Origin: Origin,
    AccessControlRequestMethod: AccessControlRequestMethod,
    AccessControlRequestHeaders: AccessControlRequestHeaders,
    AccessControlAllowOrigin: AccessControlAllowOrigin,
    AccessControlAllowMethods: AccessControlAllowMethods,
    AccessControlAllowHeaders: AccessControlAllowHeaders,
    AccessControlAllowCredentials: AccessControlAllowCredentials,
    AccessControlExposeHeaders: AccessControlExposeHeaders,
    AccessControlMaxAge: AccessControlMaxAge,
    StrictTransportSecurity: StrictTransportSecurity,
    XContentTypeOptions: XContentTypeOptions,
    XXSSProtection: XXSSProtection,
    XFrameOptions: XFrameOptions,
    ContentSecurityPolicy: ContentSecurityPolicy,
    ContentSecurityPolicyReportOnly: ContentSecurityPolicyReportOnly,
    XCSRFToken: XCSRFToken,
    ReferrerPolicy: ReferrerPolicy
};
const charsetUTF8 = "charset=UTF-8";
const ApplicationGZip = "application/gzip", ApplicationJSON = "application/json", ApplicationJSONCharsetUTF8 = ApplicationJSON + "; " + charsetUTF8, ApplicationJavaScript = "application/javascript", ApplicationJavaScriptCharsetUTF8 = ApplicationJavaScript + "; " + charsetUTF8, ApplicationXML = "application/xml", ApplicationXMLCharsetUTF8 = ApplicationXML + "; " + charsetUTF8, TextMarkdown = "text/markdown", TextMarkdownCharsetUTF8 = TextMarkdown + "; " + charsetUTF8, TextXML = "text/xml", TextXMLCharsetUTF8 = TextXML + "; " + charsetUTF8, ApplicationForm = "application/x-www-form-urlencoded", ApplicationProtobuf = "application/protobuf", ApplicationMsgpack = "application/msgpack", TextHTML = "text/html", TextHTMLCharsetUTF8 = TextHTML + "; " + charsetUTF8, TextPlain = "text/plain", TextPlainCharsetUTF8 = TextPlain + "; " + charsetUTF8, TextCSS = "text/css", TextCSSCharsetUTF8 = TextCSS + "; " + charsetUTF8, MultipartForm = "multipart/form-data", OctetStream = "application/octet-stream", ImageSVG = "image/svg+xml", ImageXIcon = "image/x-icon", ApplicationWASM = "application/wasm";
const DB = {
    ".md": TextMarkdownCharsetUTF8,
    ".html": TextHTMLCharsetUTF8,
    ".htm": TextHTMLCharsetUTF8,
    ".json": ApplicationJSON,
    ".map": ApplicationJSON,
    ".txt": TextPlainCharsetUTF8,
    ".ts": ApplicationJavaScriptCharsetUTF8,
    ".tsx": ApplicationJavaScriptCharsetUTF8,
    ".js": ApplicationJavaScriptCharsetUTF8,
    ".jsx": ApplicationJavaScriptCharsetUTF8,
    ".gz": ApplicationGZip,
    ".svg": ImageSVG,
    ".wasm": ApplicationWASM,
    ".mjs": ApplicationJavaScriptCharsetUTF8,
    ".css": TextCSSCharsetUTF8,
    ".ico": ImageXIcon
};
const mod4 = {
    ApplicationGZip: ApplicationGZip,
    ApplicationJSON: ApplicationJSON,
    ApplicationJSONCharsetUTF8: ApplicationJSONCharsetUTF8,
    ApplicationJavaScript: ApplicationJavaScript,
    ApplicationJavaScriptCharsetUTF8: ApplicationJavaScriptCharsetUTF8,
    ApplicationXML: ApplicationXML,
    ApplicationXMLCharsetUTF8: ApplicationXMLCharsetUTF8,
    TextMarkdown: TextMarkdown,
    TextMarkdownCharsetUTF8: TextMarkdownCharsetUTF8,
    TextXML: TextXML,
    TextXMLCharsetUTF8: TextXMLCharsetUTF8,
    ApplicationForm: ApplicationForm,
    ApplicationProtobuf: ApplicationProtobuf,
    ApplicationMsgpack: ApplicationMsgpack,
    TextHTML: TextHTML,
    TextHTMLCharsetUTF8: TextHTMLCharsetUTF8,
    TextPlain: TextPlain,
    TextPlainCharsetUTF8: TextPlainCharsetUTF8,
    TextCSS: TextCSS,
    TextCSSCharsetUTF8: TextCSSCharsetUTF8,
    MultipartForm: MultipartForm,
    OctetStream: OctetStream,
    ImageSVG: ImageSVG,
    ImageXIcon: ImageXIcon,
    ApplicationWASM: ApplicationWASM,
    DB: DB
};
function createHttpExceptionBody(msgOrBody, error, statusCode) {
    if (typeof msgOrBody === "object" && !Array.isArray(msgOrBody)) {
        return msgOrBody;
    } else if (typeof msgOrBody === "string") {
        return {
            statusCode,
            error,
            message: msgOrBody
        };
    }
    return {
        statusCode,
        error
    };
}
class HttpException extends Error {
    response;
    status;
    message;
    constructor(response, status){
        super();
        this.response = response;
        this.status = status;
        this.message = response;
    }
}
class NotFoundException extends HttpException {
    constructor(message, error = "Not Found"){
        super(createHttpExceptionBody(message, error, Status.NotFound), Status.NotFound);
    }
}
class InternalServerErrorException extends HttpException {
    constructor(message, error = "Internal Server Error"){
        super(createHttpExceptionBody(message, error, Status.InternalServerError), Status.InternalServerError);
    }
}
function contentType(filepath) {
    return mod4.DB[extname2(filepath)];
}
function hasTrailingSlash(str) {
    if (str.length > 1 && str[str.length - 1] === "/") {
        return true;
    }
    return false;
}
function NotFoundHandler() {
    throw new NotFoundException();
}
const { cwd , readFile , readAll  } = Deno;
const encoder2 = new TextEncoder();
const decoder1 = new TextDecoder();
class Context {
    app;
    request;
    url;
    response = {
        headers: new Headers()
    };
    params = {
    };
    customContext;
    #store;
    #body;
    get cookies() {
        return getCookies(this.request);
    }
    get path() {
        return this.url.pathname;
    }
    get method() {
        return this.request.method;
    }
    get queryParams() {
        const params = {
        };
        for (const [k, v] of this.url.searchParams){
            params[k] = v;
        }
        return params;
    }
    get body() {
        return this.#body ?? (this.#body = this.#readBody());
    }
    get(key) {
        return this.#store?.get(key);
    }
    set(key, val) {
        if (this.#store === undefined) {
            this.#store = new Map();
        }
        this.#store.set(key, val);
    }
    constructor(optionsOrContext){
        if (optionsOrContext instanceof Context) {
            Object.assign(this, optionsOrContext);
            this.customContext = this;
            return;
        }
        const opts = optionsOrContext;
        this.app = opts.app;
        this.request = opts.r;
        this.url = new URL(this.request.url, `http://0.0.0.0`);
    }
    #writeContentType = (v)=>{
        if (!this.response.headers.has(mod3.ContentType)) {
            this.response.headers.set(mod3.ContentType, v);
        }
    };
    #readBody = async ()=>{
        const contentType = this.request.headers.get(mod3.ContentType);
        walk: {
            let data = {
            };
            if (contentType) {
                if (contentType.includes(mod4.ApplicationJSON)) {
                    data = JSON.parse(decoder1.decode(await readAll(this.request.body)));
                } else if (contentType.includes(mod4.ApplicationForm)) {
                    for (const [k, v] of new URLSearchParams(decoder1.decode(await readAll(this.request.body)))){
                        data[k] = v;
                    }
                } else if (contentType.includes(mod4.MultipartForm)) {
                    const match = contentType.match(/boundary=([^\s]+)/);
                    const boundary = match ? match[1] : undefined;
                    if (boundary) {
                        const mr = new MultipartReader(this.request.body, boundary);
                        const form = await mr.readForm();
                        for (const [k, v] of form.entries()){
                            data[k] = v;
                        }
                    }
                } else {
                    break walk;
                }
            } else {
                break walk;
            }
            return data;
        }
        return decoder1.decode(await readAll(this.request.body));
    };
    string(v, code = Status.OK) {
        this.#writeContentType(mod4.TextPlainCharsetUTF8);
        this.response.status = code;
        this.response.body = encoder2.encode(v);
    }
    json(v, code = Status.OK) {
        this.#writeContentType(mod4.ApplicationJSONCharsetUTF8);
        this.response.status = code;
        this.response.body = encoder2.encode(typeof v === "object" ? JSON.stringify(v) : v);
    }
    html(v, code = Status.OK) {
        this.#writeContentType(mod4.TextHTMLCharsetUTF8);
        this.response.status = code;
        this.response.body = encoder2.encode(v);
    }
    htmlBlob(b, code = Status.OK) {
        this.blob(b, mod4.TextHTMLCharsetUTF8, code);
    }
    async render(name, data = {
    }, code = Status.OK) {
        if (!this.app.renderer) {
            throw new Error();
        }
        const r = await this.app.renderer.render(name, data);
        this.htmlBlob(r, code);
    }
    blob(b, contentType, code = Status.OK) {
        if (contentType) {
            this.#writeContentType(contentType);
        }
        this.response.status = code;
        this.response.body = b;
    }
    async file(filepath) {
        filepath = join3(cwd(), filepath);
        try {
            this.blob(await readFile(filepath), contentType(filepath));
        } catch  {
            NotFoundHandler();
        }
    }
    setCookie(c) {
        setCookie(this.response, c);
    }
    redirect(url, code = Status.Found) {
        this.response.headers.set(mod3.Location, url);
        this.response.status = code;
    }
}
class Node {
    children = new Map();
    path = "";
    func;
    constructor(node){
        if (node) {
            Object.assign(this, node);
        }
    }
    add(path, func) {
        let n = this;
        let i = 0;
        for(; i < path.length && !isWildcard(path[i]); ++i);
        n = n.#merge(path.slice(0, i));
        let j = i;
        for(; i < path.length; ++i){
            if (isWildcard(path[i])) {
                if (j !== i) {
                    n = n.#insert(path.slice(j, i));
                    j = i;
                }
                ++i;
                for(; i < path.length && path[i] !== "/"; ++i){
                    if (isWildcard(path[i])) {
                        throw new Error(`only one wildcard per path segment is allowed, has: "${path.slice(j, i)}" in path "${path}"`);
                    }
                }
                if (path[j] === ":" && i - j === 1) {
                    throw new Error(`param must be named with a non-empty name in path "${path}"`);
                }
                n = n.#insert(path.slice(j, i));
                j = i;
            }
        }
        if (j === path.length) {
            n.#merge("", func);
        } else {
            n.#insert(path.slice(j), func);
        }
    }
    find(path) {
        let func;
        let params = new Map();
        const stack = [
            [
                this,
                path,
                false
            ], 
        ];
        for(let i = 0; i >= 0;){
            const [n, p, v] = stack[i];
            let np;
            if (v) {
                --i;
                if (n.path[0] === ":") {
                    params.delete(n.path.slice(1));
                }
                continue;
            } else {
                stack[i][2] = true;
            }
            if (n.path[0] === "*") {
                if (n.path.length > 1) {
                    params.set(n.path.slice(1), p);
                }
                np = undefined;
            } else if (n.path[0] === ":") {
                const [_cp, _np] = splitFromFirstSlash(p);
                params.set(n.path.slice(1), _cp);
                np = _np === "" ? undefined : _np;
            } else if (n.path === p) {
                if (n.func === undefined) {
                    if (n.children.has("*")) {
                        np = "";
                    } else {
                        --i;
                        continue;
                    }
                } else {
                    np = undefined;
                }
            } else {
                const lcp = longestCommonPrefix(n.path, p);
                if (lcp !== n.path.length) {
                    --i;
                    continue;
                } else {
                    np = p.slice(lcp);
                }
            }
            if (np === undefined) {
                func = n.func;
                break;
            }
            let c = n.children.get("*");
            if (c) {
                stack[++i] = [
                    c,
                    np,
                    false
                ];
            }
            if (np === "") {
                continue;
            }
            c = n.children.get(":");
            if (c) {
                stack[++i] = [
                    c,
                    np,
                    false
                ];
            }
            c = n.children.get(np[0]);
            if (c) {
                stack[++i] = [
                    c,
                    np,
                    false
                ];
            }
        }
        return [
            func,
            params
        ];
    }
    #merge = (path, func)=>{
        let n = this;
        if (n.path === "" && n.children.size === 0) {
            n.path = path;
            n.func = func;
            return n;
        }
        if (path === "") {
            if (n.func) {
                throw new Error(`a function is already registered for path "${n.path}"`);
            }
            n.func = func;
            return n;
        }
        for(;;){
            const i = longestCommonPrefix(path, n.path);
            if (i < n.path.length) {
                const c = new Node({
                    path: n.path.slice(i),
                    children: n.children,
                    func: n.func
                });
                n.children = new Map([
                    [
                        c.path[0],
                        c
                    ]
                ]);
                n.path = path.slice(0, i);
                n.func = undefined;
            }
            if (i < path.length) {
                path = path.slice(i);
                let c = n.children.get(path[0]);
                if (c) {
                    n = c;
                    continue;
                }
                c = new Node({
                    path,
                    func
                });
                n.children.set(path[0], c);
                n = c;
            } else if (func) {
                if (n.func) {
                    throw new Error(`a function is already registered for path "${path}"`);
                }
                n.func = func;
            }
            break;
        }
        return n;
    };
    #insert = (path, func)=>{
        let n = this;
        let c = n.children.get(path[0]);
        if (c) {
            n = c.#merge(path, func);
        } else {
            c = new Node({
                path,
                func
            });
            n.children.set(path[0], c);
            n = c;
        }
        return n;
    };
}
function longestCommonPrefix(a, b) {
    let i = 0;
    let len = Math.min(a.length, b.length);
    for(; i < len && a[i] === b[i]; ++i);
    return i;
}
function splitFromFirstSlash(path) {
    let i = 0;
    for(; i < path.length && path[i] !== "/"; ++i);
    return [
        path.slice(0, i),
        path.slice(i)
    ];
}
function isWildcard(c) {
    assert1(c.length === 1);
    return c === ":" || c === "*";
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
class AssertionError extends Error {
    constructor(message){
        super(message);
        this.name = "AssertionError";
    }
}
class Router {
    trees = {
    };
    add(method, path, h) {
        if (path[0] !== "/") {
            path = `/${path}`;
        }
        if (hasTrailingSlash(path)) {
            path = path.slice(0, path.length - 1);
        }
        let root = this.trees[method];
        if (!root) {
            root = new Node();
            this.trees[method] = root;
        }
        root.add(path, h);
    }
    find(method, c) {
        const node = this.trees[method];
        let path = c.path;
        if (hasTrailingSlash(path)) {
            path = path.slice(0, path.length - 1);
        }
        let h;
        if (node) {
            const [handle, params] = node.find(path);
            if (params) {
                for (const [k, v] of params){
                    c.params[k] = v;
                }
            }
            if (handle) {
                h = handle;
            }
        }
        return h ?? NotFoundHandler;
    }
}
class Group {
    prefix;
    middleware;
    app;
    #willBeAdded;
    constructor(opts){
        this.prefix = opts.prefix || "";
        this.app = opts.app || {
        };
        this.middleware = [];
        this.#willBeAdded = [];
    }
    use(...m) {
        this.middleware.push(...m);
        return this;
    }
    connect(path, h, ...m) {
        this.#willBeAdded.push([
            "CONNECT",
            path,
            h,
            m
        ]);
        return this;
    }
    delete(path, h, ...m) {
        this.#willBeAdded.push([
            "DELETE",
            path,
            h,
            m
        ]);
        return this;
    }
    get(path, h, ...m) {
        this.#willBeAdded.push([
            "GET",
            path,
            h,
            m
        ]);
        return this;
    }
    head(path, h, ...m) {
        this.#willBeAdded.push([
            "HEAD",
            path,
            h,
            m
        ]);
        return this;
    }
    options(path, h, ...m) {
        this.#willBeAdded.push([
            "OPTIONS",
            path,
            h,
            m
        ]);
        return this;
    }
    patch(path, h, ...m) {
        this.#willBeAdded.push([
            "PATCH",
            path,
            h,
            m
        ]);
        return this;
    }
    post(path, h, ...m) {
        this.#willBeAdded.push([
            "POST",
            path,
            h,
            m
        ]);
        return this;
    }
    put(path, h, ...m) {
        this.#willBeAdded.push([
            "PUT",
            path,
            h,
            m
        ]);
        return this;
    }
    trace(path, h, ...m) {
        this.#willBeAdded.push([
            "TRACE",
            path,
            h,
            m
        ]);
        return this;
    }
    any(path, h, ...m) {
        const methods = [
            "CONNECT",
            "DELETE",
            "GET",
            "HEAD",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT",
            "TRACE", 
        ];
        for (const method of methods){
            this.#willBeAdded.push([
                method,
                path,
                h,
                m
            ]);
        }
        return this;
    }
    match(methods, path, h, ...m) {
        for (const method of methods){
            this.#willBeAdded.push([
                method,
                path,
                h,
                m
            ]);
        }
        return this;
    }
    add(method, path, handler, ...middleware) {
        this.#willBeAdded.push([
            method,
            path,
            handler,
            middleware
        ]);
        return this;
    }
    static(prefix, root) {
        this.app.static(join3(this.prefix, prefix), root);
        return this;
    }
    file(p, filepath, ...m) {
        this.app.file(join3(this.prefix, p), filepath, ...m);
        return this;
    }
    group(prefix, ...m) {
        const g = this.app.group(this.prefix + prefix, ...this.middleware, ...m);
        return g;
    }
    θapplyMiddleware() {
        for (const [method, path, handler, middleware] of this.#willBeAdded){
            this.app.add(method, this.prefix + path, handler, ...this.middleware, ...middleware);
        }
        this.#willBeAdded = [];
    }
}
class Application {
    server;
    renderer;
    router = new Router();
    middleware = [];
    premiddleware = [];
    #process;
    #groups = [];
    get θprocess() {
        console.warn(yellow("`Application#θprocess` is UNSTABLE!"));
        return this.#process;
    }
    #start = async (s)=>{
        this.server = s;
        for await (const req of this.server){
            const c = new Context({
                r: req,
                app: this
            });
            let h;
            for (const i of this.#groups){
                i.θapplyMiddleware();
            }
            if (this.premiddleware.length === 0) {
                h = this.router.find(req.method, c);
                h = this.#applyMiddleware(h, ...this.middleware);
            } else {
                h = (c)=>{
                    h = this.router.find(req.method, c);
                    h = this.#applyMiddleware(h, ...this.middleware);
                    return h(c);
                };
                h = this.#applyMiddleware(h, ...this.premiddleware);
            }
            this.#transformResult(c, h).then(()=>{
                req.respond(c.response).catch(()=>{
                });
            });
        }
    };
    #applyMiddleware = (h, ...m)=>{
        for(let i = m.length - 1; i >= 0; --i){
            h = m[i](h);
        }
        return h;
    };
    start(sc) {
        this.#process = this.#start(serve(sc));
    }
    startTLS(sc) {
        this.#process = this.#start(serveTLS(sc));
    }
    async close() {
        if (this.server) {
            this.server.close();
        }
        await this.#process;
    }
    pre(...m) {
        this.premiddleware.push(...m);
        return this;
    }
    use(...m) {
        this.middleware.push(...m);
        return this;
    }
    connect(path, h, ...m) {
        return this.add("CONNECT", path, h, ...m);
    }
    delete(path, h, ...m) {
        return this.add("DELETE", path, h, ...m);
    }
    get(path, h, ...m) {
        return this.add("GET", path, h, ...m);
    }
    head(path, h, ...m) {
        return this.add("HEAD", path, h, ...m);
    }
    options(path, h, ...m) {
        return this.add("OPTIONS", path, h, ...m);
    }
    patch(path, h, ...m) {
        return this.add("PATCH", path, h, ...m);
    }
    post(path, h, ...m) {
        return this.add("POST", path, h, ...m);
    }
    put(path, h, ...m) {
        return this.add("PUT", path, h, ...m);
    }
    trace(path, h, ...m) {
        return this.add("TRACE", path, h, ...m);
    }
    any(path, h, ...m) {
        const methods = [
            "CONNECT",
            "DELETE",
            "GET",
            "HEAD",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT",
            "TRACE", 
        ];
        for (const method of methods){
            this.add(method, path, h, ...m);
        }
        return this;
    }
    match(methods, path, h, ...m) {
        for (const method of methods){
            this.add(method, path, h, ...m);
        }
        return this;
    }
    add(method, path, handler, ...middleware) {
        this.router.add(method, path, (c)=>{
            let h = handler;
            for (const m of middleware){
                h = m(h);
            }
            return h(c);
        });
        return this;
    }
    group(prefix, ...m) {
        const g = new Group({
            app: this,
            prefix
        });
        this.#groups.push(g);
        g.use(...m);
        return g;
    }
    static(prefix, root, ...m) {
        if (prefix[prefix.length - 1] === "/") {
            prefix = prefix.slice(0, prefix.length - 1);
        }
        const h = (c)=>{
            const filepath = c.path.substr(prefix.length);
            return c.file(join3(root, filepath));
        };
        return this.get(`${prefix}/*`, h, ...m);
    }
    file(path, filepath, ...m) {
        return this.get(path, (c)=>c.file(filepath)
        , ...m);
    }
    #transformResult = async (c, h)=>{
        let result;
        try {
            result = await h(c);
        } catch (e) {
            if (e instanceof HttpException) {
                result = c.json(typeof e.response === "object" ? e.response : createHttpExceptionBody(e.response, undefined, e.status), e.status);
            } else {
                e = new InternalServerErrorException(e.message);
                result = c.json(e.response, e.status);
            }
        }
        if (c.response.status == undefined) {
            switch(typeof result){
                case "object":
                    if (result instanceof Uint8Array) {
                        c.blob(result);
                    } else {
                        c.json(result);
                    }
                    break;
                case "string":
                    /^\s*</.test(result) ? c.html(result) : c.string(result);
                    break;
                default:
                    c.string(String(result));
            }
        }
    };
}
const DefaultSkipper = function() {
    return false;
};
const DefaultCORSConfig = {
    skipper: DefaultSkipper,
    allowOrigins: [
        "*"
    ],
    allowMethods: [
        mod2.Delete,
        mod2.Get,
        mod2.Head,
        mod2.Patch,
        mod2.Post,
        mod2.Put, 
    ]
};
function cors(config = DefaultCORSConfig) {
    if (config.skipper == null) {
        config.skipper = DefaultCORSConfig.skipper;
    }
    if (!config.allowOrigins || config.allowOrigins.length == 0) {
        config.allowOrigins = DefaultCORSConfig.allowOrigins;
    }
    if (!config.allowMethods || config.allowMethods.length == 0) {
        config.allowMethods = DefaultCORSConfig.allowMethods;
    }
    return function(next) {
        return (c)=>{
            if (config.skipper(c)) {
                return next(c);
            }
            const req = c.request;
            const resp = c.response;
            const origin = req.headers.get(mod3.Origin);
            if (!resp.headers) resp.headers = new Headers();
            let allowOrigin = null;
            for (const o of config.allowOrigins){
                if (o == "*" && config.allowCredentials) {
                    allowOrigin = origin;
                    break;
                }
                if (o == "*" || o == origin) {
                    allowOrigin = o;
                    break;
                }
                if (origin === null) {
                    break;
                }
                if (origin.startsWith(o)) {
                    allowOrigin = origin;
                    break;
                }
            }
            resp.headers.append(mod3.Vary, mod3.Origin);
            if (config.allowCredentials) {
                resp.headers.set(mod3.AccessControlAllowCredentials, "true");
            }
            if (req.method != mod2.Options) {
                if (allowOrigin) {
                    resp.headers.set(mod3.AccessControlAllowOrigin, allowOrigin);
                }
                if (config.exposeHeaders && config.exposeHeaders.length != 0) {
                    resp.headers.set(mod3.AccessControlExposeHeaders, config.exposeHeaders.join(","));
                }
                return next(c);
            }
            resp.headers.append(mod3.Vary, mod3.AccessControlAllowMethods);
            resp.headers.append(mod3.Vary, mod3.AccessControlAllowHeaders);
            if (allowOrigin) {
                resp.headers.set(mod3.AccessControlAllowOrigin, allowOrigin);
            }
            resp.headers.set(mod3.AccessControlAllowMethods, config.allowMethods.join(","));
            if (config.allowHeaders && config.allowHeaders.length != 0) {
                resp.headers.set(mod3.AccessControlAllowHeaders, config.allowHeaders.join(","));
            } else {
                const h = req.headers.get(mod3.AccessControlRequestHeaders);
                if (h) {
                    resp.headers.set(mod3.AccessControlRequestHeaders, h);
                }
            }
            if (config.maxAge > 0) {
                resp.headers.set(mod3.AccessControlMaxAge, String(config.maxAge));
            }
            resp.status = Status.NoContent;
        };
    };
}
class Status1 {
    constructor(serverVersion, initialized){
        this.serverVersion = serverVersion;
        this.initialized = initialized;
    }
}
class Update {
    constructor(metadata, admindata, clinicaldata){
        this.metadata = metadata;
        this.admindata = admindata;
        this.clinicaldata = clinicaldata;
    }
}
class User {
    constructor(oid, username, authenticationKey, hasInitialPassword, encryptedDecryptionKey, rights, site){
        this.oid = oid;
        this.username = username;
        this.authenticationKey = authenticationKey;
        this.hasInitialPassword = hasInitialPassword;
        this.encryptedDecryptionKey = encryptedDecryptionKey;
        this.rights = rights || [];
        this.site = site;
    }
    hasAuthorizationFor(right) {
        return this.rights && this.rights.includes(right);
    }
}
const rights = {
    PROJECTOPTIONS: "project-options",
    EDITMETADATA: "edit-metadata",
    MANAGESUBJECTS: "manage-subjects",
    VALIDATEFORMS: "validate-forms",
    ADDSUBJECTDATA: "add-subject-data"
};
let users = [];
const fileNameSeparator = "__";
const serverVersion = "0.3.0";
const authorizationMiddleware = (next, requiredAuthorization)=>(context)=>{
        const authentication = context.request.headers.get("Authorization");
        if (!authentication || !authentication.split(" ")[0] == "Basic") return noAuthentication(context);
        const basicAuthParts = atob(authentication.split(" ")[1]).split(":");
        const username = basicAuthParts[0];
        const authenticationKey = basicAuthParts[1];
        const user = users.find((user)=>user.username.toLowerCase() == username.toLowerCase()
        );
        if (!user || user.authenticationKey != authenticationKey) return badAuthentication(context);
        if (requiredAuthorization && typeof requiredAuthorization == "string") {
            if (!user.hasAuthorizationFor(requiredAuthorization)) return noAuthorization(context);
        }
        return next(context, user);
    }
;
const noAuthentication = (context)=>context.string("No authorization header present in the request.", 401)
;
const badAuthentication = (context)=>context.string("User not found or wrong password entered.", 401)
;
const noAuthorization = (context)=>context.string("Not authorized for the requested resource.", 403)
;
let directories;
const init = (instance)=>{
    const root = instance ? "./data_" + instance : "./data";
    directories = {
        ROOT: root + "/",
        METADATA: root + "/metadata/",
        ADMINDATA: root + "/admindata/",
        CLINICALDATA: root + "/clinicaldata/",
        MISC: root + "/misc/",
        ARCHIVE: root + "/archive/"
    };
    Array.from(Object.values(directories)).forEach((directory)=>{
        try {
            Deno.mkdirSync(directory);
        } catch  {
        }
    });
    lastUpdate.metadata = getFileNamesOfDirectory(directories.METADATA).reduce((lastUpdated, fileName)=>{
        const modifiedDate = getMetadataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    lastUpdate.admindata = getFileNamesOfDirectory(directories.ADMINDATA).reduce((lastUpdated, fileName)=>{
        const modifiedDate = getAdmindataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
    lastUpdate.clinicaldata = getFileNamesOfDirectory(directories.CLINICALDATA).reduce((lastUpdated, fileName)=>{
        const modifiedDate = getClinicaldataModifiedFromFileName(fileName);
        return modifiedDate > lastUpdated ? modifiedDate : lastUpdated;
    }, 0);
};
const storeJSON = (directory, fileName, data)=>{
    Deno.writeTextFileSync(directory + fileName, JSON.stringify(data, null, 2));
};
const loadJSON = (directory, fileName)=>{
    try {
        return JSON.parse(Deno.readTextFileSync(directory + fileName));
    } catch  {
    }
};
const init1 = ()=>{
    try {
        const usersJSON = loadJSON(directories.ROOT, "users");
        for (const userJSON of usersJSON){
            users.push(new User(userJSON.oid, userJSON.username, userJSON.authenticationKey, userJSON.hasInitialPassword, userJSON.encryptedDecryptionKey, userJSON.rights, userJSON.site));
        }
    } catch  {
    }
};
const getUsers = (context)=>{
    return context.json(users);
};
const getUser = (context)=>{
    const oid = context.params.oid;
    const user = users.find((user)=>user.oid == oid
    );
    if (!user) return context.string("User could not be found.", 404);
    return context.json(user, 200);
};
const getRights = (context)=>{
    return context.json(rights, 200);
};
const getMe = (context, user)=>{
    return context.json(user, 200);
};
const setMe = async (context, user)=>{
    const { username , authenticationKey , encryptedDecryptionKey  } = await context.body;
    if (!username) return context.string("Username is missing in the request body.", 400);
    if (!authenticationKey) return context.string("Password is missing in the request body.", 400);
    if (!encryptedDecryptionKey) return context.string("An encrypted decryption key is missing in the request body.", 400);
    user.username = username;
    user.authenticationKey = authenticationKey;
    user.hasInitialPassword = false;
    user.encryptedDecryptionKey = encryptedDecryptionKey;
    storeJSON(directories.ROOT, "users", users);
    return context.json(user, 201);
};
const initializeUser = async (context)=>{
    if (users.length > 0) return context.string("The server has already been initialized.", 400);
    const oid = context.params.oid;
    const { username , authenticationKey , encryptedDecryptionKey  } = await context.body;
    if (!username) return context.string("Username is missing in the request body.", 400);
    if (!authenticationKey) return context.string("Password is missing in the request body.", 400);
    if (!encryptedDecryptionKey) return context.string("An encrypted decryption key is missing in the request body.", 400);
    const user = new User(oid, username, authenticationKey, false, encryptedDecryptionKey, Object.values(rights));
    users.push(user);
    storeJSON(directories.ROOT, "users", users);
    return context.json(user, 201);
};
const setUser = async (context)=>{
    const oid = context.params.oid;
    const { username , authenticationKey , encryptedDecryptionKey , rights , site  } = await context.body;
    let user = users.find((user)=>user.oid == oid
    );
    if (user) {
        if (username && authenticationKey && encryptedDecryptionKey) {
            user.username = username;
            user.authenticationKey = authenticationKey;
            user.hasInitialPassword = true;
            user.encryptedDecryptionKey = encryptedDecryptionKey;
        }
        user.rights = rights;
        user.site = site;
    } else {
        const existingUser = users.find((user)=>user.username == username
        );
        if (username && existingUser && existingUser.oid != oid) return context.string("There exists another user with the same username.", 400);
        user = new User(oid, username, authenticationKey, true, encryptedDecryptionKey, rights, site);
        users.push(user);
    }
    storeJSON(directories.ROOT, "users", users);
    return context.json(user, 201);
};
const deleteUser = (context)=>{
    const oid = context.params.oid;
    const user = users.find((user)=>user.oid == oid
    );
    if (!user) return context.string("User could not be found.", 404);
    users = users.filter((user)=>user.oid != oid
    );
    storeJSON(directories.ROOT, "users", users);
    return context.json(user, 200);
};
const storeXML = (directory, fileName, data)=>{
    Deno.writeTextFileSync(directory + fileName, data);
};
const loadXML = (directory, fileName)=>{
    return Deno.readTextFileSync(directory + fileName);
};
const removeFile = (directory, fileName)=>{
    try {
        Deno.renameSync(directory + fileName, directories.ARCHIVE + fileName);
    } catch  {
    }
};
const fileExist = (directory, fileName)=>{
    try {
        return Deno.readTextFileSync(directory + fileName) ? true : false;
    } catch  {
    }
};
function getFileNamesOfDirectory(directory) {
    const fileNames = [];
    for (const file of Deno.readDirSync(directory)){
        fileNames.push(file.name);
    }
    return fileNames;
}
function getMetadataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[1]) || null;
}
function getAdmindataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[1]) || null;
}
function getClinicaldataModifiedFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator);
    return parseInt(fileNameParts[3]) || null;
}
const lastUpdate = new Update();
const getStatus = (context)=>{
    const isInitialized = users.length > 0;
    const status = new Status1(serverVersion, isInitialized);
    return context.json(status, 200);
};
const getLastUpdate = (context)=>{
    return context.json(lastUpdate, 200);
};
class Endpoint {
    static methods = {
        GET: "get",
        POST: "post",
        PUT: "put",
        DELETE: "delete"
    };
    constructor(method, path, logic, authorization = true){
        this.method = method;
        this.path = path;
        this.logic = logic;
        this.authorization = authorization;
    }
    get middleware() {
        return this.authorization ? ()=>authorizationMiddleware(this.logic, this.authorization)
         : ()=>this.logic
        ;
    }
}
const getMetadata = async (context)=>{
    const fileName = context.params.fileName;
    const metadata = loadXML(directories.METADATA, fileName);
    return context.string(metadata, 200);
};
const setMetadata = async (context)=>{
    const fileName = context.params.fileName;
    if (fileExist(fileName)) return context.string("Metadata instance already exists.", 400);
    const metadata = await context.body;
    storeXML(directories.METADATA, fileName, metadata);
    lastUpdate.metadata = getMetadataModifiedFromFileName(fileName);
    return context.string("Metadata successfully stored.", 201);
};
const deleteMetadata = async (context)=>{
    const fileName = context.params.fileName;
    removeFile(directories.METADATA, fileName);
    return context.string("Metadata successfully deleted.", 201);
};
const getAdmindata = async (context)=>{
    const fileName = context.params.fileName;
    const admindata = loadXML(directories.ADMINDATA, fileName);
    return context.string(admindata, 200);
};
const setAdmindata = async (context)=>{
    const fileName = context.params.fileName;
    if (fileExist(fileName)) return context.string("Admindata instance already exists.", 400);
    const admindata = await context.body;
    storeXML(directories.ADMINDATA, fileName, admindata);
    lastUpdate.admindata = getAdmindataModifiedFromFileName(fileName);
    return context.string("Admindata successfully stored.", 201);
};
const deleteAdmindata = async (context)=>{
    const fileName = context.params.fileName;
    removeFile(directories.ADMINDATA, fileName);
    return context.string("Admindata successfully deleted.", 201);
};
const fileNameSeparator1 = "__";
const dataStatusTypes = {
    EMPTY: 1,
    INCOMPLETE: 2,
    COMPLETE: 3,
    VALIDATED: 4,
    CONFLICT: 5
};
const getSubjects = (context)=>{
    return context.json(getFileNamesOfDirectory(directories.CLINICALDATA), 200);
};
const getClinicaldata = async (context, user)=>{
    const fileName = context.params.fileName.replaceAll("%20", " ");
    if (user.site && user.site != getSubjectSiteFromFileName(fileName)) {
        return context.string("You are not allowed to get clinical data from a subject that is assigned to another site than you.", 403);
    }
    const clinicaldata = loadXML(directories.CLINICALDATA, fileName);
    return context.string(clinicaldata, 200);
};
const setClinicaldata = async (context, user)=>{
    const fileName = context.params.fileName.replaceAll("%20", " ");
    if (fileExist(fileName)) return context.string("Clinical data instance already exists.", 400);
    if (user.site && user.site != getSubjectSiteFromFileName(fileName)) {
        return context.string("You are not allowed to set clinical data for a subject that is assigned to another site than you.", 403);
    }
    const subjectKey = getSubjectKeyFromFileName(fileName);
    const existingSubject = getFileNamesOfDirectory(directories.CLINICALDATA).find((clinicaldataFileName)=>subjectKey == getSubjectKeyFromFileName(clinicaldataFileName)
    );
    if (existingSubject && getSubjectStatusFromFileName(existingSubject) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) return context.string("Not authorized to change data for a validated subject.", 403);
    if (getSubjectStatusFromFileName(fileName) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) return context.string("Not authorized to validate a subject.", 403);
    const clinicaldata = await context.body;
    storeXML(directories.CLINICALDATA, fileName, clinicaldata);
    lastUpdate.clinicaldata = getClinicaldataModifiedFromFileName(fileName);
    return context.string("Clinicaldata successfully stored.", 201);
};
const deleteClinicaldata = async (context, user)=>{
    const fileName = context.params.fileName.replaceAll("%20", " ");
    const subjectKey = getSubjectKeyFromFileName(fileName);
    let occurrences = 0;
    for (const clinicaldataFileName of getFileNamesOfDirectory(directories.CLINICALDATA)){
        if (subjectKey == getSubjectKeyFromFileName(clinicaldataFileName)) occurrences++;
        if (occurrences > 1) break;
    }
    if (occurrences == 1 && !user.hasAuthorizationFor(rights.MANAGESUBJECTS)) return context.string("Not authorized to remove clinical data.", 403);
    if (getSubjectStatusFromFileName(fileName) == dataStatusTypes.VALIDATED && !user.hasAuthorizationFor(rights.VALIDATEFORMS)) return context.string("Not authorized to remove a validated subject.", 403);
    removeFile(directories.CLINICALDATA, fileName);
    return context.string("Clinicaldata successfully deleted.", 200);
};
function getSubjectKeyFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator1);
    return fileNameParts[0];
}
function getSubjectSiteFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator1);
    return fileNameParts[1] || null;
}
function getSubjectStatusFromFileName(fileName) {
    const fileNameParts = fileName.split(fileNameSeparator1);
    return fileNameParts[4] || null;
}
const getJSON = async (context)=>{
    const fileName = context.params.fileName;
    const content = loadJSON(directories.MISC, fileName);
    if (content) {
        return context.json(content, 200);
    } else {
        return context.string("JSON could not be found.", 204);
    }
};
const setJSON = async (context)=>{
    const fileName = context.params.fileName;
    const content = await context.body;
    storeJSON(directories.MISC, fileName, content);
    return context.string("JSON successfully stored.", 201);
};
const deleteJSON = async (context)=>{
    const fileName = context.params.fileName;
    removeFile(directories.MISC, fileName);
    return context.string("JSON successfully deleted.", 201);
};
const server1 = new Application();
const port = parseInt(Deno.args[0]);
const corsConfig = {
    allowOrigins: [
        "*"
    ],
    allowMethods: [
        "GET",
        "PUT",
        "DELETE"
    ],
    allowHeaders: [
        "Authorization",
        "Content-Type"
    ]
};
server1.use(cors(corsConfig));
server1.static("/", "./public");
const routes = [
    new Endpoint(Endpoint.methods.GET, "/", (context)=>context.file("./public/index.html")
    , false, false),
    new Endpoint(Endpoint.methods.GET, "/api/status", getStatus, false),
    new Endpoint(Endpoint.methods.GET, "/api/lastupdate", getLastUpdate),
    new Endpoint(Endpoint.methods.GET, "/api/users", getUsers, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/users/:oid", getUser, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/users/rights", getRights),
    new Endpoint(Endpoint.methods.GET, "/api/users/me", getMe),
    new Endpoint(Endpoint.methods.PUT, "/api/users/me", setMe),
    new Endpoint(Endpoint.methods.PUT, "/api/users/initialize/:oid", initializeUser, false),
    new Endpoint(Endpoint.methods.PUT, "/api/users/:oid", setUser, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/users/:oid", deleteUser, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/metadata/:fileName", getMetadata),
    new Endpoint(Endpoint.methods.PUT, "/api/metadata/:fileName", setMetadata, rights.EDITMETADATA),
    new Endpoint(Endpoint.methods.DELETE, "/api/metadata/:fileName", deleteMetadata, rights.EDITMETADATA),
    new Endpoint(Endpoint.methods.GET, "/api/admindata/:fileName", getAdmindata),
    new Endpoint(Endpoint.methods.PUT, "/api/admindata/:fileName", setAdmindata, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/admindata/:fileName", deleteAdmindata, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.GET, "/api/clinicaldata", getSubjects),
    new Endpoint(Endpoint.methods.GET, "/api/clinicaldata/:fileName", getClinicaldata),
    new Endpoint(Endpoint.methods.PUT, "/api/clinicaldata/:fileName", setClinicaldata, rights.ADDSUBJECTDATA),
    new Endpoint(Endpoint.methods.DELETE, "/api/clinicaldata/:fileName", deleteClinicaldata, rights.ADDSUBJECTDATA),
    new Endpoint(Endpoint.methods.GET, "/api/json/:fileName", getJSON),
    new Endpoint(Endpoint.methods.PUT, "/api/json/:fileName", setJSON, rights.PROJECTOPTIONS),
    new Endpoint(Endpoint.methods.DELETE, "/api/json/:fileName", deleteJSON, rights.PROJECTOPTIONS)
];
for (const fileName of getFileNamesOfDirectory("./plugins")){
    if (fileName.split('.').pop() === 'js') await import("./plugins/" + fileName).then((plugin)=>plugin.default().forEach((route)=>routes.push(route)
        )
    );
}
routes.forEach((route)=>server1[route.method](route.path, route.logic, route.middleware)
);
const instance = Deno.args.length > 1 ? Deno.args[1] : null;
init(instance);
init1();
server1.start({
    port
});
