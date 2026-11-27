/**
 * Decides which files from a repo's file tree are worth sending to Claude.
 * Doesn't fetch content — just picks paths, in priority order.
 */

const SKIP_DIRS = ["node_modules", "dist", "build", ".git", "vendor", "coverage", "__pycache__"];
const SKIP_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot",
  ".lock", ".map", ".min.js"
];

const ENTRY_POINT_NAMES = [
  "index.js", "server.js", "app.js", "main.js",
  "App.jsx", "App.tsx", "index.tsx", "main.py", "app.py"
];
const CONFIG_NAMES = ["package.json", "requirements.txt", "pyproject.toml", "go.mod", "Cargo.toml"];

function isSkippable(path) {
  const lower = path.toLowerCase();
  if (SKIP_DIRS.some(dir => lower.includes(`/${dir}/`) || lower.startsWith(`${dir}/`))) return true;
  if (SKIP_EXTENSIONS.some(ext => lower.endsWith(ext))) return true;
  return false;
}

function priorityScore(path) {
  const fileName = path.split("/").pop();
  const depth = path.split("/").length;

  if (/^readme/i.test(fileName)) return 100;
  if (CONFIG_NAMES.includes(fileName)) return 90;
  if (ENTRY_POINT_NAMES.includes(fileName)) return 80;
  if (depth <= 2) return 50 - depth * 5; // shallower files lean more important
  return 10;
}

/**
 * @param {string[]} allPaths - every file path in the repo
 * @param {number} maxFiles - how many candidate files to select
 * @returns {string[]} selected paths, most important first
 */
function selectCandidateFiles(allPaths, maxFiles = 20) {
  return allPaths
    .filter(p => !isSkippable(p))
    .map(p => ({ path: p, score: priorityScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles)
    .map(f => f.path);
}

/**
 * Truncates file content to a max line count, and enforces a running
 * total character budget across all files combined.
 */
function truncateFiles(files, maxLinesPerFile = 500, maxTotalChars = 50000) {
  let totalChars = 0;
  const result = [];

  for (const file of files) {
    if (totalChars >= maxTotalChars) break;

    const lines = file.content.split("\n");
    const truncatedLines = lines.length > maxLinesPerFile
      ? lines.slice(0, maxLinesPerFile).concat(["... (truncated)"])
      : lines;

    let content = truncatedLines.join("\n");
    const remainingBudget = maxTotalChars - totalChars;
    if (content.length > remainingBudget) {
      content = content.slice(0, remainingBudget) + "\n... (truncated)";
    }

    totalChars += content.length;
    result.push({ path: file.path, content });
  }

  return result;
}

module.exports = { selectCandidateFiles, truncateFiles };
