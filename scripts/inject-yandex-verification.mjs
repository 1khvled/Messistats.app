import fs from "fs";
import path from "path";

const dist = "./dist";
const META =
  '<meta name="yandex-verification" content="197936edd518d1a5"/><meta name="yandex-verification" content="82490b828a836bb0"/>';
const re = /<meta name="yandex-verification"[^>]*>/;

let injected = 0;
let updated = 0;
let skipped = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".html")) {
      continue;
    }
    let html = fs.readFileSync(full, "utf8");
    const match = html.match(re);
    if (match) {
      if (match[0] === META) {
        skipped++;
      } else {
        html = html.replace(re, META);
        fs.writeFileSync(full, html);
        updated++;
      }
      continue;
    }
    const headIndex = html.indexOf("<head>");
    if (headIndex === -1) {
      skipped++;
      continue;
    }
    const at = headIndex + "<head>".length;
    html = html.slice(0, at) + META + html.slice(at);
    fs.writeFileSync(full, html);
    injected++;
  }
}

if (!fs.existsSync(dist)) {
  console.error("inject-yandex-verification: dist missing, run vite build first");
  process.exit(1);
}

walk(dist);
console.log(
  "yandex-verification: injected " + injected + ", updated " + updated + ", already correct " + skipped
);
