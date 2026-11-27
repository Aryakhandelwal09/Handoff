const express = require("express");
const { personalizeSummary } = require("../services/geminiClient");

const router = express.Router();

router.post("/summary", async (req, res) => {
  const { repoName, baseSummary, nodes, length, technicalLevel } = req.body;

  if (!repoName || !baseSummary || !Array.isArray(nodes)) {
    return res.status(400).json({ error: "Missing repoName, baseSummary, or nodes." });
  }
  if (!["brief", "detailed"].includes(length)) {
    return res.status(400).json({ error: "length must be 'brief' or 'detailed'." });
  }
  if (!["simple", "technical"].includes(technicalLevel)) {
    return res.status(400).json({ error: "technicalLevel must be 'simple' or 'technical'." });
  }

  try {
    const summary = await personalizeSummary(repoName, baseSummary, nodes, length, technicalLevel);
    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not personalize summary." });
  }
});

module.exports = router;