export const id = 897;
export const ids = [897];
export const modules = {

/***/ 2897:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  unpackTar: () => (/* binding */ unpackTar)
});

// UNUSED EXPORTS: packTar, packTarSources

;// CONCATENATED MODULE: ./node_modules/modern-tar/dist/packer-By1HVV7Z.js
const packer_By1HVV7Z_FILE = "file";
const packer_By1HVV7Z_LINK = "link";
const packer_By1HVV7Z_SYMLINK = "symlink";
const packer_By1HVV7Z_DIRECTORY = "directory";
const TYPEFLAG = {
	file: "0",
	link: "1",
	symlink: "2",
	"character-device": "3",
	"block-device": "4",
	directory: "5",
	fifo: "6",
	"pax-header": "x",
	"pax-global-header": "g",
	"gnu-long-name": "L",
	"gnu-long-link-name": "K"
};
const FLAGTYPE = {
	48: packer_By1HVV7Z_FILE,
	49: packer_By1HVV7Z_LINK,
	50: packer_By1HVV7Z_SYMLINK,
	51: "character-device",
	52: "block-device",
	53: packer_By1HVV7Z_DIRECTORY,
	54: "fifo",
	120: "pax-header",
	103: "pax-global-header",
	76: "gnu-long-name",
	75: "gnu-long-link-name"
};
const ZERO_BLOCK = /* @__PURE__ */ new Uint8Array(512);
const EMPTY = /* @__PURE__ */ new Uint8Array(0);
//#endregion
//#region src/tar/encoding.ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function writeString(view, offset, size, value) {
	if (!value) return;
	for (let i = 0; i < value.length && i < size; i++) {
		const charCode = value.charCodeAt(i);
		if (charCode > 127) {
			encoder.encodeInto(value, view.subarray(offset, offset + size));
			return;
		}
		view[offset + i] = charCode;
	}
}
function writeOctal(view, offset, size, value) {
	if (value === void 0) return;
	let remaining = value;
	for (let i = offset + size - 2; i >= offset; i--) {
		view[i] = 48 + remaining % 8;
		remaining = Math.floor(remaining / 8);
	}
	if (remaining === 0 && value % 1 === 0) return;
	encoder.encodeInto(value.toString(8).padStart(size - 1, "0"), view.subarray(offset, offset + size - 1));
}
function readString(view, offset, size) {
	if (view[offset] === 0) return "";
	const end = view.indexOf(0, offset);
	const sliceEnd = end === -1 || end > offset + size ? offset + size : end;
	return decoder.decode(view.subarray(offset, sliceEnd));
}
function readOctal(view, offset, size) {
	let value = 0;
	const end = offset + size;
	for (let i = offset; i < end; i++) {
		const charCode = view[i];
		if (charCode === 0) break;
		if (charCode === 32) continue;
		if (charCode < 48 || charCode > 55) throw new Error("Invalid tar number.");
		value = value * 8 + (charCode - 48);
	}
	return value;
}
function readNumeric(view, offset, size) {
	if (view[offset] & 128) {
		let result = 0;
		result = view[offset] & 127;
		for (let i = 1; i < size; i++) result = result * 256 + view[offset + i];
		if (!Number.isSafeInteger(result)) throw new Error("TAR number too large");
		return result;
	}
	return readOctal(view, offset, size);
}
//#endregion
//#region src/tar/body.ts
const isBodyless = (header) => header.type === "directory" || header.type === "symlink" || header.type === "link" || header.type === "character-device" || header.type === "block-device" || header.type === "fifo";
async function packer_By1HVV7Z_normalizeBody(body) {
	if (body === null || body === void 0) return EMPTY;
	if (body instanceof Uint8Array) return body;
	if (typeof body === "string") return encoder.encode(body);
	if (body instanceof ArrayBuffer) return new Uint8Array(body);
	if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
	throw new TypeError("Unsupported content type for entry body.");
}
//#endregion
//#region src/tar/options.ts
const stripPath = (p, n) => {
	const parts = p.split("/").filter(Boolean);
	return n >= parts.length ? "" : parts.slice(n).join("/");
};
function transformHeader(header, options) {
	const { strip, filter, map } = options;
	if (!strip && !filter && !map) return header;
	const h = { ...header };
	if (strip && strip > 0) {
		const newName = stripPath(h.name, strip);
		if (!newName) return null;
		h.name = h.type === "directory" && !newName.endsWith("/") ? `${newName}/` : newName;
		if (h.linkname) {
			const isAbsolute = h.linkname.startsWith("/");
			if (isAbsolute || h.type === "link") {
				const stripped = stripPath(h.linkname, strip);
				h.linkname = isAbsolute ? `/${stripped}` || "/" : stripped;
			}
		}
	}
	if (filter?.(h) === false) return null;
	const result = map ? map(h) : h;
	if (result && (!result.name?.trim() || result.name === "." || result.name === "/")) return null;
	return result;
}
//#endregion
//#region src/tar/chunk-queue.ts
const INITIAL_CAPACITY = 256;
function createChunkQueue() {
	let chunks = new Array(INITIAL_CAPACITY);
	let capacityMask = chunks.length - 1;
	let head = 0;
	let tail = 0;
	let totalAvailable = 0;
	const consumeFromHead = (count) => {
		const chunk = chunks[head];
		if (count === chunk.length) {
			chunks[head] = EMPTY;
			head = head + 1 & capacityMask;
		} else chunks[head] = chunk.subarray(count);
		totalAvailable -= count;
		if (totalAvailable === 0 && chunks.length > INITIAL_CAPACITY) {
			chunks = new Array(INITIAL_CAPACITY);
			capacityMask = 255;
			head = 0;
			tail = 0;
		}
	};
	function pull(bytes, callback) {
		if (callback) {
			let fed = 0;
			let remaining = Math.min(bytes, totalAvailable);
			while (remaining > 0) {
				const chunk = chunks[head];
				const toFeed = Math.min(remaining, chunk.length);
				const segment = toFeed === chunk.length ? chunk : chunk.subarray(0, toFeed);
				consumeFromHead(toFeed);
				remaining -= toFeed;
				fed += toFeed;
				if (!callback(segment)) break;
			}
			return fed;
		}
		if (totalAvailable < bytes) return null;
		if (bytes === 0) return EMPTY;
		const firstChunk = chunks[head];
		if (firstChunk.length >= bytes) {
			const view = firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			consumeFromHead(bytes);
			return view;
		}
		const result = new Uint8Array(bytes);
		let copied = 0;
		let remaining = bytes;
		while (remaining > 0) {
			const chunk = chunks[head];
			const toCopy = Math.min(remaining, chunk.length);
			result.set(toCopy === chunk.length ? chunk : chunk.subarray(0, toCopy), copied);
			copied += toCopy;
			remaining -= toCopy;
			consumeFromHead(toCopy);
		}
		return result;
	}
	return {
push: (chunk) => {
			if (chunk.length === 0) return;
			let nextTail = tail + 1 & capacityMask;
			if (nextTail === head) {
				const oldLen = chunks.length;
				const newLen = oldLen * 2;
				const newChunks = new Array(newLen);
				const count = tail - head + oldLen & oldLen - 1;
				if (head < tail) for (let i = 0; i < count; i++) newChunks[i] = chunks[head + i];
				else {
					const firstPart = oldLen - head;
					for (let i = 0; i < firstPart; i++) newChunks[i] = chunks[head + i];
					for (let i = 0; i < tail; i++) newChunks[firstPart + i] = chunks[i];
				}
				chunks = newChunks;
				capacityMask = newLen - 1;
				head = 0;
				tail = count;
				nextTail = tail + 1 & capacityMask;
			}
			chunks[tail] = chunk;
			tail = nextTail;
			totalAvailable += chunk.length;
		},
available: () => totalAvailable,
peek: (bytes) => {
			if (totalAvailable < bytes) return null;
			if (bytes === 0) return EMPTY;
			const firstChunk = chunks[head];
			if (firstChunk.length >= bytes) return firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			const result = new Uint8Array(bytes);
			let copied = 0;
			let index = head;
			while (copied < bytes) {
				const chunk = chunks[index];
				const toCopy = Math.min(bytes - copied, chunk.length);
				if (toCopy === chunk.length) result.set(chunk, copied);
				else result.set(chunk.subarray(0, toCopy), copied);
				copied += toCopy;
				index = index + 1 & capacityMask;
			}
			return result;
		},
discard: (bytes) => {
			if (bytes > totalAvailable) throw new Error("Too many bytes consumed");
			if (bytes === 0) return;
			let remaining = bytes;
			while (remaining > 0) {
				const chunk = chunks[head];
				const toConsume = Math.min(remaining, chunk.length);
				consumeFromHead(toConsume);
				remaining -= toConsume;
			}
		},
		pull
	};
}
//#endregion
//#region src/tar/checksum.ts
const CHECKSUM_SPACE = 32;
const ASCII_ZERO = 48;
function validateChecksum(block) {
	const stored = readOctal(block, 148, 8);
	let sum = 0;
	for (let i = 0; i < block.length; i++) if (i >= 148 && i < 156) sum += CHECKSUM_SPACE;
	else sum += block[i];
	return stored === sum;
}
function writeChecksum(block) {
	block.fill(CHECKSUM_SPACE, 148, 156);
	let checksum = 0;
	for (let i = block.length; i > 0;) checksum += block[--i];
	for (let i = 153; i >= 148; i--) {
		block[i] = (checksum & 7) + ASCII_ZERO;
		checksum >>= 3;
	}
	block[154] = 0;
	block[155] = CHECKSUM_SPACE;
}
//#endregion
//#region src/tar/pax.ts
const USTAR_SPLIT_MAX_SIZE = 256;
const NON_ASCII = /[^\x00-\x7f]/;
function isUtf8TooLong(value, limit) {
	if (value.length * 3 <= limit) return false;
	if (value.length > limit) return true;
	if (!NON_ASCII.test(value)) return false;
	return encoder.encode(value).length > limit;
}
function generatePax(header) {
	const paxRecords = {};
	if (isUtf8TooLong(header.name, 100)) {
		if (findUstarSplit(header.name) === null) paxRecords.path = header.name;
	}
	if (header.linkname && isUtf8TooLong(header.linkname, 100)) paxRecords.linkpath = header.linkname;
	if (header.uname && isUtf8TooLong(header.uname, 32)) paxRecords.uname = header.uname;
	if (header.gname && isUtf8TooLong(header.gname, 32)) paxRecords.gname = header.gname;
	if (header.uid != null && header.uid > 2097151) paxRecords.uid = String(header.uid);
	if (header.gid != null && header.gid > 2097151) paxRecords.gid = String(header.gid);
	if (header.pax) Object.assign(paxRecords, header.pax);
	if (header.size > 8589934591 || "size" in paxRecords) paxRecords.size = String(header.size);
	const paxEntries = Object.entries(paxRecords);
	if (paxEntries.length === 0) return null;
	const paxBody = encoder.encode(paxEntries.map(([key, value]) => {
		const record = `${key}=${value}\n`;
		const partLength = encoder.encode(record).length + 1;
		let totalLength = partLength + String(partLength).length;
		totalLength = partLength + String(totalLength).length;
		return `${totalLength} ${record}`;
	}).join(""));
	return {
		paxHeader: createTarHeader({
			name: decoder.decode(encoder.encode(`PaxHeader/${header.name}`).slice(0, 100)),
			size: paxBody.length,
			type: "pax-header",
			mode: 420,
			mtime: header.mtime,
			uname: header.uname,
			gname: header.gname,
			uid: header.uid,
			gid: header.gid
		}),
		paxBody
	};
}
function findUstarSplit(path) {
	if (!isUtf8TooLong(path, 100) || isUtf8TooLong(path, USTAR_SPLIT_MAX_SIZE)) return null;
	for (let i = path.length - 1; i > 0; i--) {
		if (path[i] !== "/") continue;
		const prefix = path.slice(0, i);
		const name = path.slice(i + 1);
		if (!isUtf8TooLong(prefix, 155) && !isUtf8TooLong(name, 100)) return {
			prefix,
			name
		};
	}
	return null;
}
//#endregion
//#region src/tar/header.ts
function createTarHeader(header) {
	const view = /* @__PURE__ */ new Uint8Array(512);
	const size = isBodyless(header) ? 0 : header.size ?? 0;
	let name = header.name;
	let prefix = "";
	if (!header.pax?.path) {
		const split = findUstarSplit(name);
		if (split) {
			name = split.name;
			prefix = split.prefix;
		}
	}
	writeString(view, 0, 100, name);
	writeOctal(view, 100, 8, header.mode ?? (header.type === "directory" ? 493 : 420));
	writeOctal(view, 108, 8, header.uid ?? 0);
	writeOctal(view, 116, 8, header.gid ?? 0);
	writeOctal(view, 124, 12, size);
	writeOctal(view, 136, 12, Math.floor((header.mtime?.getTime() ?? Date.now()) / 1e3));
	writeString(view, 156, 1, TYPEFLAG[header.type ?? "file"]);
	writeString(view, 157, 100, header.linkname);
	writeString(view, 257, 6, "ustar\0");
	writeString(view, 263, 2, "00");
	writeString(view, 265, 32, header.uname);
	writeString(view, 297, 32, header.gname);
	writeString(view, 345, 155, prefix);
	writeChecksum(view);
	return view;
}
function parseUstarHeader(block, strict) {
	if (strict && !validateChecksum(block)) throw new Error("Invalid tar header checksum.");
	const header = {
		name: readString(block, 0, 100),
		mode: readOctal(block, 100, 8),
		uid: readNumeric(block, 108, 8),
		gid: readNumeric(block, 116, 8),
		size: readNumeric(block, 124, 12),
		mtime: /* @__PURE__ */ new Date(readNumeric(block, 136, 12) * 1e3),
		type: FLAGTYPE[block[156]] || "file",
		linkname: readString(block, 157, 100)
	};
	const magic = readString(block, 257, 6);
	if (magic.trim() === "ustar") {
		header.uname = readString(block, 265, 32);
		header.gname = readString(block, 297, 32);
	}
	if (magic === "ustar") header.prefix = readString(block, 345, 155);
	return header;
}
const PAX_MAPPING = {
	path: ["name", (v) => v],
	linkpath: ["linkname", (v) => v],
	size: ["size", (v) => /^\d+$/.test(v) && Number.isSafeInteger(+v) ? +v : NaN],
	mtime: ["mtime", parseFloat],
	uid: ["uid", (v) => parseInt(v, 10)],
	gid: ["gid", (v) => parseInt(v, 10)],
	uname: ["uname", (v) => v],
	gname: ["gname", (v) => v]
};
function parsePax(buffer) {
	const overrides = Object.create(null);
	const pax = Object.create(null);
	let isPax = false;
	let offset = 0;
	while (offset < buffer.length) {
		const spaceIndex = buffer.indexOf(32, offset);
		if (spaceIndex === -1) break;
		const length = parseInt(decoder.decode(buffer.subarray(offset, spaceIndex)), 10);
		if (!(length > 0)) break;
		const recordEnd = offset + length;
		const recordStr = decoder.decode(buffer.subarray(spaceIndex + 1, recordEnd - 1));
		const equalsIndex = recordStr.indexOf("=");
		if (equalsIndex > 0) {
			const key = recordStr.slice(0, equalsIndex);
			const value = recordStr.slice(equalsIndex + 1);
			pax[key] = value;
			isPax = true;
			if (Object.hasOwn(PAX_MAPPING, key)) {
				const [targetKey, parser] = PAX_MAPPING[key];
				const parsedValue = parser(value);
				if (typeof parsedValue === "string" || !Number.isNaN(parsedValue)) overrides[targetKey] = parsedValue;
			}
		}
		offset = recordEnd;
	}
	if (isPax) overrides.pax = pax;
	return overrides;
}
function applyOverrides(header, overrides) {
	if (overrides.name !== void 0) header.name = overrides.name;
	if (overrides.linkname !== void 0) header.linkname = overrides.linkname;
	if (overrides.size !== void 0) header.size = overrides.size;
	if (overrides.mtime !== void 0) header.mtime = /* @__PURE__ */ new Date(overrides.mtime * 1e3);
	if (overrides.uid !== void 0) header.uid = overrides.uid;
	if (overrides.gid !== void 0) header.gid = overrides.gid;
	if (overrides.uname !== void 0) header.uname = overrides.uname;
	if (overrides.gname !== void 0) header.gname = overrides.gname;
	if (overrides.pax) header.pax = Object.assign({}, header.pax ?? {}, overrides.pax);
}
function getMetaParser(type) {
	switch (type) {
		case "pax-global-header":
		case "pax-header": return parsePax;
		case "gnu-long-name": return (data) => ({ name: readString(data, 0, data.length) });
		case "gnu-long-link-name": return (data) => ({ linkname: readString(data, 0, data.length) });
		default: return;
	}
}
function getHeaderBlocks(header) {
	const base = createTarHeader(header);
	const pax = generatePax(header);
	if (!pax) return [base];
	const paxPadding = -pax.paxBody.length & 511;
	const paddingBlocks = paxPadding > 0 ? [ZERO_BLOCK.subarray(0, paxPadding)] : [];
	return [
		pax.paxHeader,
		pax.paxBody,
		...paddingBlocks,
		base
	];
}
//#endregion
//#region src/tar/unpacker.ts
const STATE_HEADER = 0;
const STATE_BODY = 1;
const MAX_META_SIZE = 8388608;
const MAX_GLOBAL_PAX_KEYS = 512;
const truncateErr = /* @__PURE__ */ new Error("Tar archive is truncated.");
function createUnpacker(options = {}) {
	const strict = options.strict ?? false;
	const { available, peek, push, discard, pull } = createChunkQueue();
	let state = STATE_HEADER;
	let ended = false;
	let done = false;
	let eof = false;
	let currentEntry = null;
	const paxGlobals = {};
	let nextEntryOverrides = {};
	const unpacker = {
		isEntryActive: () => state === STATE_BODY,
isBodyComplete: () => !currentEntry || currentEntry.remaining === 0,
canFinish: () => !currentEntry || available() >= currentEntry.remaining + currentEntry.padding,
		bodyBytes: () => currentEntry && currentEntry.remaining > 0 ? Math.min(currentEntry.remaining, available()) : 0,
available,
write(chunk) {
			if (ended) throw new Error("Archive already ended.");
			if (eof) {
				if (strict) checkPadding(chunk);
				return;
			}
			push(chunk);
		},
end() {
			ended = true;
		},
readHeader() {
			if (state !== STATE_HEADER) throw new Error("Cannot read header while an entry is active");
			if (done) return void 0;
			while (!done) {
				if (available() < 512) {
					if (ended) {
						if (available() > 0 && strict) throw truncateErr;
						done = true;
						return;
					}
					return null;
				}
				const headerBlock = peek(512);
				if (isZeroBlock(headerBlock)) {
					if (available() < 1024) {
						if (ended) {
							if (strict) throw truncateErr;
							done = true;
							return;
						}
						return null;
					}
					if (isZeroBlock(peek(1024).subarray(512))) {
						discard(1024);
						done = true;
						eof = true;
						if (strict) pull(available(), checkPadding);
						else discard(available());
						return;
					}
					if (strict) throw new Error("Invalid tar header.");
					discard(512);
					continue;
				}
				let internalHeader;
				try {
					internalHeader = parseUstarHeader(headerBlock, strict);
				} catch (err) {
					if (strict) throw err;
					discard(512);
					continue;
				}
				const metaParser = getMetaParser(internalHeader.type);
				if (metaParser) {
					if (internalHeader.size > MAX_META_SIZE) throw new Error("Tar metadata entry exceeds maximum size.");
					const paddedSize = internalHeader.size + (-internalHeader.size & 511);
					if (available() < 512 + paddedSize) {
						if (ended && strict) throw truncateErr;
						return null;
					}
					discard(512);
					const overrides = metaParser(pull(paddedSize).subarray(0, internalHeader.size));
					if (nextEntryOverrides.pax) nextEntryOverrides = {};
					const target = internalHeader.type === "pax-global-header" ? paxGlobals : nextEntryOverrides;
					if (target === paxGlobals && overrides.pax && Object.keys(overrides.pax).length > MAX_GLOBAL_PAX_KEYS) throw new Error("Too many global attributes.");
					for (const key in overrides) target[key] = overrides[key];
					continue;
				}
				discard(512);
				const header = internalHeader;
				if (internalHeader.prefix) header.name = `${internalHeader.prefix}/${header.name}`;
				applyOverrides(header, paxGlobals);
				applyOverrides(header, nextEntryOverrides);
				let archiveSize = header.size;
				if (isBodyless(header)) {
					archiveSize = 0;
					header.size = 0;
				} else if (header.name.endsWith("/") && header.type === "file") {
					header.type = packer_By1HVV7Z_DIRECTORY;
					header.size = 0;
				}
				nextEntryOverrides = {};
				currentEntry = {
					header,
					remaining: archiveSize,
					padding: -archiveSize & 511
				};
				state = STATE_BODY;
				return header;
			}
		},
streamBody(callback) {
			if (state !== STATE_BODY || !currentEntry || currentEntry.remaining === 0) return 0;
			const bytesToFeed = Math.min(currentEntry.remaining, available());
			if (bytesToFeed === 0) return 0;
			const fed = pull(bytesToFeed, callback);
			currentEntry.remaining -= fed;
			return fed;
		},
skipPadding() {
			if (state !== STATE_BODY || !currentEntry) return true;
			if (currentEntry.remaining > 0) throw new Error("Body not fully consumed");
			if (available() < currentEntry.padding) return false;
			discard(currentEntry.padding);
			currentEntry = null;
			state = STATE_HEADER;
			return true;
		},
skipEntry() {
			if (state !== STATE_BODY || !currentEntry) return true;
			const toDiscard = Math.min(currentEntry.remaining, available());
			if (toDiscard > 0) {
				discard(toDiscard);
				currentEntry.remaining -= toDiscard;
			}
			if (currentEntry.remaining > 0) return false;
			return unpacker.skipPadding();
		},
finish() {
			if (strict && !eof) throw truncateErr;
		}
	};
	return unpacker;
}
function isZeroBlock(block) {
	if (block.length === 0) return true;
	if (block[0] !== 0) return false;
	if (block.byteOffset % 8 === 0 && block.length % 8 === 0) {
		const view = new BigUint64Array(block.buffer, block.byteOffset, block.length / 8);
		for (let i = 0; i < view.length; i++) if (view[i] !== 0n) return false;
		return true;
	}
	for (let i = 0; i < block.length; i++) if (block[i] !== 0) return false;
	return true;
}
function checkPadding(chunk) {
	if (!isZeroBlock(chunk)) throw new Error("Invalid EOF.");
	return true;
}
//#endregion
//#region src/tar/packer.ts
const EOF_BUFFER = /* @__PURE__ */ new Uint8Array(1024);
function packer_By1HVV7Z_createTarPacker(onData) {
	let currentHeader = null;
	let bytesWritten = 0;
	let finalized = false;
	const fail = (message) => {
		throw new Error(message);
	};
	return {
		add(header) {
			if (finalized) fail("No new tar entries after finalize.");
			if (currentHeader !== null) fail("Previous entry must be completed before adding a new one");
			const size = isBodyless(header) ? 0 : header.size;
			if (!Number.isSafeInteger(size) || size < 0) fail("Invalid tar entry size.");
			const headerBlocks = getHeaderBlocks({
				...header,
				size
			});
			for (const block of headerBlocks) onData(block);
			currentHeader = {
				...header,
				size
			};
			bytesWritten = 0;
		},
		write(chunk) {
			if (!currentHeader) fail("No active tar entry.");
			if (finalized) fail("Cannot write data after finalize.");
			const newTotal = bytesWritten + chunk.length;
			if (newTotal > currentHeader.size) fail(`"${currentHeader.name}" exceeds given size of ${currentHeader.size} bytes.`);
			bytesWritten = newTotal;
			onData(chunk);
		},
		endEntry() {
			if (!currentHeader) fail("No active entry to end.");
			if (finalized) fail("Cannot end entry after finalize.");
			if (bytesWritten !== currentHeader.size) fail(`Size mismatch for "${currentHeader.name}".`);
			const paddingSize = -currentHeader.size & 511;
			if (paddingSize > 0) onData(new Uint8Array(paddingSize));
			currentHeader = null;
			bytesWritten = 0;
		},
		finalize() {
			if (finalized) fail("Archive has already been finalized");
			if (currentHeader !== null) fail("Cannot finalize while an entry is still active");
			onData(EOF_BUFFER);
			finalized = true;
		}
	};
}
//#endregion


// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(3024);
// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(1455);
// EXTERNAL MODULE: external "node:os"
var external_node_os_ = __webpack_require__(8161);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(6760);
// EXTERNAL MODULE: external "node:stream"
var external_node_stream_ = __webpack_require__(7075);
;// CONCATENATED MODULE: ./node_modules/modern-tar/dist/fs/index.js






//#region src/fs/path.ts
function validateBounds(targetPath, destDir, errorMessage) {
	const target = external_node_path_.resolve(targetPath);
	const dest = external_node_path_.resolve(destDir);
	if (target !== dest && !target.startsWith(dest + external_node_path_.sep)) throw new Error(errorMessage);
}
const win32Reserved = {
	":": "",
	"<": "",
	">": "",
	"|": "",
	"?": "",
	"*": "",
	"\"": ""
};
const pathAlias = /\/\/|(?:^|\/)\.(?:\/|$)/;
function normalizeName(name) {
	const path = name.replace(/\\/g, "/");
	if (path.split("/").includes("..") || /^[a-zA-Z]:\.\./.test(path)) throw new Error(`${name} points outside extraction directory`);
	let relative = path;
	if (/^[a-zA-Z]:/.test(relative)) relative = relative.replace(/^[a-zA-Z]:[/\\]?/, "");
	else if (relative.startsWith("/")) relative = relative.replace(/^\/+/, "");
	if (process.platform === "win32") return relative.replace(/[<>:"|?*]/g, (char) => win32Reserved[char]);
	return relative;
}
const normalizeHeaderName = (s) => {
	const name = normalizeName(s.replace(/[\\/]+$/, ""));
	return pathAlias.test(name) ? external_node_path_.posix.normalize(name) : name;
};
//#endregion
//#region src/fs/pack.ts
const BIGINT_STAT = { bigint: true };
const WITH_FILE_TYPES = { withFileTypes: true };
const packTarSources = (/* unused pure expression or super */ null && (packTar));
function packTar(sources, options = {}) {
	const results = /* @__PURE__ */ new Map();
	const fileHandles = /* @__PURE__ */ new Map();
	const bodyStreams = /* @__PURE__ */ new Set();
	let resume = null;
	let drain = null;
	let resumeWriter = null;
	let cancelError;
	const unblock = () => {
		const resolve = resume;
		resume = null;
		drain = null;
		resolve?.();
	};
	const wakeWriter = () => {
		resumeWriter?.();
		resumeWriter = null;
	};
	const destroyBody = (body, reason) => {
		bodyStreams.delete(body);
		body.destroy(reason);
	};
	const closeHandle = (handle) => {
		const closing = fileHandles.get(handle);
		if (closing !== null) return closing;
		const promise = handle.close().finally(() => fileHandles.delete(handle));
		fileHandles.set(handle, promise);
		return promise;
	};
	const stop = async (reason) => {
		for (const body of bodyStreams) destroyBody(body, reason);
		const closing = Promise.allSettled([...fileHandles.keys()].map(closeHandle));
		results.clear();
		wakeWriter();
		for (const result of await closing) if (result.status === "rejected") throw result.reason;
	};
	const stream = new Readable({
		highWaterMark: 8388608,
		read: unblock,
		destroy(error, callback) {
			cancelError = error ?? AbortSignal.abort().reason;
			unblock();
			stop(cancelError).then(() => callback(error), (closeError) => callback(error ?? closeError));
		}
	});
	const onError = (error) => stream.destroy(error);
	const packer = createTarPacker((chunk) => {
		if (stream.destroyed) throw cancelError;
		if (!stream.push(Buffer.from(chunk)) && !drain) drain = new Promise((resolve) => {
			resume = resolve;
		});
	});
	(async () => {
		const { dereference = false, filter, map, baseDir, concurrency = cpus().length || 8 } = options;
		let directoryPath;
		let realBaseDir;
		let jobs;
		if (typeof sources === "string") {
			const source = path.resolve(sources);
			directoryPath = source;
			const before = await fsp.stat(source, BIGINT_STAT);
			if (stream.destroyed) return;
			const entries = await fsp.readdir(source, WITH_FILE_TYPES);
			if (stream.destroyed) return;
			const after = await fsp.stat(source, BIGINT_STAT);
			if (stream.destroyed) return;
			jobs = before.dev === after.dev && before.ino === after.ino ? entries.map((entry) => ({
				type: entry.isDirectory() ? DIRECTORY : FILE,
				source: path.join(source, entry.name),
				target: entry.name
			})) : [];
		} else jobs = sources.map((source) => ({ ...source }));
		const seenHardlinks = /* @__PURE__ */ new Map();
		let jobIndex = 0;
		let writeIndex = 0;
		let activeWorkers = 0;
		let allJobsQueued = false;
		const writeStreamBody = async (body) => {
			try {
				for await (const chunk of body) {
					if (stream.destroyed) return;
					packer.write(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
					if (drain) await drain;
				}
			} finally {
				body.off("error", onError);
				bodyStreams.delete(body);
			}
		};
		const writer = async () => {
			const readBufferSmall = Buffer.alloc(65536);
			let readBufferLarge = null;
			while (true) {
				if (stream.destroyed) return;
				if (allJobsQueued && writeIndex >= jobs.length) break;
				if (!results.has(writeIndex)) {
					await new Promise((resolve) => {
						resumeWriter = resolve;
					});
					continue;
				}
				const result = results.get(writeIndex);
				results.delete(writeIndex);
				if (!result) {
					writeIndex++;
					controller();
					continue;
				}
				if (result.hardlinkId) {
					const originalName = result.header.name;
					const hardlinkTarget = seenHardlinks.get(result.hardlinkId);
					if (hardlinkTarget) {
						if (result.body && !(result.body instanceof Uint8Array) && !(result.body instanceof Readable)) await closeHandle(result.body.handle);
						result.body = void 0;
						result.header.type = LINK;
						result.header.linkname = hardlinkTarget.originalName;
						result.header.size = 0;
					}
					if (map) result.header = map(result.header);
					if (hardlinkTarget) {
						if (result.header.linkname === hardlinkTarget.originalName) result.header.linkname = hardlinkTarget.mappedName;
					} else seenHardlinks.set(result.hardlinkId, {
						originalName,
						mappedName: result.header.name
					});
				}
				packer.add(result.header);
				if (drain) await drain;
				if (stream.destroyed) return;
				if (result.body) if (result.body instanceof Uint8Array) {
					if (result.body.length > 0) {
						packer.write(result.body);
						if (drain) await drain;
					}
				} else if (result.body instanceof Readable) await writeStreamBody(result.body);
				else {
					const { handle, size } = result.body;
					const readBuffer = size > 1048576 ? readBufferLarge ??= Buffer.alloc(1048576) : readBufferSmall;
					try {
						let bytesLeft = size;
						while (bytesLeft > 0 && !stream.destroyed) {
							const { bytesRead } = await handle.read(readBuffer, 0, Math.min(bytesLeft, readBuffer.length), null);
							if (bytesRead === 0) break;
							packer.write(readBuffer.subarray(0, bytesRead));
							bytesLeft -= bytesRead;
							if (drain) await drain;
						}
					} finally {
						await closeHandle(handle);
					}
				}
				if (stream.destroyed) return;
				packer.endEntry();
				if (drain) await drain;
				writeIndex++;
				controller();
			}
		};
		const controller = () => {
			if (stream.destroyed || allJobsQueued) return;
			while (activeWorkers < concurrency && jobIndex < jobs.length && jobIndex - writeIndex < concurrency) {
				activeWorkers++;
				const currentIndex = jobIndex++;
				processJob(jobs[currentIndex], currentIndex).catch(onError).finally(() => {
					activeWorkers--;
					controller();
				});
			}
			if (activeWorkers === 0 && jobIndex >= jobs.length) {
				allJobsQueued = true;
				wakeWriter();
			}
		};
		const processJob = async (job, index) => {
			let jobResult = null;
			const target = normalizeName(job.target);
			try {
				if (job.type === "content" || job.type === "stream") {
					let body;
					let size;
					const isDir = target.endsWith("/");
					if (job.type === "stream") {
						if (!isDir && job.size <= 0 || isDir && job.size !== 0) throw new Error(isDir ? "Streams for directories must have size 0." : "Streams require a positive size.");
						size = job.size;
					} else {
						const content = await normalizeBody(job.content);
						size = content.length;
						body = content;
					}
					const stat = {
						size: isDir ? 0 : size,
						isFile: () => !isDir,
						isDirectory: () => isDir,
						isSymbolicLink: () => false,
						mode: job.mode,
						mtime: job.mtime ?? /* @__PURE__ */ new Date(),
						uid: job.uid ?? 0,
						gid: job.gid ?? 0
					};
					if (stream.destroyed) return;
					if (filter && !filter(target, stat)) return;
					if (stream.destroyed) return;
					let header = {
						name: target,
						type: isDir ? DIRECTORY : FILE,
						size: isDir ? 0 : size,
						mode: stat.mode,
						mtime: stat.mtime,
						uid: stat.uid,
						gid: stat.gid,
						uname: job.uname,
						gname: job.gname
					};
					if (map) header = map(header);
					if (stream.destroyed) return;
					if (!isDir && job.type === "stream") {
						body = job.content instanceof Readable ? job.content : Readable.fromWeb(job.content);
						body.once("error", onError);
						bodyStreams.add(body);
					}
					jobResult = {
						header,
						body: isDir ? void 0 : body
					};
					return;
				}
				let source = job.source;
				let stat = await fsp.lstat(source, BIGINT_STAT);
				if (stream.destroyed) return;
				if (dereference && (baseDir !== void 0 || stat.isSymbolicLink())) {
					const resolvedSource = await fsp.realpath(source);
					if (stream.destroyed) return;
					realBaseDir ??= await fsp.realpath(baseDir ?? directoryPath ?? process.cwd());
					if (stream.destroyed) return;
					const relativeToBase = path.relative(realBaseDir, resolvedSource);
					if (relativeToBase === ".." || relativeToBase.startsWith(".." + path.sep) || path.isAbsolute(relativeToBase)) return;
					if (stat.isSymbolicLink()) {
						source = resolvedSource;
						stat = await fsp.lstat(source, BIGINT_STAT);
						if (stat.isSymbolicLink()) return;
					}
				}
				if (stream.destroyed) return;
				if (filter && !filter(job.source, stat)) return;
				if (stream.destroyed) return;
				let header = {
					name: target,
					size: 0,
					mode: (job.mode ?? Number(stat.mode)) & 4095,
					mtime: job.mtime === void 0 ? stat.mtime : new Date(job.mtime.getTime()),
					uid: job.uid ?? Number(stat.uid),
					gid: job.gid ?? Number(stat.gid),
					uname: job.uname,
					gname: job.gname,
					type: FILE
				};
				let body;
				let hardlinkId;
				if (stat.isDirectory()) {
					header.type = DIRECTORY;
					header.name = target.endsWith("/") ? target : `${target}/`;
					try {
						const entries = await fsp.readdir(source, WITH_FILE_TYPES);
						if (stream.destroyed) return;
						const after = await fsp.lstat(source, BIGINT_STAT);
						if (stream.destroyed || !after.isDirectory() || stat.dev !== after.dev || stat.ino !== after.ino) return;
						for (const d of entries) jobs.push({
							type: d.isDirectory() ? DIRECTORY : FILE,
							source: path.join(source, d.name),
							target: `${header.name}${d.name}`,
							mtime: job.mtime,
							uid: job.uid,
							gid: job.gid,
							uname: job.uname,
							gname: job.gname,
							mode: job.mode
						});
					} catch (error) {
						const code = error.code;
						if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
					}
				} else if (stat.isSymbolicLink()) {
					header.type = SYMLINK;
					header.linkname = await fsp.readlink(job.source);
				} else if (stat.isFile()) {
					header.size = Number(stat.size);
					let handleToClose;
					if (stat.nlink > 1n && (process.platform !== "win32" || stat.dev !== 0n && stat.ino !== -1n)) hardlinkId = `${stat.dev}:${stat.ino}`;
					try {
						let after;
						try {
							if (header.size === 0) after = await fsp.lstat(source, BIGINT_STAT);
							else {
								handleToClose = await fsp.open(source, fs.constants.O_NOFOLLOW ?? 0);
								fileHandles.set(handleToClose, null);
							}
						} catch (error) {
							const code = error.code;
							if (code === "ELOOP" || code === "ENOENT") return;
							throw error;
						}
						if (stream.destroyed) return;
						if (after) {
							if (!after.isFile() || stat.dev !== after.dev || stat.ino !== after.ino) return;
						} else {
							const { dev, ino } = await handleToClose.stat(BIGINT_STAT);
							if (stream.destroyed) return;
							if (stat.dev !== dev || stat.ino !== ino) return;
						}
						if (header.size > 0) {
							const handle = handleToClose;
							if (header.size < 32768) {
								const buffer = Buffer.allocUnsafe(header.size);
								let offset = 0;
								while (offset < buffer.length && !stream.destroyed) {
									const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
									if (bytesRead === 0) break;
									offset += bytesRead;
								}
								body = offset === buffer.length ? buffer : buffer.subarray(0, offset);
							} else {
								body = {
									handle,
									size: header.size
								};
								handleToClose = void 0;
							}
						}
					} finally {
						if (handleToClose) await closeHandle(handleToClose);
					}
				} else return;
				if (stream.destroyed) return;
				if (hardlinkId) jobResult = {
					header,
					body,
					hardlinkId
				};
				else {
					if (map) header = map(header);
					jobResult = {
						header,
						body
					};
				}
			} finally {
				if (stream.destroyed) {
					if (jobResult?.body instanceof Readable) destroyBody(jobResult.body, cancelError);
					else if (jobResult?.body && !(jobResult.body instanceof Uint8Array)) await closeHandle(jobResult.body.handle);
				} else {
					results.set(index, jobResult);
					if (index === writeIndex) wakeWriter();
				}
			}
		};
		controller();
		await writer();
		if (!stream.destroyed) {
			packer.finalize();
			stream.push(null);
		}
	})().catch(onError);
	return stream;
}
//#endregion
//#region src/fs/concurrency.ts
const createOperationQueue = (concurrency) => {
	let active = 0;
	const tasks = [];
	let head = 0;
	let idle = null;
	let resolveIdle = null;
	const ensureIdle = () => idle ??= new Promise((resolve) => resolveIdle = resolve);
	const flush = () => {
		while (active < concurrency && head < tasks.length) {
			const task = tasks[head++];
			active++;
			task().finally(() => {
				active--;
				flush();
			});
		}
		if (head === tasks.length) {
			tasks.length = 0;
			head = 0;
			if (active === 0 && resolveIdle) {
				resolveIdle();
				idle = null;
				resolveIdle = null;
			}
		}
	};
	return {
add(op) {
			const wasIdle = active === 0 && head === tasks.length;
			return new Promise((resolve, reject) => {
				tasks.push(() => Promise.resolve().then(op).then(resolve, reject));
				if (wasIdle) ensureIdle();
				flush();
			});
		},
		onIdle() {
			return active === 0 && head === tasks.length ? Promise.resolve() : ensureIdle();
		}
	};
};
//#endregion
//#region src/fs/file-sink.ts
const BATCH_BYTES = 262144;
const BUFFER_LIMIT = 8388608;
const MAX_WRITE_VECTORS = 1024;
const CREATE_FLAGS = external_node_fs_.constants.O_WRONLY | external_node_fs_.constants.O_CREAT | external_node_fs_.constants.O_TRUNC | (external_node_fs_.constants.O_NOFOLLOW ?? 0) | external_node_fs_.constants.O_EXCL;
const STATE_OPENING = 1;
const STATE_OPEN = 2;
const STATE_CLOSED = 3;
const STATE_FAILED = 4;
const DRAINED_PROMISE = Promise.resolve();
const discardFile = (fd) => external_node_fs_.ftruncate(fd, 0, () => external_node_fs_.close(fd));
function createFileSink(path, { mode = 438, mtime } = {}, onError) {
	let state = STATE_OPENING;
	let flushing = false;
	let fd = null;
	let queue = [];
	let spare = [];
	let bytes = 0;
	let storedError = null;
	let failedFd = null;
	let endPromise = null;
	let endResolve = null;
	let endReject = null;
	let drainPromise = null;
	let drainResolve = null;
	let drainReject = null;
	const settleDrain = (error) => {
		if (!drainPromise) return;
		const resolve = drainResolve;
		const reject = drainReject;
		drainPromise = null;
		drainResolve = null;
		drainReject = null;
		if (error) reject?.(error);
		else resolve?.();
	};
	const resetBuffers = () => {
		bytes = 0;
		queue.length = 0;
		spare.length = 0;
	};
	const finish = () => {
		if (state === STATE_FAILED) return;
		state = STATE_CLOSED;
		endResolve?.();
		settleDrain();
	};
	const fail = (error) => {
		if (storedError) return;
		storedError = error;
		state = STATE_FAILED;
		const writePending = flushing;
		resetBuffers();
		const fdToClose = fd;
		fd = null;
		if (fdToClose !== null) if (writePending) failedFd = fdToClose;
		else discardFile(fdToClose);
		flushing = false;
		if (endReject) endReject(error);
		else onError?.(error);
		settleDrain(error);
	};
	const close = () => {
		if (fd === null) {
			finish();
			return;
		}
		const fdToClose = fd;
		fd = null;
		if (mtime) external_node_fs_.futimes(fdToClose, mtime, mtime, (err) => {
			if (state !== STATE_OPEN) {
				external_node_fs_.close(fdToClose);
				return;
			}
			if (err) {
				external_node_fs_.close(fdToClose, () => fail(err));
				return;
			}
			external_node_fs_.close(fdToClose, (closeErr) => {
				if (state !== STATE_OPEN) return;
				if (closeErr) fail(closeErr);
				else finish();
			});
		});
		else external_node_fs_.close(fdToClose, (err) => {
			if (state !== STATE_OPEN) return;
			if (err) fail(err);
			else finish();
		});
	};
	const flush = () => {
		if (flushing || queue.length === 0 || state !== STATE_OPEN) return;
		flushing = true;
		let bufs = queue;
		queue = spare;
		spare = bufs;
		queue.length = 0;
		let pendingBytes = bytes;
		const onDone = (err, written = 0) => {
			if (state !== STATE_OPEN) {
				if (failedFd !== null) {
					const fdToClose = failedFd;
					failedFd = null;
					discardFile(fdToClose);
				}
				return;
			}
			if (err) {
				flushing = false;
				fail(err);
				return;
			}
			if (written <= 0 || written > pendingBytes) {
				flushing = false;
				fail(/* @__PURE__ */ new Error("File write made no progress."));
				return;
			}
			bytes -= written;
			pendingBytes -= written;
			if (pendingBytes > 0) {
				let skipped = written;
				let index = 0;
				while (skipped >= bufs[index].length) skipped -= bufs[index++].length;
				bufs = bufs.slice(index);
				if (skipped > 0) bufs[0] = bufs[0].subarray(skipped);
				if (bufs.length === 1) {
					const buf = bufs[0];
					external_node_fs_.write(fd, buf, 0, buf.length, null, onDone);
				} else external_node_fs_.writev(fd, bufs, onDone);
				return;
			}
			flushing = false;
			spare.length = 0;
			if (bytes < BUFFER_LIMIT) settleDrain();
			if (queue.length > 0) flush();
			else if (endResolve) close();
		};
		if (bufs.length === 1) {
			const buf = bufs[0];
			external_node_fs_.write(fd, buf, 0, buf.length, null, onDone);
		} else external_node_fs_.writev(fd, bufs, onDone);
	};
	const onOpen = (err, openFd) => {
		if (err) return fail(err);
		if (state >= STATE_CLOSED) {
			external_node_fs_.close(openFd);
			return;
		}
		fd = openFd;
		state = STATE_OPEN;
		if (endResolve) if (queue.length > 0) flush();
		else close();
		else if (bytes >= BATCH_BYTES || queue.length >= MAX_WRITE_VECTORS) flush();
		else settleDrain();
	};
	const write = (chunk) => {
		if (state >= STATE_CLOSED || endResolve) return false;
		queue.push(chunk);
		bytes += chunk.length;
		if (state === STATE_OPEN && !flushing && (bytes >= BATCH_BYTES || queue.length >= MAX_WRITE_VECTORS)) flush();
		return bytes < BUFFER_LIMIT && queue.length < MAX_WRITE_VECTORS;
	};
	const waitDrain = () => {
		if (storedError) return Promise.reject(storedError);
		if (state === STATE_OPENING || state === STATE_OPEN && (bytes >= BUFFER_LIMIT || queue.length >= MAX_WRITE_VECTORS)) return drainPromise ??= new Promise((resolve, reject) => {
			drainResolve = resolve;
			drainReject = reject;
		});
		return DRAINED_PROMISE;
	};
	const end = () => {
		if (storedError) return Promise.reject(storedError);
		if (state >= STATE_CLOSED) return DRAINED_PROMISE;
		if (endPromise) return endPromise;
		endPromise = new Promise((resolve, reject) => {
			endResolve = resolve;
			endReject = reject;
			if (state === STATE_OPEN && !flushing) if (queue.length > 0) flush();
			else close();
		});
		return endPromise;
	};
	const destroy = (error) => {
		if (error) {
			fail(error);
			return;
		}
		if (state >= STATE_CLOSED) return;
		resetBuffers();
		flushing = false;
		if (fd !== null) {
			const fdToClose = fd;
			fd = null;
			external_node_fs_.close(fdToClose);
		}
		finish();
	};
	external_node_fs_.open(path, CREATE_FLAGS, mode, (err, openFd) => {
		if (err?.code !== "EEXIST") return onOpen(err, openFd);
		if (state !== STATE_OPENING) return;
		external_node_fs_.rm(path, { force: true }, (rmErr) => {
			if (rmErr) return fail(rmErr);
			if (state !== STATE_OPENING) return;
			external_node_fs_.open(path, CREATE_FLAGS, mode, onOpen);
		});
	});
	return {
		write,
		end,
		destroy,
		waitDrain
	};
}
//#endregion
//#region src/fs/cache.ts
const createCache = () => {
	const m = /* @__PURE__ */ new Map();
	return {
get(k) {
			const v = m.get(k);
			if (m.delete(k)) m.set(k, v);
			return v;
		},
set(k, v) {
			if (m.set(k, v).size > 1e4) m.delete(m.keys().next().value);
		},
		clear() {
			m.clear();
		}
	};
};
//#endregion
//#region src/fs/path-cache.ts
const ENOENT = "ENOENT";
const MAX_SYMLINKS = 64;
const linkSep = process.platform === "win32" ? /[/\\]/ : "/";
const linkParts = (linkname) => linkname.split(linkSep).filter((part) => part && part !== ".");
const createPathCache = (destDirPath, options, opQueue, concurrency) => {
	const { maxDepth = 1024, dmode } = options;
	const dirPromises = createCache();
	const pathConflicts = /* @__PURE__ */ new Map();
	const deferredLinks = [];
	let symlinks;
	const realDirCache = createCache();
	const initializeDestDir = async (destDirPath) => {
		const symbolic = external_node_path_.resolve(destDirPath);
		try {
			await promises_.mkdir(symbolic, { recursive: true });
		} catch (err) {
			if (err.code === ENOENT) {
				const parentDir = external_node_path_.dirname(symbolic);
				if (parentDir === symbolic) throw err;
				await promises_.mkdir(parentDir, { recursive: true });
				await promises_.mkdir(symbolic, { recursive: true });
			} else throw err;
		}
		try {
			return {
				symbolic,
				real: await promises_.realpath(symbolic)
			};
		} catch (err) {
			if (err.code === ENOENT) return {
				symbolic,
				real: symbolic
			};
			throw err;
		}
	};
	const destDirPromise = initializeDestDir(destDirPath);
	destDirPromise.catch(() => {});
	const getRealDir = async (dirPath, errorMessage) => {
		const destDir = await destDirPromise;
		if (dirPath === destDir.symbolic) return destDir.real;
		let promise = realDirCache.get(dirPath);
		if (!promise) {
			promise = promises_.realpath(dirPath).then((realPath) => {
				validateBounds(realPath, destDir.real, errorMessage);
				return realPath;
			});
			realDirCache.set(dirPath, promise);
		}
		return promise;
	};
	const prepareDirectory = async (dirPath, mode) => {
		let promise = dirPromises.get(dirPath);
		if (promise) return promise;
		promise = (async () => {
			if (dirPath === (await destDirPromise).symbolic) return;
			await prepareDirectory(external_node_path_.dirname(dirPath));
			try {
				const stat = await promises_.lstat(dirPath);
				if (stat.isDirectory()) return;
				if (stat.isSymbolicLink()) try {
					const realPath = await getRealDir(dirPath, `Symlink "${dirPath}" points outside the extraction directory.`);
					if ((await promises_.stat(realPath)).isDirectory()) return;
				} catch (err) {
					if (err.code === ENOENT) throw new Error(`Symlink "${dirPath}" points outside the extraction directory.`);
					throw err;
				}
				throw new Error(`"${dirPath}" is not a valid directory component.`);
			} catch (err) {
				if (err.code === ENOENT) {
					await promises_.mkdir(dirPath, { mode: mode ?? options.dmode });
					return;
				}
				throw err;
			}
		})();
		dirPromises.set(dirPath, promise);
		return promise;
	};
	return {
async ready() {
			await destDirPromise;
		},
async preparePath(header) {
			const { name, linkname, type, mode, mtime } = header;
			const normalizedName = normalizeHeaderName(name);
			const destDir = await destDirPromise;
			const outPath = external_node_path_.join(destDir.symbolic, normalizedName);
			if (maxDepth !== Infinity) {
				let depth = 1;
				for (const char of normalizedName) if (char === "/" && ++depth > maxDepth) throw new Error("Tar exceeds max specified depth.");
			}
			const prevOp = pathConflicts.get(normalizedName);
			if (prevOp) {
				if (prevOp === "directory" && type !== "directory" || prevOp !== "directory" && type === "directory") throw new Error(`Path conflict ${type} over existing ${prevOp} at "${name}"`);
				return;
			}
			const parentDir = external_node_path_.dirname(outPath);
			switch (type) {
				case packer_By1HVV7Z_DIRECTORY: {
					pathConflicts.set(normalizedName, packer_By1HVV7Z_DIRECTORY);
					const safeMode = mode === void 0 ? void 0 : mode & 511;
					await prepareDirectory(outPath, dmode ?? safeMode);
					if (mtime) await promises_.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				}
				case packer_By1HVV7Z_FILE:
					pathConflicts.set(normalizedName, packer_By1HVV7Z_FILE);
					await prepareDirectory(parentDir);
					return external_node_path_.join(await getRealDir(parentDir, `File "${name}" points outside the extraction directory.`), external_node_path_.basename(outPath));
				case packer_By1HVV7Z_SYMLINK: {
					pathConflicts.set(normalizedName, packer_By1HVV7Z_SYMLINK);
					if (!linkname) return;
					validateBounds(external_node_path_.resolve(parentDir, linkname), destDir.symbolic, `Symlink "${linkname}" points outside the extraction directory.`);
					await prepareDirectory(parentDir);
					const realParentDir = await promises_.realpath(parentDir);
					validateBounds(realParentDir, destDir.real, "Symlink parent changed.");
					validateBounds(external_node_path_.resolve(realParentDir, linkname), destDir.real, `Symlink "${linkname}" points outside the extraction directory.`);
					const realOutPath = external_node_path_.join(realParentDir, external_node_path_.basename(outPath));
					try {
						await promises_.symlink(linkname, realOutPath);
					} catch (err) {
						if (err.code !== "EEXIST") throw err;
						await promises_.rm(realOutPath, { force: true });
						if (await promises_.realpath(parentDir) !== realParentDir) throw new Error("Symlink parent changed.");
						await promises_.symlink(linkname, realOutPath);
					}
					(symlinks ??= []).push([normalizedName, linkname]);
					dirPromises.clear();
					realDirCache.clear();
					if (mtime) await promises_.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				}
				case packer_By1HVV7Z_LINK: {
					pathConflicts.set(normalizedName, packer_By1HVV7Z_LINK);
					if (!linkname) return;
					if (external_node_path_.isAbsolute(linkname)) throw new Error(`Hardlink "${linkname}" points outside the extraction directory.`);
					const linkTarget = external_node_path_.join(destDir.symbolic, linkname);
					validateBounds(linkTarget, destDir.symbolic, `Hardlink "${linkname}" points outside the extraction directory.`);
					await prepareDirectory(parentDir);
					if (linkTarget !== outPath) deferredLinks.push({
						linkTarget,
						outPath
					});
					return;
				}
				default: return;
			}
		},
async checkSymlinks() {
			if (!symlinks) return;
			const { symbolic: dest, real } = await destDirPromise;
			const realPrefix = real + external_node_path_.sep;
			const root = external_node_path_.parse(real).root;
			const depth = linkParts(real.slice(root.length)).length;
			const targetParts = (linkname, resolvedParts, message) => {
				if (!external_node_path_.isAbsolute(linkname)) return linkParts(linkname);
				validateBounds(linkname, real, message);
				resolvedParts.length = 0;
				const parts = linkParts(linkname.slice(root.length));
				parts.splice(0, depth);
				return parts;
			};
			const getSymlinkError = async ([name, storedLinkname]) => {
				const outPath = external_node_path_.join(dest, name);
				try {
					try {
						const resolved = await promises_.realpath(outPath);
						if (resolved !== real && !resolved.startsWith(realPrefix)) throw new Error(`Symlink "${storedLinkname}" points outside the extraction directory.`);
						return;
					} catch (err) {
						if (err.code !== ENOENT) throw err;
					}
					if (!(await promises_.lstat(outPath)).isSymbolicLink()) return;
					const linkname = await promises_.readlink(outPath);
					const message = `Symlink "${linkname}" points outside the extraction directory.`;
					const realParent = await promises_.realpath(external_node_path_.dirname(outPath));
					validateBounds(realParent, real, message);
					const resolvedParts = linkParts(external_node_path_.relative(real, realParent));
					const pendingParts = targetParts(linkname, resolvedParts, message);
					let followedSymlinks = 0;
					for (let i = 0; i < pendingParts.length; i++) {
						const part = pendingParts[i];
						if (part === "..") {
							if (!resolvedParts.length) throw new Error(message);
							resolvedParts.pop();
							continue;
						}
						resolvedParts.push(part);
						const nextPath = external_node_path_.join(real, ...resolvedParts);
						let nextStat;
						try {
							nextStat = await promises_.lstat(nextPath);
						} catch (err) {
							if (err.code === ENOENT) continue;
							throw err;
						}
						if (!nextStat.isSymbolicLink()) continue;
						if (++followedSymlinks > MAX_SYMLINKS) throw new Error(message);
						const nextLink = await promises_.readlink(nextPath);
						resolvedParts.pop();
						pendingParts.splice(i + 1, 0, ...targetParts(nextLink, resolvedParts, message));
					}
				} catch (err) {
					if (err.code !== ENOENT) return err;
				}
			};
			for (let start = 0; start < symlinks.length; start += concurrency) {
				const batch = symlinks.slice(start, start + concurrency);
				const errors = await Promise.all(batch.map((symlink) => opQueue.add(() => getSymlinkError(symlink))));
				for (const [i, error] of errors.entries()) {
					if (error === void 0) continue;
					await promises_.rm(external_node_path_.join(dest, batch[i][0]), { force: true });
					throw error;
				}
			}
		},
async applyLinks() {
			const destRoot = (await destDirPromise).real;
			for (const { linkTarget, outPath } of deferredLinks) try {
				const realTargetDir = await promises_.realpath(external_node_path_.dirname(linkTarget));
				validateBounds(realTargetDir, destRoot, `Hardlink "${linkTarget}" points outside the extraction directory.`);
				const realTarget = external_node_path_.join(realTargetDir, external_node_path_.basename(linkTarget));
				const [targetResult, outDirResult] = await Promise.allSettled([opQueue.add(() => promises_.lstat(realTarget)), opQueue.add(() => promises_.realpath(external_node_path_.dirname(outPath)))]);
				if (targetResult.status === "rejected") throw targetResult.reason;
				const targetStat = targetResult.value;
				if (targetStat.isSymbolicLink()) throw new Error(`Hardlink "${linkTarget}" is a symlink.`);
				if (outDirResult.status === "rejected") throw outDirResult.reason;
				const realOutDir = outDirResult.value;
				validateBounds(realOutDir, destRoot, `Hardlink "${outPath}" points outside the extraction directory.`);
				const realOutPath = external_node_path_.join(realOutDir, external_node_path_.basename(outPath));
				try {
					await promises_.link(realTarget, realOutPath);
				} catch (err) {
					const code = err.code;
					if (code !== "EEXIST" && code !== ENOENT) throw err;
					try {
						const outStat = await promises_.lstat(realOutPath);
						if (outStat.dev === targetStat.dev && outStat.ino === targetStat.ino) continue;
						await promises_.rm(realOutPath, { force: true });
					} catch (err) {
						if (err.code !== ENOENT) throw err;
					}
					await promises_.link(realTarget, realOutPath);
				}
				const linkStat = await promises_.lstat(realOutPath);
				if (linkStat.dev !== targetStat.dev || linkStat.ino !== targetStat.ino) {
					await promises_.rm(realOutPath, { force: true });
					throw new Error(`Hardlink target "${linkTarget}" changed during creation for link at "${outPath}".`);
				}
			} catch (err) {
				if (err.code === ENOENT) throw new Error(`Hardlink target "${linkTarget}" does not exist for link at "${outPath}".`);
				throw err;
			}
		}
	};
};
//#endregion
//#region src/fs/unpack.ts
function unpackTar(directoryPath, options = {}) {
	const unpacker = createUnpacker(options);
	const concurrency = options.concurrency || (0,external_node_os_.cpus)().length || 8;
	const opQueue = createOperationQueue(concurrency);
	let cancelError;
	const pathCache = createPathCache(directoryPath, options, opQueue, concurrency);
	let currentFileStream = null;
	const fileStreams = /* @__PURE__ */ new Set();
	let needsDrain = false;
	const writeCurrent = (chunk) => {
		const writeOk = currentFileStream.write(chunk);
		if (!writeOk) needsDrain = true;
		return writeOk;
	};
	const onFileError = (err) => {
		if (!writable.destroyed) writable.destroy(err);
	};
	const closeCurrent = () => {
		const stream = currentFileStream;
		currentFileStream = null;
		opQueue.add(() => stream.end()).then(() => fileStreams.delete(stream), (err) => {
			fileStreams.delete(stream);
			onFileError(err);
		});
	};
	const writable = new external_node_stream_.Writable({
		async write(chunk, _, cb) {
			let pendingFileOpens;
			let writeError;
			try {
				unpacker.write(chunk);
				if (unpacker.isEntryActive()) {
					if (currentFileStream) {
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							const fed = unpacker.streamBody(writeCurrent);
							if (needsDrain) await currentFileStream.waitDrain();
							else if (fed === 0) return;
						}
						if (!unpacker.skipPadding()) return;
						closeCurrent();
					} else if (!unpacker.skipEntry()) return;
				}
				while (true) {
					const header = unpacker.readHeader();
					if (header === void 0 || header === null) return;
					const transformedHeader = transformHeader(header, options);
					if (!transformedHeader) {
						if (!unpacker.skipEntry()) return;
						continue;
					}
					const outPath = await opQueue.add(() => pathCache.preparePath(transformedHeader));
					if (cancelError) throw cancelError;
					if (outPath) {
						const safeMode = transformedHeader.mode === void 0 ? void 0 : transformedHeader.mode & 511;
						currentFileStream = createFileSink(outPath, {
							mode: options.fmode ?? safeMode,
							mtime: transformedHeader.mtime ?? void 0
						}, onFileError);
						fileStreams.add(currentFileStream);
						(pendingFileOpens ??= []).push(currentFileStream.waitDrain().catch((error) => error));
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							const fed = unpacker.streamBody(writeCurrent);
							if (needsDrain) await currentFileStream.waitDrain();
							else if (fed === 0) return;
						}
						if (!unpacker.skipPadding()) return;
						closeCurrent();
					} else if (!unpacker.skipEntry()) return;
				}
			} catch (err) {
				writeError = err;
			} finally {
				const openError = pendingFileOpens ? (await Promise.all(pendingFileOpens)).find((error) => error) : void 0;
				cb(cancelError ?? openError ?? writeError);
			}
		},
		async final(cb) {
			try {
				unpacker.end();
				unpacker.finish();
				if (currentFileStream) closeCurrent();
				await pathCache.ready();
				await opQueue.onIdle();
				if (cancelError) throw cancelError;
				await pathCache.checkSymlinks();
				await pathCache.applyLinks();
				cb();
			} catch (err) {
				cb(err);
			}
		},
		destroy(error, callback) {
			const hasWork = fileStreams.size > 0 || writable.writableLength > 0 || writable.writableEnded && !writable.writableFinished;
			if (!error && !hasWork) {
				callback(null);
				return;
			}
			cancelError = error ?? AbortSignal.abort().reason;
			for (const stream of fileStreams) stream.destroy(cancelError);
			fileStreams.clear();
			currentFileStream = null;
			callback(cancelError);
		}
	});
	return writable;
}
//#endregion



/***/ })

};
