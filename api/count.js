import { head, put } from "@vercel/blob";

/* Public per-page visitor counter backed by the private Blob store.
 * GET /api/count?page=<slug> -> { page, views } (increments on every hit).
 * Needs BLOB_READ_WRITE_TOKEN — auto-provisioned when the Blob store is
 * connected to the Vercel project (Project -> Storage tab). Local static
 * previews have no /api route, and the frontend treats that as "stay silent".
 * Counts are best-effort: concurrent hits can occasionally overwrite each
 * other by one. Fine for a public vanity counter, never for stats. */

const PAGES = new Set(["home", "byyear", "byseason", "dashboard", "timeline", "achievements"]);

export default async function handler(req, res) {
  const page = String((req.query && req.query.page) || "home");
  if (!PAGES.has(page)) return res.status(400).json({ error: "unknown page" });
  const key = `counters/${page}.json`;
  try {
    let views = 0;
    try {
      const meta = await head(key);
      const r = await fetch(meta.url, { cache: "no-store" });
      if (r.ok) views = (await r.json()).views || 0;
    } catch {
      /* first visit: no blob stored yet, start at zero */
    }
    views += 1;
    await put(key, JSON.stringify({ page, views }), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ page, views });
  } catch {
    return res.status(500).json({ error: "counter unavailable" });
  }
}
