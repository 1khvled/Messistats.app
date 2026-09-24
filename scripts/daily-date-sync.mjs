/**
 * Daily Date Synchronization Pipeline (scripts/daily-date-sync.mjs)
 * 
 * Automatically synchronizes all static HTML "Updated [Date]" badges,
 * Schema.org JSON-LD dateModified fields, sitemap lastmods, and AI/LLM
 * verification markers to the current calendar date every day.
 * 
 * Google Search and AI engines heavily favor freshly verified, up-to-date
 * data. This script guarantees every page is timestamped to today's date.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const now = new Date();
const yyyy = now.getUTCFullYear();
const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
const dd = String(now.getUTCDate()).padStart(2, "0");
const isoDate = `${yyyy}-${mm}-${dd}`;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const dayNum = now.getUTCDate();
const monthName = months[now.getUTCMonth()];
const formattedDateEn = `${dayNum} ${monthName} ${yyyy}`;
const monthYearEn = `${monthName} ${yyyy}`;

console.log(`[daily-date-sync] Synchronizing dates to ${formattedDateEn} (${isoDate})...`);

// 1. Update public/data/messi-data.json
const messiDataPath = path.join(root, "public", "data", "messi-data.json");
if (fs.existsSync(messiDataPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(messiDataPath, "utf8"));
    if (data.meta) {
      data.meta.updated = isoDate;
      fs.writeFileSync(messiDataPath, JSON.stringify(data, null, 2), "utf8");
      console.log(`  ✓ Updated public/data/messi-data.json (meta.updated = ${isoDate})`);
    }
  } catch (err) {
    console.error("  Error updating messi-data.json:", err.message);
  }
}

// 2. Update public/llms.txt and public/llms-full.txt
const llmsPath = path.join(root, "public", "llms.txt");
if (fs.existsSync(llmsPath)) {
  let content = fs.readFileSync(llmsPath, "utf8");
  content = content.replace(/(Last verified:\s*)[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}/g, `$1${formattedDateEn}`);
  fs.writeFileSync(llmsPath, content, "utf8");
  console.log(`  ✓ Updated public/llms.txt`);
}

const llmsFullPath = path.join(root, "public", "llms-full.txt");
if (fs.existsSync(llmsFullPath)) {
  let content = fs.readFileSync(llmsFullPath, "utf8");
  content = content.replace(/(Dataset version:\s*)[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}/g, `$1${formattedDateEn}`);
  content = content.replace(/(As of\s*)[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}/g, `$1${formattedDateEn}`);
  fs.writeFileSync(llmsFullPath, content, "utf8");
  console.log(`  ✓ Updated public/llms-full.txt`);
}

// 3. Find all root and language HTML files
function getHtmlFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "dist" && entry.name !== "node_modules" && entry.name !== ".git") {
        getHtmlFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles(root);
let modifiedCount = 0;

for (const filePath of htmlFiles) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Update <span id="upd">Updated [Date]</span>
  content = content.replace(/<span id="upd">Updated [^<]+<\/span>/g, `<span id="upd">Updated ${formattedDateEn}</span>`);

  // Update <span class="updated-badge"><span class="dot"></span>Updated [Month] [Year]</span>
  content = content.replace(/(<span class="updated-badge"><span class="dot"><\/span>Updated\s+)[A-Za-z]+\s+[0-9]{4}(<\/span>)/g, `$1${monthYearEn}$2`);

  // Update SportsPerson description: figures as of [Date]
  content = content.replace(/(figures as of\s*)[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}/g, `$1${formattedDateEn}`);

  // Update birthday text: as of [Date]
  content = content.replace(/(as of\s*)[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}/g, `$1${formattedDateEn}`);

  // Update Schema.org dateModified
  content = content.replace(/"dateModified":\s*"[0-9]{4}-[0-9]{2}-[0-9]{2}"/g, `"dateModified": "${isoDate}"`);

  // Update Schema.org temporalCoverage end date: YYYY-MM-DD/YYYY-MM-DD
  content = content.replace(/"temporalCoverage":\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})\/[0-9]{4}-[0-9]{2}-[0-9]{2}"/g, `"temporalCoverage": "$1/${isoDate}"`);

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    modifiedCount++;
  }
}

console.log(`[daily-date-sync] Updated timestamps across ${modifiedCount} HTML files.`);
