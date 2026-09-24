// scripts/indexnow.mjs
// Submits all canonical sitemap URLs directly to Bing & IndexNow Central endpoints.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SITE = "https://www.messistat.com";
const HOST = "www.messistat.com";
const KEY = "18188f5363f745f1bbf821767e0f0daf";
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

// Read sitemap from local file first, then fallback to fetch
const sitemapPaths = [
  path.join(root, "dist", "sitemap.xml"),
  path.join(root, "public", "sitemap.xml")
];

let xml = "";
for (const p of sitemapPaths) {
  if (fs.existsSync(p)) {
    xml = fs.readFileSync(p, "utf8");
    console.log(`Loaded sitemap from: ${p}`);
    break;
  }
}

if (!xml) {
  console.log(`Local sitemap not found, fetching from ${SITE}/sitemap.xml...`);
  try {
    const res = await fetch(`${SITE}/sitemap.xml`);
    if (res.ok) xml = await res.text();
  } catch (err) {
    console.error("Failed to fetch sitemap:", err.message);
  }
}

if (!xml) {
  console.error("Error: Could not locate sitemap.xml. Run 'npm run build' first.");
  process.exit(1);
}

const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
  .map(m => m[1].trim())
  .filter(u => u.startsWith("https://www.messistat.com"));

console.log(`Found ${urls.length} URLs to submit via IndexNow.`);

// Prime key verification via GET ping before batch POST
try {
  await fetch(`https://www.bing.com/indexnow?url=${encodeURIComponent(SITE + '/')}&key=${KEY}&keyLocation=${encodeURIComponent(KEY_LOCATION)}`);
  await fetch(`https://api.indexnow.org/indexnow?url=${encodeURIComponent(SITE + '/')}&key=${KEY}&keyLocation=${encodeURIComponent(KEY_LOCATION)}`);
} catch (_) {}

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls
});

const endpoints = [
  { name: "Bing", url: "https://www.bing.com/indexnow" },
  { name: "IndexNow Central", url: "https://api.indexnow.org/indexnow" }
];

for (const ep of endpoints) {
  try {
    console.log(`Submitting ${urls.length} URLs to ${ep.name} (${ep.url})...`);
    const res = await fetch(ep.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload
    });
    console.log(`[${ep.name}] Response: ${res.status} ${res.statusText}`);
    if (res.status === 200 || res.status === 202) {
      console.log(`[${ep.name}] SUCCESS: URLs queued for immediate crawling.`);
    } else {
      const text = await res.text().catch(() => "");
      console.warn(`[${ep.name}] Details: ${text}`);
    }
  } catch (err) {
    console.error(`[${ep.name}] Network error:`, err.message);
  }
}
