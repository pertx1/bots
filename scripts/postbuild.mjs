// Inyecta en out/sw.js la lista de archivos a precachear y una versión única.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
const SKIP = [/^sw\.js$/, /\.txt$/, /^404/, /^_not-found/, /\.map$/, /^icons\/(icon-512|maskable-512)\.png$/];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(OUT)
  .map((p) => relative(OUT, p).split(sep).join("/"))
  .filter((f) => !SKIP.some((r) => r.test(f)));

const hash = createHash("sha1");
for (const f of files) hash.update(f).update(readFileSync(join(OUT, f)));
const version = hash.digest("hex").slice(0, 10);

const urls = ["/", ...files.filter((f) => f !== "index.html").map((f) => `/${f}`)];
const swPath = join(OUT, "sw.js");
const sw = readFileSync(swPath, "utf8")
  .replace("__VERSION__", version)
  .replace(/const PRECACHE = \[[^\]]*\];/, `const PRECACHE = ${JSON.stringify(urls)};`);
writeFileSync(swPath, sw);
console.log(`sw.js: ${urls.length} archivos precacheados, versión ${version}`);
