require("dotenv").config();
const express = require("express");
const cors = require("cors");

const analyzeRoute = require("./routes/analyze");
const summaryRoute = require("./routes/summary");
const explainRoute = require("./routes/explain");

const { createRateLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 5 analyses per IP per hour — protects your Anthropic API cost
app.use("/api/explain", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }), explainRoute);
app.use("/api", createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use("/api", analyzeRoute);
app.use("/api", summaryRoute);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Handoff backend running on http://localhost:${PORT}`);
});