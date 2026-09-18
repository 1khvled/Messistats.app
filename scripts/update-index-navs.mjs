// Updates the nav links in {lang}/index.html to point to their own localized subpages
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const langs = ["pt", "fr", "ar", "bn", "hi", "ro", "uz"];

for (const lang of langs) {
  const file = path.join(rootDir, lang, "index.html");
  if (!fs.existsSync(file)) continue;

  let content = fs.readFileSync(file, "utf8");

  // Replace navigation /en/ links with /{lang}/
  const pages = [
    "birthday",
    "messi-vs-ronaldo",
    "vs-real-madrid",
    "goalsbyyear",
    "goalsbyseason",
    "dashboard",
    "timeline",
    "achievements"
  ];

  for (const p of pages) {
    const reg = new RegExp(`href="/en/${p}"`, "g");
    content = content.replace(reg, `href="/${lang}/${p}"`);
  }

  // Also replace any href="/en" that should be href="/{lang}" when referencing home
  // (leaving hreflang and canonical intact)

  fs.writeFileSync(file, content, "utf8");
  console.log(`Updated nav links for ${lang}/index.html`);
}
