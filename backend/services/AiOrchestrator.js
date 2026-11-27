const { analyzeWithGemini } = require("./geminiClient");
const { analyzeWithOpenRouter } = require("./openRouterClient");

/**
 * Tries each AI provider in order. If all fail, degrades to a minimal
 * result built from just the README's content (if one was found) —
 * no graph, no checklist, since those genuinely require AI analysis,
 * but at least the user sees something instead of a dead-end error.
 */
async function analyzeWithFallback(repoName, tree, files) {
  const attempts = [
    { name: "Gemini", fn: analyzeWithGemini },
    { name: "OpenRouter", fn: analyzeWithOpenRouter }
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      const result = await attempt.fn(repoName, tree, files);
      return { ...result, degraded: false, provider: attempt.name };
    } catch (err) {
      errors.push(`${attempt.name}: ${err.message}`);
    }
  }

  const readmeFile = files.find(f => /readme/i.test(f.path));
  if (!readmeFile) {
    throw new Error(
      `All AI providers failed and no README was found to fall back to. (${errors.join(" | ")})`
    );
  }

  return {
    summary: readmeFile.content.slice(0, 600).trim(),
    nodes: [],
    checklist: [],
    degraded: true,
    provider: "readme-fallback",
    degradedReason: `AI analysis unavailable right now (${errors.join(" | ")}). Showing the repo's README instead.`
  };
}

module.exports = { analyzeWithFallback };