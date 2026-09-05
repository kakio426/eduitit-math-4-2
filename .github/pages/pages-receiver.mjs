// Standalone public receiver. Built-ins only; never imports private source, QA,
// vault credentials, or the App key. Installation alone never publishes lessons.
import {createHash} from "node:crypto";
import {constants} from "node:fs";
import {lstat, mkdir, open, readFile, realpath, statfs, writeFile} from "node:fs/promises";
import path from "node:path";
import {Readable} from "node:stream";
import {fileURLToPath} from "node:url";
import {createGunzip} from "node:zlib";

export const RECEIVER_REPOSITORIES = Object.freeze(["kakio426/eduitit-math-3-2", "kakio426/eduitit-math-4-2"]);
export const RECEIVER_APP_ACTOR = "ai-mart-pages-kakio426[bot]";
export const RELEASE_MANIFEST = "pages-release.json", DEPLOYMENT_MANIFEST = "pages-deployment.json";
export const MAX_SITE_BYTES = 950_000_000, MAX_ARCHIVE_BYTES = 1_000_000_000;
const SHA = /^[a-f0-9]{64}$/u, OID = /^[a-f0-9]{40,64}$/u, OP = /^[A-Za-z0-9_-]{1,160}$/u;
const MATH_LESSON = /^[1-6]-[12]-\d+-\d+-[a-z0-9-]+$/u;
const PRODUCT_ROOTS = {socialmon: ["_social", "lessons"].join("_"), sciencemon: ["_science", "lessons"].join("_")};
const assert = (ok, message) => {if (!ok) throw new Error(message);};
export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const encode = value => Buffer.from(`${JSON.stringify(value)}\n`);
function exactKeys(value, keys) {assert(value && same(Object.keys(value).sort(), [...keys].sort()), "Unexpected public metadata fields");}
export function lessonRoute(folder) {
  assert(typeof folder === "string", "Invalid lesson route");
  const parts = folder.split("/");
  if (parts.length === 1 && MATH_LESSON.test(folder)) return {product: "mathmon", repository: RECEIVER_REPOSITORIES[folder.startsWith("4-2-") ? 1 : 0]};
  for (const [product, prefix] of Object.entries(PRODUCT_ROOTS)) if (parts.length === 2 && parts[0] === prefix && /^[a-z0-9][a-z0-9-]{1,180}$/u.test(parts[1]))
    return {product, repository: RECEIVER_REPOSITORIES[0]};
  throw new Error("Invalid product lesson route");
}
export function deploymentIdentity(value) {
  assert(value && typeof value.deploymentId === "string" && /^[A-Za-z0-9._:-]{1,160}$/u.test(value.deploymentId)
    && SHA.test(value.artifactSha256) && OID.test(value.sourceRevision)
    && (value.transactionId === null || /^[A-Za-z0-9_-]{1,100}$/u.test(value.transactionId)), "Invalid deployment identity");
  return {deploymentId: value.deploymentId, artifactSha256: value.artifactSha256,
    sourceRevision: value.sourceRevision, transactionId: value.transactionId};
}
export function safePublicPath(value) {
  assert(typeof value === "string" && value.length > 0 && value.length <= 240
    && /^[A-Za-z0-9_.\/-]+$/u.test(value) && !value.startsWith("/")
    && !value.split("/").some(part => !part || part === "." || part === ".." || (part.startsWith(".") && part !== ".nojekyll")), "Unsafe public runtime path");
  assert(!/(?:^|\/)(?:node_modules|tooling|docs|prompts?|vault|migration|source|contracts?|qa|test[s]?|backups?)(?:\/|$)/iu.test(value)
    && !/(?:^|\/)(?:AGENTS|PROMPT|CHECKLIST|HANDOFF|PLAN|README)(?:\.|$)/iu.test(value), "Internal file cannot enter public runtime");
  assert(value === ".nojekyll" || /\.(?:html|js|mjs|css|json|png|jpe?g|webp|gif|svg|ico|avif|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|otf)$/iu.test(value), "Non-runtime file extension");
  assert(value !== DEPLOYMENT_MANIFEST, "Deployment control metadata is reserved");
  return value;
}
export function fileSetSha256(files) {
  return sha256(encode([...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
    .map(file => ({path: file.path, bytes: file.bytes, sha256: file.sha256}))));
}
export function validateReleaseManifest(value) {
  exactKeys(value, ["standard", "repository", "sourceRevision", "product", "lessonFolders", "selectedLessonFolders", "files", "targetFileSetSha256"]);
  assert(value.standard === "eduitit-pages-public-release-v1" && RECEIVER_REPOSITORIES.includes(value.repository)
    && OID.test(value.sourceRevision) && ["mathmon", "socialmon", "sciencemon"].includes(value.product), "Public release scope mismatch");
  for (const field of ["lessonFolders", "selectedLessonFolders"]) assert(Array.isArray(value[field]) && value[field].length > 0
    && value[field].length <= 1000 && new Set(value[field]).size === value[field].length
    && value[field].every(folder => lessonRoute(folder).repository === value.repository), "Invalid selected lesson scope");
  assert(value.selectedLessonFolders.every(folder => value.lessonFolders.includes(folder)), "Selected lesson omitted from final site");
  assert(value.selectedLessonFolders.every(folder => lessonRoute(folder).product === value.product), "Selected release must name exactly its validated product");
  assert(Array.isArray(value.files) && value.files.length > 0 && value.files.length <= 25_000, "Bounded exact public file set required");
  const seen = new Set(); let bytes = 0;
  for (const file of value.files) {
    exactKeys(file, ["path", "bytes", "sha256"]); safePublicPath(file.path);
    assert(file.path !== RELEASE_MANIFEST && !seen.has(file.path) && !seen.has(file.path.toLowerCase()), "Duplicate or reserved public file");
    seen.add(file.path); seen.add(file.path.toLowerCase());
    assert(SHA.test(file.sha256) && Number.isSafeInteger(file.bytes) && file.bytes >= 0, "Invalid public file digest/size");
    bytes += file.bytes; assert(bytes <= MAX_SITE_BYTES, "Site exceeds 950 MB");
  }
  for (const file of value.files) {
    let dir = path.posix.dirname(file.path);
    while (dir !== ".") {assert(!seen.has(dir.toLowerCase()), "File/directory collision"); dir = path.posix.dirname(dir);}
    if (/\.html$/iu.test(file.path) && file.path !== "index.html") assert(value.lessonFolders.some(folder => file.path.startsWith(`${folder}/`)), "Unlisted lesson HTML");
  }
  assert(value.lessonFolders.every(folder => seen.has(`${folder}/index.html`)), "Lesson entry point missing");
  assert(SHA.test(value.targetFileSetSha256) && fileSetSha256(value.files) === value.targetFileSetSha256, "Public file-set SHA mismatch");
  return {manifest: value, runtimeBytes: bytes};
}
export function assertPreservesUnselected(previous, next, {selectedLessonFolders = next.selectedLessonFolders, allowSelectedRemoval = false} = {}) {
  validateReleaseManifest(previous); validateReleaseManifest(next);
  assert(Array.isArray(selectedLessonFolders) && selectedLessonFolders.length > 0 && selectedLessonFolders.every(folder =>
    previous.lessonFolders.includes(folder) || next.lessonFolders.includes(folder)), "Invalid transaction preservation scope");
  const selected = new Set(selectedLessonFolders), files = new Map(next.files.map(file => [file.path, file]));
  for (const folder of previous.lessonFolders) assert(next.lessonFolders.includes(folder) || (allowSelectedRemoval && selected.has(folder)), "Published lesson removal is forbidden");
  for (const old of previous.files) if (![...selected].some(folder => old.path.startsWith(`${folder}/`))) {
    assert(same(files.get(old.path), old), `Unselected published file changed or omitted: ${old.path}`);
  }
  for (const folder of next.lessonFolders) assert(previous.lessonFolders.includes(folder) || selected.has(folder), "Unapproved new lesson");
}
// This is a fail-closed static reference guard, not browser/flow QA. Private
// packaging must resolve dynamic dependencies before seeking payload approval.
export function assertLessonLocalReferences(manifest, filePath, text) {
  const folder = manifest.selectedLessonFolders.find(item => filePath.startsWith(`${item}/`));
  if (!folder) return;
  assert(!/<base\b/iu.test(text), "Selected lesson cannot change its document base");
  const references = [], markup = /\.html$/iu.test(filePath) ? text.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script\s*>)/giu, "$1$2") : text;
  if (/\.(?:html|css)$/iu.test(filePath)) {
    for (const match of markup.matchAll(/(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^\s"')]+)/giu)) references.push(match[1] || match[2]);
    for (const match of markup.matchAll(/srcset\s*=\s*["']([^"']+)["']/giu)) references.push(...match[1].split(",").map(item => item.trim().split(/\s/u)[0]));
  }
  if (/\.(?:html|m?js)$/iu.test(filePath)) for (const match of text.matchAll(/(?:fetch|import|importScripts)\s*\(\s*["']([^"']+)["']|(?:from\s+)["']([^"']+)["']/giu)) references.push(match[1] || match[2]);
  const files = new Set(manifest.files.map(file => file.path));
  for (let reference of references) {
    if (!reference || reference.startsWith("#")) continue;
    if (reference === "data:,") continue;
    if (/^data:image\/svg\+xml[;,]/iu.test(reference) && !/;base64,/iu.test(reference)) continue;
    assert(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/iu.test(reference), "Selected lesson reference is external or site-wide");
    assert(!reference.includes("${") && !reference.includes("\\"), "Unresolved dynamic/escaped selected lesson reference");
    reference = reference.split(/[?#]/u)[0];
    try {reference = decodeURIComponent(reference);} catch {throw new Error("Invalid encoded lesson reference");}
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), reference));
    assert(resolved.startsWith(`${folder}/`), "Selected lesson reference escapes its delivery folder");
    assert(files.has(resolved) || files.has(`${resolved.replace(/\/$/u, "")}/index.html`), `Selected lesson reference omitted from archive: ${resolved}`);
  }
}
function scanPublicChunk(bytes, carry = "") {
  const text = carry + bytes.toString("utf8");
  assert(!/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|data:image\/[^;\s]+;base64,|\/Users\/|PAGES_APP_PRIVATE_KEY)/u.test(text), "Secret, private path, or inline raster payload in public bytes");
  return text.slice(-4096);
}
function tarString(bytes) {const end = bytes.indexOf(0); return bytes.subarray(0, end < 0 ? bytes.length : end).toString("utf8");}
function tarNumber(bytes) {const raw = tarString(bytes).trim(); assert(/^[0-7]+$/u.test(raw), "Invalid tar numeric field"); return Number.parseInt(raw, 8);}

// Only POSIX ustar regular files: no directories, PAX/GNU extensions, links,
// device nodes or shell extraction. The manifest MUST be the first member.
export async function verifyReleaseArchive({archive, artifact, outputRoot, signal, minimumFreeBytes = 1024 ** 3, enforceLessonIsolation = true} = {}) {
  assert(SHA.test(artifact?.sha256) && OID.test(artifact.sourceRevision) && SHA.test(artifact.targetFileSetSha256)
    && Number.isSafeInteger(artifact.bytes) && artifact.bytes > 0 && artifact.bytes <= MAX_ARCHIVE_BYTES
    && Number.isSafeInteger(artifact.siteBytes) && artifact.siteBytes > 0 && artifact.siteBytes <= MAX_SITE_BYTES, "Invalid archive approval descriptor");
  assert(Number.isSafeInteger(minimumFreeBytes) && minimumFreeBytes >= 1024 ** 3, "Insufficient receiver storage reserve");
  if (outputRoot) {
    const parent = path.dirname(path.resolve(outputRoot)); assert(await realpath(parent) === parent, "Extraction parent must be canonical");
    const volume = await statfs(parent, {bigint: true});
    assert(Number(volume.bavail * volume.bsize) >= minimumFreeBytes + artifact.siteBytes, "Insufficient receiver disk space");
    await mkdir(outputRoot, {mode: 0o700}); // Exclusive: never reuse/clean someone else's output.
  }
  let compressedBytes = 0, tarBytes = 0, logicalBytes = 0, member = 0, manifest, expected, handle;
  const compressedHash = createHash("sha256"), seen = new Set();
  async function* bounded() {for await (const chunk of archive) {signal?.throwIfAborted(); compressedBytes += chunk.length;
    assert(compressedBytes <= artifact.bytes, "Compressed archive exceeds approved size"); compressedHash.update(chunk); yield chunk;}}
  const source = Readable.from(bounded()), unzip = createGunzip(); source.on("error", error => unzip.destroy(error)); source.pipe(unzip);
  const iterator = unzip[Symbol.asyncIterator](); let buffer = Buffer.alloc(0), ended = false;
  const abort = () => {source.destroy(new Error("Receiver cancelled")); unzip.destroy(new Error("Receiver cancelled"));};
  signal?.addEventListener("abort", abort, {once: true});
  async function take(max) {
    signal?.throwIfAborted();
    while (!buffer.length && !ended) {const next = await iterator.next(); ended = next.done; if (!ended) {
      buffer = next.value; tarBytes += buffer.length; assert(tarBytes <= artifact.siteBytes + 32 * 1024 ** 2, "Decompressed tar exceeds bounded overhead");}}
    if (!buffer.length) return null; const chunk = buffer.subarray(0, max); buffer = buffer.subarray(chunk.length); return chunk;
  }
  async function exact(size) {const chunks = []; let left = size; while (left) {const chunk = await take(left); assert(chunk, "Truncated tar archive"); chunks.push(chunk); left -= chunk.length;} return Buffer.concat(chunks, size);}
  try {
    for (;;) {
      const header = await exact(512);
      if (header.every(byte => byte === 0)) {assert((await exact(512)).every(byte => byte === 0), "Invalid tar end marker");
        for (let tail; (tail = await take(65_536));) assert(tail.every(byte => byte === 0), "Trailing tar payload"); break;}
      assert(++member <= 25_001, "Too many tar files");
      const sum = header.reduce((total, byte, index) => total + (index >= 148 && index < 156 ? 32 : byte), 0);
      assert(tarNumber(header.subarray(148, 156)) === sum && tarString(header.subarray(257, 263)) === "ustar", "Invalid ustar checksum/format");
      assert((header[156] === 0 || header[156] === 48) && !tarString(header.subarray(157, 257)), "Tar links and nonregular members forbidden");
      const mode = tarNumber(header.subarray(100, 108)); assert((mode & 0o7111) === 0, "Executable/special tar modes forbidden");
      const prefix = tarString(header.subarray(345, 500)), name = tarString(header.subarray(0, 100));
      const target = safePublicPath(prefix ? `${prefix}/${name}` : name), size = tarNumber(header.subarray(124, 136));
      assert(!seen.has(target.toLowerCase()), "Duplicate tar path"); seen.add(target.toLowerCase());
      assert(member !== 1 || target === RELEASE_MANIFEST, "Public manifest must be the first tar member");
      assert(size <= MAX_SITE_BYTES && (target !== RELEASE_MANIFEST || size <= 8 * 1024 ** 2), "Oversized tar member");
      if (target !== RELEASE_MANIFEST) assert(expected?.get(target)?.bytes === size, "Unlisted or wrong-sized tar member");
      logicalBytes += size; assert(logicalBytes <= artifact.siteBytes, "Archive exceeds approved site bytes");
      if (outputRoot) {const destination = path.join(outputRoot, target); await mkdir(path.dirname(destination), {recursive: true, mode: 0o700});
        handle = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);}
      const digest = createHash("sha256"), chunks = [];
      const inspectText = enforceLessonIsolation && target !== RELEASE_MANIFEST && /\.(?:html|css|m?js|json|svg)$/iu.test(target)
        && manifest.selectedLessonFolders.some(folder => target.startsWith(`${folder}/`));
      if (inspectText) assert(size <= 32 * 1024 ** 2, "Selected runtime text exceeds bounded reference inspection");
      let left = size, carry = "";
      while (left) {const chunk = await take(Math.min(left, 65_536)); assert(chunk, "Truncated tar member"); left -= chunk.length;
        digest.update(chunk); carry = scanPublicChunk(chunk, carry); if (target === RELEASE_MANIFEST || inspectText) chunks.push(chunk);
        if (handle) {let offset = 0; while (offset < chunk.length) {const written = await handle.write(chunk.subarray(offset)); assert(written.bytesWritten > 0, "Receiver write stalled"); offset += written.bytesWritten;}}}
      if (handle) {await handle.sync(); await handle.close(); handle = null;}
      if (target === RELEASE_MANIFEST) {manifest = JSON.parse(Buffer.concat(chunks).toString("utf8")); validateReleaseManifest(manifest);
        assert(manifest.sourceRevision === artifact.sourceRevision && manifest.targetFileSetSha256 === artifact.targetFileSetSha256, "Manifest differs from approved artifact");
        expected = new Map(manifest.files.map(file => [file.path, file]));}
      else {assert(digest.digest("hex") === expected.get(target).sha256, `Public file SHA mismatch: ${target}`);
        if (inspectText) assertLessonLocalReferences(manifest, target, Buffer.concat(chunks).toString("utf8"));}
      assert((await exact((512 - size % 512) % 512)).every(byte => byte === 0), "Nonzero tar padding");
    }
    assert(manifest && member === manifest.files.length + 1 && logicalBytes === artifact.siteBytes, "Archive omitted approved files");
    assert(compressedBytes === artifact.bytes && compressedHash.digest("hex") === artifact.sha256, "Archive SHA/size mismatch");
    return {verified: true, sanitized: true, ...artifact, manifest, measuredSiteBytes: logicalBytes, lessonIsolationEnforced: enforceLessonIsolation};
  } finally {if (handle) await handle.close().catch(() => {}); source.destroy(); unzip.destroy(); signal?.removeEventListener("abort", abort);}
}
export async function verifyReleaseArchiveFile({artifact, ...options}) {
  assert(path.isAbsolute(artifact.path) && await realpath(artifact.path) === artifact.path, "Archive must use its canonical absolute path");
  const info = await lstat(artifact.path); assert(info.isFile() && !info.isSymbolicLink() && info.size === artifact.bytes, "Archive regular file/size mismatch");
  const handle = await open(artifact.path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {const before = await handle.stat(); const result = await verifyReleaseArchive({...options, artifact, archive: handle.createReadStream({autoClose: false})});
    const after = await handle.stat(); assert(before.size === after.size && before.mtimeMs === after.mtimeMs && before.ino === after.ino, "Archive changed during verification"); return result;
  } finally {await handle.close();}
}
export async function boundedResponse(response, maximum, signal) {
  assert(response.ok && response.body, `Public GET failed: HTTP ${response.status}`);
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {signal?.throwIfAborted(); size += chunk.length; assert(size <= maximum, "Response exceeded bounded size"); chunks.push(Buffer.from(chunk));}
  return Buffer.concat(chunks, size);
}
export async function publicJson(url, {fetchImpl = fetch, signal, maximum = 8 * 1024 ** 2} = {}) {
  const parsed = new URL(url); assert(parsed.origin === "https://kakio426.github.io"
    && RECEIVER_REPOSITORIES.some(repository => parsed.pathname.startsWith(`/${repository.split("/")[1]}/`)), "Public URL escaped enabled sites");
  parsed.searchParams.set("_pages_check", `${Date.now()}`);
  const response = await fetchImpl(parsed, {redirect: "error", signal, headers: {"Cache-Control": "no-cache"}});
  if (response.status === 404) throw new Error("Bootstrap prerequisite: existing Pages site has no verified release identity; non-deploy environment preflight remains available");
  return JSON.parse(await boundedResponse(response, maximum, signal));
}
export async function readLiveRelease({repository, ...options} = {}) {
  assert(RECEIVER_REPOSITORIES.includes(repository), "Repository outside Pages allowlist");
  const base = `https://kakio426.github.io/${repository.split("/")[1]}/`;
  const control = await publicJson(`${base}${DEPLOYMENT_MANIFEST}`, options), identity = deploymentIdentity(control.identity);
  assert(control.standard === "eduitit-pages-live-deployment-v1" && control.repository === repository && OP.test(control.operationId)
    && SHA.test(control.targetFileSetSha256), "Invalid live control manifest");
  const manifest = await publicJson(`${base}${RELEASE_MANIFEST}`, options); validateReleaseManifest(manifest);
  assert(manifest.sourceRevision === identity.sourceRevision && manifest.targetFileSetSha256 === control.targetFileSetSha256, "Live manifests disagree");
  return {identity, manifest, control};
}
export async function verifyLegacyLiveBaseline({repository, manifest, artifact, identity, fetchImpl = fetch, signal} = {}) {
  validateReleaseManifest(manifest); deploymentIdentity(identity);
  assert(manifest.repository === repository && identity.transactionId === null
    && identity.deploymentId === `legacy:${manifest.targetFileSetSha256}`
    && identity.artifactSha256 === artifact.sha256 && identity.sourceRevision === manifest.sourceRevision
    && artifact.targetFileSetSha256 === manifest.targetFileSetSha256, "Legacy baseline identity is not bound to exact preserved bytes");
  const base = `https://kakio426.github.io/${repository.split("/")[1]}/`;
  const absent = await fetchImpl(`${base}${DEPLOYMENT_MANIFEST}?_pages_check=${Date.now()}`, {redirect: "error", signal});
  assert(absent.status === 404, "Legacy transition refused: a managed deployment identity already exists or cannot be inspected");
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(8, manifest.files.length)}, async () => {
    while (cursor < manifest.files.length) {
      const file = manifest.files[cursor++], url = new URL(file.path, base); url.searchParams.set("_pages_check", String(Date.now()));
      const response = await fetchImpl(url, {redirect: "error", signal, headers: {"Cache-Control": "no-cache"}});
      assert(response.ok && response.body, `Legacy baseline live file is unavailable: ${file.path}`);
      let count = 0; const digest = createHash("sha256");
      for await (const chunk of response.body) {signal?.throwIfAborted(); count += chunk.length; assert(count <= file.bytes, "Legacy live file size changed"); digest.update(chunk);}
      assert(count === file.bytes && digest.digest("hex") === file.sha256, `Legacy live baseline hash differs: ${file.path}`);
    }
  }));
  return {identity: deploymentIdentity(identity), manifest, control: null, legacyBaseline: true};
}
export function validateReceiverRequest(request, {repository, operationId, now = Date.now()} = {}) {
  exactKeys(request, ["standard", "repository", "operationId", "transactionId", "purpose", "artifact", "expectedIdentity", "releaseSetSha256", "approvedAt", "expiresAt", ...(request.legacyBaseline ? ["legacyBaseline"] : [])]);
  assert(request.standard === "eduitit-pages-receiver-request-v1" && RECEIVER_REPOSITORIES.includes(repository) && request.repository === repository
    && OP.test(operationId) && request.operationId === operationId && /^[A-Za-z0-9_-]{1,100}$/u.test(request.transactionId)
    && ["deploy", "rollback"].includes(request.purpose), "Receiver request scope mismatch");
  assert(operationId === `${request.transactionId}-${request.purpose}-${repository.split("/")[1]}`, "Operation ID not bound to transaction");
  assert(SHA.test(request.releaseSetSha256) && Date.parse(request.approvedAt) <= now && Date.parse(request.expiresAt) > now, "Expired/missing final release-set approval");
  exactKeys(request.artifact, ["sha256", "bytes", "siteBytes", "targetFileSetSha256", "sourceRevision"]);
  deploymentIdentity(request.expectedIdentity);
  if (request.legacyBaseline) {
    assert(request.purpose === "deploy" && request.expectedIdentity.transactionId === null && request.expectedIdentity.deploymentId.startsWith("legacy:"), "Legacy baseline is only valid for a first approved deployment");
    exactKeys(request.legacyBaseline, ["sha256", "bytes", "siteBytes", "targetFileSetSha256", "sourceRevision"]);
    assert(request.legacyBaseline.sha256 === request.expectedIdentity.artifactSha256
      && request.legacyBaseline.sourceRevision === request.expectedIdentity.sourceRevision
      && request.expectedIdentity.deploymentId === `legacy:${request.legacyBaseline.targetFileSetSha256}`, "Legacy rollback descriptor differs from expected identity");
  } else assert(!request.expectedIdentity.deploymentId.startsWith("legacy:"), "First deployment needs its approved rollback baseline archive");
  if (request.purpose === "rollback") assert(request.expectedIdentity.transactionId === request.transactionId, "Rollback cannot overwrite another transaction");
  return request;
}

