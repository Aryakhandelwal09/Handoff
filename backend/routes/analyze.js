const express = require("express");
const { getRepoMeta, fetchRepoFilesAndTree } = require("../services/github");
const { analyzeWithFallback } = require("../services/aiOrchestrator");
const { getCached, saveToCache } = require("../services/cache");

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "Please provide a repo URL." });
  }

  try {
    const { owner, repo, branch, sha, repoName } = await getRepoMeta(repoUrl);

    const cached = getCached(repoName, sha);
    if (cached) {
      return res.json({ repoName, ...cached, fromCache: true });
    }

    const { tree, files } = await fetchRepoFilesAndTree(owner, repo, branch);

    if (files.length === 0) {
      return res.status(422).json({
        error: "Couldn't read any files from that repo — is it public and non-empty?"
      });
    }

    const analysis = await analyzeWithFallback(repoName, tree, files);

    if (!analysis.degraded) {
      saveToCache(repoName, sha, analysis);
    }

    return res.json({ repoName, ...analysis, fromCache: false });
  } catch (err) {
    const message = err.message || "Something went wrong analyzing that repo.";
    const status = message.includes("not found") ? 404
      : message.includes("rate limit") ? 429
      : 500;
    return res.status(status).json({ error: message });
  }
});

module.exports = router;