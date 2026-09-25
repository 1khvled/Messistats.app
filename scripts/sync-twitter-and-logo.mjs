/**
 * scripts/sync-twitter-and-logo.mjs
 *
 * 1. Guarantees Twitter/X card metadata across all HTML files:
 *    - twitter:card = summary_large_image
 *    - twitter:site = @messistat1
 *    - twitter:creator = @messistat1
 *    - twitter:domain = messistat.com
 *    - Cache-busting twitter:image & og:image = https://www.messistat.com/img/og-messi.jpg?v=930
 *    - og:image:secure_url
 * 2. Guarantees Google Logo Indexing & Schema.org Organization:
 *    - Organization.logo with ImageObject (512x512, caption, contentUrl)
 *    - Organization.sameAs includes https://x.com/messistat1
 *    - WebSite.sameAs includes https://x.com/messistat1
 *    - apple-touch-icon for /img/logo.png
 * 3. Static footer official X link for crawlers & users:
 *    - <div class="footer-social-bar"><a href="https://x.com/messistat1">...</a></div>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function getHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git", "scratch", "scratch_audit"].includes(entry.name)) {
        continue;
      }
      files.push(...getHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(root);
console.log(`[sync-twitter-and-logo] Processing ${htmlFiles.length} HTML files...`);

let updatedCount = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, "utf8");
  const orig = content;

  // 1. Cache-bust og:image and twitter:image
  content = content.replace(
    /(<meta[^>]+property=["']og:image["'][^>]+content=["'])https:\/\/www\.messistat\.com\/img\/og-messi\.jpg(?:[?][^"']*)?(["'])/g,
    `$1https://www.messistat.com/img/og-messi.jpg?v=930$2`
  );
  content = content.replace(
    /(<meta[^>]+content=["'])https:\/\/www\.messistat\.com\/img\/og-messi\.jpg(?:[?][^"']*)?(["'][^>]+property=["']og:image["'])/g,
    `$1https://www.messistat.com/img/og-messi.jpg?v=930$2`
  );
  content = content.replace(
    /(<meta[^>]+name=["']twitter:image["'][^>]+content=["'])https:\/\/www\.messistat\.com\/img\/og-messi\.jpg(?:[?][^"']*)?(["'])/g,
    `$1https://www.messistat.com/img/og-messi.jpg?v=930$2`
  );
  content = content.replace(
    /(<meta[^>]+content=["'])https:\/\/www\.messistat\.com\/img\/og-messi\.jpg(?:[?][^"']*)?(["'][^>]+name=["']twitter:image["'])/g,
    `$1https://www.messistat.com/img/og-messi.jpg?v=930$2`
  );

  // 1b. Add og:image:secure_url if missing
  if (content.includes('property="og:image"') && !content.includes('property="og:image:secure_url"')) {
    content = content.replace(
      /(<meta[^>]+property=["']og:image["'][^>]+>)/,
      `$1\n<meta content="https://www.messistat.com/img/og-messi.jpg?v=930" property="og:image:secure_url"/>`
    );
  }

  // 2. Ensure twitter:site, twitter:creator, twitter:domain are present
  if (!content.includes('name="twitter:site"') && !content.includes("name='twitter:site'")) {
    // Add right after twitter:card
    if (content.includes('name="twitter:card"')) {
      content = content.replace(
        /(<meta[^>]+name=["']twitter:card["'][^>]*>)/i,
        `$1\n<meta content="@messistat1" name="twitter:site"/>\n<meta content="@messistat1" name="twitter:creator"/>\n<meta content="messistat.com" name="twitter:domain"/>`
      );
    }
  }

  // 3. Apple-touch-icon logo link for Google Favicon / Logo indexing
  if (!content.includes('href="/img/logo.png" rel="apple-touch-icon"') && !content.includes('rel="apple-touch-icon" href="/img/logo.png"')) {
    if (content.includes('rel="apple-touch-icon"')) {
      content = content.replace(
        /(<link[^>]+rel=["']apple-touch-icon["'][^>]*>)/i,
        `$1\n<link rel="apple-touch-icon" href="/img/logo.png"/>`
      );
    }
  }

  // 4. Update Schema.org Organization & WebSite with @messistat1 and logo details
  content = content.replace(
    /(<script type=["']application\/ld\+json["']>)([\s\S]*?)(<\/script>)/g,
    (match, p1, jsonStr, p3) => {
      try {
        const parsed = JSON.parse(jsonStr);
        let changed = false;

        const updateGraph = (obj) => {
          if (!obj || typeof obj !== "object") return;
          if (Array.isArray(obj)) {
            obj.forEach(updateGraph);
            return;
          }

          if (obj["@type"] === "Organization") {
            // Update sameAs
            const socials = ["https://x.com/messistat1", "https://twitter.com/messistat1"];
            if (!obj.sameAs) {
              obj.sameAs = socials;
              changed = true;
            } else if (Array.isArray(obj.sameAs)) {
              for (const s of socials) {
                if (!obj.sameAs.includes(s)) {
                  obj.sameAs.push(s);
                  changed = true;
                }
              }
            }

            // Standardize name
            if (obj.name === "MessiStats") {
              obj.name = "MessiStat";
              changed = true;
            }

            // Ensure rich ImageObject for logo
            obj.logo = {
              "@type": "ImageObject",
              "@id": "https://www.messistat.com/#logo",
              "url": "https://www.messistat.com/img/logo.png",
              "contentUrl": "https://www.messistat.com/img/logo.png",
              "caption": "MessiStat Official Logo",
              "width": 512,
              "height": 512
            };
            changed = true;
          }

          if (obj["@type"] === "WebSite") {
            const socials = ["https://x.com/messistat1", "https://twitter.com/messistat1"];
            if (!obj.sameAs) {
              obj.sameAs = socials;
              changed = true;
            } else if (Array.isArray(obj.sameAs)) {
              for (const s of socials) {
                if (!obj.sameAs.includes(s)) {
                  obj.sameAs.push(s);
                  changed = true;
                }
              }
            }
          }

          if (obj["@graph"]) {
            updateGraph(obj["@graph"]);
          }
        };

        updateGraph(parsed);

        if (changed) {
          return `${p1}\n${JSON.stringify(parsed, null, 2)}\n${p3}`;
        }
      } catch (e) {
        // If JSON.parse fails, keep as is
      }
      return match;
    }
  );

  // 5. Add static footer official X link if missing
  if (content.includes("<footer") && !content.includes("footer-social-bar")) {
    const socialBarHtml = `<div class="footer-social-bar"><a href="https://x.com/messistat1" target="_blank" rel="noopener noreferrer" class="footer-x-link" aria-label="Follow MessiStat on X (@messistat1)"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span>Follow @messistat1 on X</span></a></div>`;
    
    if (content.includes('<p id="foot-date"></p>')) {
      content = content.replace(
        '<p id="foot-date"></p>',
        `${socialBarHtml}\n  <p id="foot-date"></p>`
      );
    } else if (content.includes('<p class="crest-note">')) {
      content = content.replace(
        '<p class="crest-note">',
        `${socialBarHtml}\n  <p class="crest-note">`
      );
    } else if (content.includes("</footer>")) {
      content = content.replace("</footer>", `${socialBarHtml}\n</footer>`);
    }
  }

  if (content !== orig) {
    fs.writeFileSync(file, content, "utf8");
    updatedCount++;
  }
}

console.log(`[sync-twitter-and-logo] Successfully updated ${updatedCount} HTML files!`);