async function publicReleaseAsset(repository, asset, signal) {
  let url = `https://api.github.com/repos/${repository}/releases/assets/${asset.id}`, response;
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(url); assert(["api.github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(parsed.hostname) && parsed.protocol === "https:", "Release download redirect escaped allowlist");
    response = await fetch(url, {redirect: "manual", signal, headers: {Accept: "application/octet-stream"}});
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    url = new URL(response.headers.get("location"), url).href;
  }
  assert(response?.ok && response.body, "Public release asset download failed"); return response.body;
}

async function cli() {
  const mode = process.argv[2], repository = process.env.GITHUB_REPOSITORY;
  assert(RECEIVER_REPOSITORIES.includes(repository) && process.env.GITHUB_EVENT_NAME === "workflow_dispatch", "Receiver is restricted to enabled repository workflow_dispatch");
  assert(process.env.GITHUB_RUN_ATTEMPT === "1", "Operation reruns forbidden; use a new approved operation ID");
  const signal = AbortSignal.timeout(15 * 60_000), token = process.env.GH_TOKEN; delete process.env.GH_TOKEN;
  assert(token, "Receiver requires only its public repository GITHUB_TOKEN");
  async function api(endpoint) {assert(endpoint.startsWith(`/repos/${repository}/`), "Receiver API scope escaped");
    const response = await fetch(`https://api.github.com${endpoint}`, {redirect: "error", signal,
      headers: {Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10"}});
    return JSON.parse(await boundedResponse(response, 8 * 1024 ** 2, signal));}
  const metadata = await api(`/repos/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`);
  assert(metadata.repository?.full_name === repository && metadata.repository.private === false && metadata.event === "workflow_dispatch", "Receiver run identity mismatch");
  if (mode === "preflight") {
    assert(!process.env.PAGES_APP_PRIVATE_KEY, "Private source App credentials must not exist in receiver");
    const pages = await api(`/repos/${repository}/pages`);
    process.stdout.write(`${JSON.stringify({standard: "eduitit-pages-environment-preflight-v1", repository,
      receiverExecuted: true, publicRepository: true, pagesBuildType: pages.build_type, publicationAttempted: false,
      sourceCredentialsPresent: false, productQaClaimed: false})}\n`); return;
  }
  assert(["prepare", "recheck"].includes(mode), "Usage: pages-receiver.mjs preflight|prepare|recheck");
  const pages = await api(`/repos/${repository}/pages`);
  assert(pages.build_type === "workflow", "Publication activation prerequisite: Pages must explicitly use Actions; non-deploy preflight supports legacy mode");
  assert(metadata.actor?.login === RECEIVER_APP_ACTOR && metadata.triggering_actor?.login === RECEIVER_APP_ACTOR, "Only the scoped delivery App may request publication");
  const operationId = process.env.PAGES_OPERATION_ID, requestSha = process.env.PAGES_REQUEST_SHA256;
  assert(OP.test(operationId) && SHA.test(requestSha), "Invalid receiver dispatch input");
  const runName = `pages:deploy:${operationId}`;
  assert(metadata.display_title === runName, "Operation run name mismatch");
  const runs = await api(`/repos/${repository}/actions/workflows/pages-delivery.yml/runs?event=workflow_dispatch&per_page=100`);
  assert(Array.isArray(runs.workflow_runs) && runs.workflow_runs.filter(run => run.display_title === runName).length === 1, "Duplicate/ambiguous immutable operation runs");
  const release = await api(`/repos/${repository}/releases/tags/pages-op-${operationId}`);
  assert(release.immutable === true && release.draft === false && release.author?.login === RECEIVER_APP_ACTOR, "Approved immutable App release required");
  const requestBytes = Buffer.from(release.body || ""); assert(requestBytes.length <= 16_384 && sha256(requestBytes) === requestSha, "Immutable public request SHA mismatch");
  const request = validateReceiverRequest(JSON.parse(requestBytes), {repository, operationId});
  let live;
  if (request.legacyBaseline) {
    const baselineAssets = release.assets?.filter(asset => asset.name === "baseline.tar.gz") || [];
    assert(baselineAssets.length === 1 && baselineAssets[0].digest === `sha256:${request.legacyBaseline.sha256}`
      && baselineAssets[0].size === request.legacyBaseline.bytes, "Approved immutable baseline archive is missing");
    const baseline = await verifyReleaseArchive({archive: await publicReleaseAsset(repository, baselineAssets[0], signal), artifact: request.legacyBaseline, signal, enforceLessonIsolation: false});
    live = await verifyLegacyLiveBaseline({repository, manifest: baseline.manifest, artifact: request.legacyBaseline, identity: request.expectedIdentity, signal});
  } else live = await readLiveRelease({repository, signal});
  assert(same(live.identity, deploymentIdentity(request.expectedIdentity)), "Expected live deployment identity changed");
  const payload = release.assets?.filter(asset => asset.name === "runtime.tar.gz") || [];
  assert(payload.length === 1 && payload[0].state === "uploaded" && payload[0].size === request.artifact.bytes
    && payload[0].digest === `sha256:${request.artifact.sha256}`, "Immutable release payload metadata mismatch");
  const outputRoot = path.join(process.env.RUNNER_TEMP, `pages-runtime-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`);
  if (mode === "recheck") {
    const manifest = JSON.parse(await readFile(path.join(outputRoot, RELEASE_MANIFEST), "utf8"));
    assertPreservesUnselected(live.manifest, manifest, request.purpose === "rollback"
      ? {selectedLessonFolders: live.manifest.selectedLessonFolders, allowSelectedRemoval: true} : {});
    process.stdout.write("Expected live identity still matches inside serialized deployment job\n"); return;
  }
  // Release assets are public. Never forward even the public GITHUB_TOKEN on
  // redirects to storage; follow only the exact GitHub release asset hosts.
  let url = `https://api.github.com/repos/${repository}/releases/assets/${payload[0].id}`, response;
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(url); assert(["api.github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(parsed.hostname) && parsed.protocol === "https:", "Release download redirect escaped allowlist");
    response = await fetch(url, {redirect: "manual", signal, headers: {Accept: "application/octet-stream"}});
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    url = new URL(response.headers.get("location"), url).href;
  }
  assert(response?.ok && response.body, "Public release asset download failed");
  const verified = await verifyReleaseArchive({archive: response.body, artifact: request.artifact, outputRoot, signal,
    enforceLessonIsolation: request.purpose !== "rollback"});
  assertPreservesUnselected(live.manifest, verified.manifest, request.purpose === "rollback"
    ? {selectedLessonFolders: live.manifest.selectedLessonFolders, allowSelectedRemoval: true} : {});
  const control = {standard: "eduitit-pages-live-deployment-v1", repository, operationId,
    identity: {deploymentId: `${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT}`,
      artifactSha256: request.artifact.sha256, sourceRevision: request.artifact.sourceRevision, transactionId: request.transactionId},
    targetFileSetSha256: request.artifact.targetFileSetSha256};
  const bytes = encode(control); assert(verified.measuredSiteBytes + bytes.length <= MAX_SITE_BYTES, "Deployment metadata exceeds site capacity");
  await writeFile(path.join(outputRoot, DEPLOYMENT_MANIFEST), bytes, {flag: "wx", mode: 0o600});
  await writeFile(process.env.GITHUB_OUTPUT, `runtime_path=${outputRoot}\n`, {flag: "a"});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().catch(error => {process.stderr.write(`${error.message}\n`); process.exitCode = 1;});
}
