import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const navLinks = {
  en: '<a href="/en/latest-goal" aria-label="Latest Goal"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Latest Goal <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  es: '<a href="/es/latest-goal" aria-label="Último Gol"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Último Gol <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  pt: '<a href="/pt/latest-goal" aria-label="Último Gol"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Último Gol <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  fr: '<a href="/fr/latest-goal" aria-label="Dernier But"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Dernier But <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  ar: '<a href="/ar/latest-goal" aria-label="آخر هدف"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>آخر هدف <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  bn: '<a href="/bn/latest-goal" aria-label="সাম্প্রতিক গোল"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>সাম্প্রতিক গোল <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  hi: '<a href="/hi/latest-goal" aria-label="ताजा गोल"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>ताजा गोल <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  ro: '<a href="/ro/latest-goal" aria-label="Ultimul Gol"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Ultimul Gol <b class="nav-badge-hot">LIVE ⚡</b></span></a>',
  uz: '<a href="/uz/latest-goal" aria-label="Soʻnggi gol"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>Soʻnggi gol <b class="nav-badge-hot">LIVE ⚡</b></span></a>'
};

function processHtmlFile(filePath, lang) {
  let content = fs.readFileSync(filePath, "utf8");

  // Check specifically within <nav>...</nav>
  const navMatch = content.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i);
  if (!navMatch) {
    console.warn(`Could not find <nav> in ${filePath}`);
    return false;
  }

  const navContent = navMatch[1];
  if (navContent.includes(`/${lang}/latest-goal`) || navContent.includes("latest-goal.html") || navContent.includes("/latest-goal")) {
    return false; // Already has latest-goal link in nav
  }

  // Look for birthday link in nav: either <a class="nav-bday-link" or <a aria-current="page" class="on nav-bday-link" or similar
  const bdayRegex = /(<a\s+[^>]*href=["'][^"']*\/birthday["'][^>]*>)/i;
  const match = content.match(bdayRegex);
  if (!match) {
    console.warn(`Could not find birthday link in ${filePath}`);
    return false;
  }

  const linkToInsert = navLinks[lang] + "\n";
  const newContent = content.slice(0, match.index) + linkToInsert + content.slice(match.index);
  fs.writeFileSync(filePath, newContent, "utf8");
  return true;
}

let updated = 0;

// Root English files
const rootFiles = fs.readdirSync(rootDir).filter(f => f.endsWith(".html") && f !== "latest-goal.html" && f !== "404.html" && f !== "admin.html");
for (const file of rootFiles) {
  if (processHtmlFile(path.join(rootDir, file), "en")) {
    console.log(`Updated en/${file}`);
    updated++;
  }
}

// Localized directories
for (const lang of ["es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"]) {
  const langDir = path.join(rootDir, lang);
  if (!fs.existsSync(langDir)) continue;
  const files = fs.readdirSync(langDir).filter(f => f.endsWith(".html") && f !== "latest-goal.html" && f !== "404.html");
  for (const file of files) {
    if (processHtmlFile(path.join(langDir, file), lang)) {
      console.log(`Updated ${lang}/${file}`);
      updated++;
    }
  }
}

console.log(`Total files updated with latest-goal nav link: ${updated}`);
