// backend/services/errorParser.js
// Plain JavaScript, no AI. Finds file paths and line numbers in a pasted error,
// hides framework noise, classifies the error, and matches paths against the
// files Handoff analyzed.

const MAX_CHARS = 6000;

const PATTERNS = [
  /File "([^"]+)", line (\d+)/g, // Python
  /\(([\w$]+\.(?:java|kt)):(\d+)\)/g, // Java / Kotlin (file name only)
  /((?:[A-Za-z]:)?[\w@.\/\\~-]+\.(?:[cm]?[jt]sx?|vue|svelte|py|go|rb|php|s?css)):(\d+)(?::\d+)?/g, // JS/TS and build tools
];

const FRAMEWORK_PATH = /(^|\/)(node_modules|site-packages|dist-packages)(\/|$)/;
const NODE_INTERNAL = /\bat\s.*\(?node:|\(internal\//;
const SETUP = /npm ERR!|ERESOLVE|EADDRINUSE|Unsupported engine|command not found|gyp ERR/i;
const BUILD = /\[vite\]|vite:|webpack|Module build failed|Failed to compile|Failed to resolve import|rollup|esbuild|\bTS\d{4}\b|eslint/i;

function toFrame(m) {
  const path = m[1]
    .replace(/\\/g, '/')
    .replace(/^(file:\/\/|webpack-internal:\/\/\/|webpack:\/\/[^/]*\/)/, '')
    .replace(/^\.\//, '');
  return { path, line: Number(m[2]), framework: FRAMEWORK_PATH.test(path) };
}

function framesInLine(line) {
  const out = [];
  for (const re of PATTERNS) for (const m of line.matchAll(re)) out.push(toFrame(m));
  return out;
}

function extract(lines) {
  const frames = [];
  const keep = [];
  let internal = 0;
  for (const line of lines) {
    if (NODE_INTERNAL.test(line)) { internal++; continue; }
    const found = framesInLine(line);
    frames.push(...found);
    if (found.length && found.every(f => f.framework)) continue; // drop framework-only lines
    keep.push(line);
  }
  return { frames, keep, internal };
}

function classify(text) {
  if (SETUP.test(text)) return 'setup';
  if (BUILD.test(text)) return 'build';
  return 'runtime';
}

function matchFiles(frames, repoPaths) {
  const repo = repoPaths.map(p => ({ orig: p, n: p.replace(/\\/g, '/').replace(/^\.?\//, '') }));
  const matched = [];
  const seen = new Set();
  for (const f of frames) {
    if (f.framework) continue;
    let best = null;
    // 1) the frame path ends with a repo path (longest repo path wins)
    for (const r of repo) {
      if (f.path === r.n || f.path.endsWith('/' + r.n)) {
        if (!best || r.n.length > best.n.length) best = r;
      }
    }
    // 2) the frame path is shorter than the repo path (build errors, Java file names)
    if (!best) {
      const cands = repo.filter(r => r.n === f.path || r.n.endsWith('/' + f.path));
      if (cands.length === 1) best = cands[0];
    }
    if (best && !seen.has(best.orig)) {
      seen.add(best.orig);
      matched.push({ path: best.orig, line: f.line });
    }
  }
  return matched;
}

function parseError(rawText, repoPaths = []) {
  const text = String(rawText || '').slice(0, MAX_CHARS);
  const lines = text.split(/\r?\n/);
  const { frames, keep, internal } = extract(lines);
  return {
    kind: classify(text),
    firstLine: (lines.find(l => l.trim()) || '').trim().slice(0, 300),
    cleaned: keep.join('\n').slice(0, 3000),
    hiddenFrames: frames.filter(f => f.framework).length + internal,
    matched: matchFiles(frames, repoPaths),
  };
}

module.exports = { parseError };