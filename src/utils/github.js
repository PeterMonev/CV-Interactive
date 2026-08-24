// Live activity straight from GitHub's public API — no token, no backend.
//
// Two things shape everything below. First, the unauthenticated limit is 60
// requests an hour per IP, shared by every visitor behind that IP, so the answer
// is cached and the call is made once rather than on every mount. Second, the
// public events feed no longer carries commit counts: a PushEvent payload holds
// only ref, head and before. Counting commits from it is not possible, so this
// counts pushes and says so — an approximate number labelled precisely beats a
// precise-looking number that is wrong.

const USER = "PeterMonev";
const CACHE_KEY = "gh-activity";
const CACHE_TTL = 30 * 60 * 1000;
export const ACTIVITY_DAYS = 30;

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed.data;
  } catch (err) {
    return null;
  }
}

function writeCache(data) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch (err) {
    /* storage full or blocked — the fetch still worked, just not remembered */
  }
}

// Bucket by the visitor's own calendar day, not by UTC. Building the strip from
// local midnight and then keying it with toISOString() mixes the two: for
// anyone east of Greenwich, local midnight belongs to the previous UTC day, so
// every cell was labelled one day early and today's events fell off the end
// entirely. GitHub timestamps are UTC, so they are converted on the way in.
function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function summarise(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  const index = new Map();
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const cell = { date: key, pushes: 0 };
    days.push(cell);
    index.set(key, cell);
  }

  const repos = new Map();
  let pushes = 0;
  let latest = null;

  for (const e of events) {
    if (e.type !== "PushEvent") continue;
    const when = new Date(e.created_at);
    if (!latest || when > latest) latest = when;
    const cell = index.get(dayKey(when));
    if (cell) {
      cell.pushes += 1;
      pushes += 1;
    }
    const name = e.repo.name.split("/")[1] || e.repo.name;
    repos.set(name, (repos.get(name) || 0) + 1);
  }

  return {
    days,
    pushes,
    lastPush: latest ? latest.toISOString() : null,
    repos: [...repos.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name),
  };
}

export async function fetchActivity() {
  const cached = readCache();
  if (cached) return cached;

  const res = await fetch(
    `https://api.github.com/users/${USER}/events/public?per_page=100`,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  // 403 here almost always means the hourly limit, not a real failure. Either
  // way the caller hides the block rather than showing an error to a recruiter.
  if (!res.ok) throw new Error(`github ${res.status}`);
  const data = summarise(await res.json());
  writeCache(data);
  return data;
}

export function relativeTime(iso, lang) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  const hours = Math.round(diff / 3600000);
  const days = Math.round(diff / 86400000);
  const bg = lang === "bg";
  if (mins < 60) return bg ? `преди ${mins} мин` : `${mins} min ago`;
  if (hours < 24) return bg ? `преди ${hours} ч` : `${hours}h ago`;
  if (days === 1) return bg ? "вчера" : "yesterday";
  return bg ? `преди ${days} дни` : `${days} days ago`;
}
