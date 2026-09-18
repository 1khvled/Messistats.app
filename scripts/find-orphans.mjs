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
    // Skip checking non-content files like 404 or verification
    if (file.includes("404.html") || file.includes("google")) continue;

    const regex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const url = match[1];
      for (const target of files) {
        if (target.includes("404.html") || target.includes("google")) continue;
        
        const baseName = path.basename(target, ".html");
        const parts = target.split("/");
        
        if (baseName === "index") {
          if (parts.length === 1 || target === "index.html") {
            // Root English index
            if (url === "/" || url === "/en" || url === "/en/") incoming[target].add(file);
          } else {
            // Subfolder index like es/index.html, pt/index.html, etc.
            const folder = parts[0];
            if (url === `/${folder}` || url === `/${folder}/` || url.startsWith(`/${folder}#`)) {
              incoming[target].add(file);
            }
          }
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
  if (file.includes("404.html") || file.includes("google")) continue;
  const refList = Array.from(refs).filter(r => r !== file); // exclude self-references
  if (refList.length === 0) {
    orphanCount++;
    console.log(`[ORPHAN PAGE] -> ${file} (0 incoming internal links!)`);
  } else {
    console.log(`[OK] ${file} -> linked from ${refList.length} pages (${refList.slice(0, 2).join(", ")}...)`);
  }
}
console.log(`\nTotal orphans found: ${orphanCount}`);
