import { useState } from "react";
import "./SummaryCard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function SummaryCard({ repoName, baseSummary, nodes }) {
  const [length, setLength] = useState("brief");
  const [technicalLevel, setTechnicalLevel] = useState("simple");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [cache, setCache] = useState({ "brief|simple": baseSummary });

  const cacheKey = `${length}|${technicalLevel}`;
  const displayedSummary = cache[cacheKey];

  async function fetchVariant(newLength, newTechnicalLevel) {
    const key = `${newLength}|${newTechnicalLevel}`;
    if (cache[key]) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName,
          baseSummary,
          nodes: nodes.map(n => ({ name: n.name, explanation: n.explanation })),
          length: newLength,
          technicalLevel: newTechnicalLevel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not personalize summary.");
      setCache(prev => ({ ...prev, [key]: data.summary }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLengthChange(val) {
    setLength(val);
    fetchVariant(val, technicalLevel);
  }
  function handleLevelChange(val) {
    setTechnicalLevel(val);
    fetchVariant(length, val);
  }

  return (
    <div className="summary-card">
      <div className="summary-text">
        {loading ? <span className="summary-loading">Rewriting summary…</span> : (error ? `Couldn't personalize: ${error}` : displayedSummary)}
      </div>
      <div className="summary-controls">
        <div className="toggle-group">
          <button className={length === "brief" ? "active" : ""} onClick={() => handleLengthChange("brief")}>Brief</button>
          <button className={length === "detailed" ? "active" : ""} onClick={() => handleLengthChange("detailed")}>Detailed</button>
        </div>
        <div className="toggle-group">
          <button className={technicalLevel === "simple" ? "active" : ""} onClick={() => handleLevelChange("simple")}>Simple</button>
          <button className={technicalLevel === "technical" ? "active" : ""} onClick={() => handleLevelChange("technical")}>Technical</button>
        </div>
      </div>
    </div>
  );
}