// Reads the contribution calendar off the GitHub profile — the green grid.
//
// The public events API undercounts badly: it carries public repositories
// only, keeps a short window, and runs hours behind. Over the same thirty days
// it showed activity on 3 days while the calendar showed 379 contributions
// across all 30. The calendar is the number GitHub itself shows people, so it
// is the one to show here.
//
// It has to come through a function because github.com sends no CORS headers;
// a browser cannot read the page directly.

const USER = "PeterMonev";

export default async function handler(req, res) {
  try {
    const r = await fetch(`https://github.com/users/${USER}/contributions`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) return res.status(502).json({ ok: false });
    const html = await r.text();

    // Each cell carries its date and an id; the count lives in a tooltip that
    // points back at that id.
    const dateOf = {};
    for (const m of html.matchAll(
      /data-date="(\d{4}-\d{2}-\d{2})" id="(contribution-day-component-[\d-]+)"/g
    )) {
      dateOf[m[2]] = m[1];
    }
    const days = {};
    for (const m of html.matchAll(
      /<tool-tip[^>]*for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)<\/tool-tip>/g
    )) {
      const date = dateOf[m[1]];
      if (date) days[date] = /^No /.test(m[2]) ? 0 : parseInt(m[2], 10) || 0;
    }

    if (!Object.keys(days).length) return res.status(502).json({ ok: false });

    // Cached at the edge, so a visit costs GitHub nothing.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    return res.status(200).json({ ok: true, days });
  } catch (err) {
    console.error("github calendar failed", err);
    return res.status(502).json({ ok: false });
  }
}
