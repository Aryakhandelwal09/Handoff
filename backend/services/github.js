const { selectCandidateFiles, truncateFiles } = require("./fileSelector");

const GITHUB_API = "https://api.github.com";

function parseRepoUrl(url) {
  const cleaned = url.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const parts = cleaned.replace(/^github\.com\//, "").split("/");
  if (parts.length < 2) throw new Error("Could not parse a repo owner/name from that URL.");
  return { owner: parts[0], repo: parts[1] };
}

function authHeaders() {
  const headers = { "Accept": "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchDefaultBranch(owner, repo) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: authHeaders() });
  if (res.status === 404) throw new Error("Repo not found — check the URL is correct and the repo is public.");
  if (res.status === 403) throw new Error("GitHub rate limit hit — try again in a bit.");
  if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
  const data = await res.json();
  return data.default_branch;
}

/**
 * Cheap, separate call used purely to check cache validity — fetching
 * just the branch's latest commit SHA is much lighter than pulling the
 * full file tree.
 */
async function getLatestCommitSha(owner, repo, branch) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches/${branch}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`Could not fetch latest commit (${res.status})`);
  const data = await res.json();
  return data.commit.sha;
}

/**
 * Combines parsing + branch + SHA lookup — everything needed to decide
 * whether a cached result is still valid, without touching the file tree.
 */
async function getRepoMeta(repoUrl) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const branch = await fetchDefaultBranch(owner, repo);
  const sha = await getLatestCommitSha(owner, repo, branch);
  return { owner, repo, branch, sha, repoName: `${owner}/${repo}` };
}

async function fetchFileTree(owner, repo, branch) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Could not fetch file tree (${res.status})`);
  const data = await res.json();
  return data.tree
    .filter(item => item.type === "blob")
    .map(item => item.path);
}

async function fetchFileContent(owner, repo, path, branch) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
    { headers: authHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding !== "base64" || !data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/**
 * The expensive part: full file tree + selected file contents.
 * Takes an already-known branch (from getRepoMeta) so we don't fetch it twice.
 */
async function fetchRepoFilesAndTree(owner, repo, branch) {
  const tree = await fetchFileTree(owner, repo, branch);

  const candidatePaths = selectCandidateFiles(tree, 20);

  const fetched = [];
  for (const path of candidatePaths) {
    const content = await fetchFileContent(owner, repo, path, branch);
    if (content !== null) fetched.push({ path, content });
  }

  const files = truncateFiles(fetched, 500, 50000);

  return { tree, files };
}

module.exports = { parseRepoUrl, getRepoMeta, fetchRepoFilesAndTree };