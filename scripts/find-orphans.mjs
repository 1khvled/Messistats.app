import fs from "fs";
import path from "path";

function getAllHtml(dir, list = []) {
  for (const item of fs.readdirSync(dir)) {
    if (item === "dist" || item === "node_modules" || item === ".git" || item.startsWith("scratch")) continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      getAllHtml(full, list);
    } else if (item.endsWith(".html")) {
      list.push(full.replace(/\\/g, "/"));
    }
  }
  return list;
}

const files = getAllHtml(".");
console.log("Auditing", files.length, "HTML pages for orphan status...");

const incoming = {};
files.forEach(f => incoming[f] = new Set());

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  // extract all href="..."
  const regex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    for (const target of files) {
      const baseName = path.basename(target, ".html");
      const isEs = target.includes("/es/") || target.startsWith("es/");
      
      // Match rules
      if (baseName === "index") {
        if (isEs && (url === "/es" || url === "/es/")) incoming[target].add(file);
        if (!isEs && (url === "/" || url === "/en" || url === "/en/")) incoming[target].add(file);
      } else {
        if (url.includes(baseName)) {
          incoming[target].add(file);
        }
      }
    }
  }
}

console.log("\n=== ORPHAN AUDIT RESULTS ===");
let orphanCount = 0;
for (const [file, refs] of Object.entries(incoming)) {
  const refList = Array.from(refs).filter(r => r !== file); // exclude self-references
  if (refList.length === 0) {
    orphanCount++;
    console.log(`[ORPHAN PAGE] -> ${file} (0 incoming internal links!)`);
  } else {
    console.log(`[OK] ${file} -> linked from ${refList.length} pages (${refList.slice(0, 2).join(", ")}...)`);
  }
}
console.log(`\nTotal orphans found: ${orphanCount}`);
