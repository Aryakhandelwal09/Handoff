const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "cache.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_cache (
    repo_name TEXT PRIMARY KEY,
    commit_sha TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    cached_at INTEGER NOT NULL,
    last_accessed INTEGER NOT NULL
  )
`);

/**
 * Returns the cached analysis for a repo ONLY if its stored commit SHA
 * matches the current one — not based on how much time has passed.
 */
function getCached(repoName, currentSha) {
  const row = db.prepare(
    "SELECT commit_sha, analysis_json FROM analysis_cache WHERE repo_name = ?"
  ).get(repoName);

  if (!row || row.commit_sha !== currentSha) return null;

  db.prepare("UPDATE analysis_cache SET last_accessed = ? WHERE repo_name = ?")
    .run(Date.now(), repoName);

  return JSON.parse(row.analysis_json);
}

/**
 * Returns the most recent cached analysis for a repo WITHOUT a commit SHA check.
 * Used by the error explainer, which only reads what Handoff already analyzed.
 */
function getLatest(repoName) {
  const row = db.prepare(
    "SELECT analysis_json FROM analysis_cache WHERE repo_name = ?"
  ).get(repoName);

  if (!row) return null;

  db.prepare("UPDATE analysis_cache SET last_accessed = ? WHERE repo_name = ?")
    .run(Date.now(), repoName);

  return JSON.parse(row.analysis_json);
}

function saveToCache(repoName, currentSha, analysis) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO analysis_cache (repo_name, commit_sha, analysis_json, cached_at, last_accessed)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(repo_name) DO UPDATE SET
      commit_sha = excluded.commit_sha,
      analysis_json = excluded.analysis_json,
      cached_at = excluded.cached_at,
      last_accessed = excluded.last_accessed
  `).run(repoName, currentSha, JSON.stringify(analysis), now, now);
}

/**
 * Housekeeping only — not a correctness rule. Removes cache rows nobody
 * has looked up in 90+ days, purely to keep the database file from
 * growing forever. The SHA check above is what actually decides validity.
 */
function pruneOldEntries(maxAgeDays = 90) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM analysis_cache WHERE last_accessed < ?").run(cutoff);
}

module.exports = { getCached, getLatest, saveToCache, pruneOldEntries };