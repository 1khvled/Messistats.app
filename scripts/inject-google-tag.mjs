import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const GOOGLE_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-FERBLJWWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-FERBLJWWWZ');
</script>`;

const TAG_ID = "G-FERBLJWWWZ";

const SUBPAGES = [
  "index.html",
  "achievements.html",
  "birthday.html",
  "champions-league.html",
  "dashboard.html",
  "goalsbyseason.html",
  "goalsbyyear.html",
  "latest-goal.html",
  "messi-vs-ronaldo.html",
  "timeline.html",
  "vs-real-madrid.html",
  "gear.html"
];

const LANGS = ["ar", "bn", "es", "fr", "hi", "pt", "ro", "uz"];

const TARGET_FILES = [
  ...SUBPAGES.map((file) => path.join(root, file)),
  ...LANGS.flatMap((lang) => SUBPAGES.map((file) => path.join(root, lang, file))),
  path.join(root, "public", "404.html"),
  path.join(root, "public", "embed", "on-this-day.html"),
];

const isCheck = process.argv.includes("--check");

let injected = 0;
let alreadyPresent = 0;
let missing = 0;
let duplicates = 0;

for (const file of TARGET_FILES) {
  if (!fs.existsSync(file)) {
    console.warn(`[google-tag] Missing file: ${path.relative(root, file)}`);
    missing++;
    continue;
  }

  let content = fs.readFileSync(file, "utf8");
  const count = (content.match(/G-FERBLJWWWZ/g) || []).length;

  if (count === 2) {
    // The gtag snippet contains TAG_ID twice (in URL and in config call)
    alreadyPresent++;
    continue;
  } else if (count > 2) {
    console.warn(`[google-tag] Multiple tags found in ${path.relative(root, file)} (${count / 2} tags)`);
    duplicates++;
    continue;
  }

  if (isCheck) {
    console.error(`[google-tag] Tag missing in ${path.relative(root, file)}`);
    missing++;
    continue;
  }

  // Insert tag immediately after <head>
  const headMatch = content.match(/<head\b[^>]*>/i);
  if (!headMatch) {
    console.warn(`[google-tag] No <head> tag found in ${path.relative(root, file)}`);
    missing++;
    continue;
  }

  const insertPos = headMatch.index + headMatch[0].length;
  content = content.slice(0, insertPos) + "\n" + GOOGLE_TAG + content.slice(insertPos);
  fs.writeFileSync(file, content, "utf8");
  injected++;
}

console.log(
  `[google-tag] Finished: ${injected} injected, ${alreadyPresent} already present, ${missing} missing, ${duplicates} duplicates.`
);

if (isCheck && (missing > 0 || duplicates > 0)) {
  process.exit(1);
}
