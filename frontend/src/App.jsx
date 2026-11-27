import { useState } from "react";
import LandingScreen from "./screens/LandingScreen";
import LoadingScreen from "./screens/LoadingScreen";
import ResultsScreen from "./screens/ResultsScreen";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | loading | results
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  async function handleAnalyze(url) {
    setRepoUrl(url);
    setError(null);
    setScreen("loading");

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong analyzing that repo.");
        setScreen("landing");
        return;
      }

      setAnalysis(data);
      setScreen("results");
    } catch (err) {
      setError("Couldn't reach the server — is the backend running?");
      setScreen("landing");
    }
  }

  function handleReset() {
    setScreen("landing");
    setAnalysis(null);
    setError(null);
  }

  if (screen === "loading") {
    return <LoadingScreen repoUrl={repoUrl} />;
  }

  if (screen === "results" && analysis) {
    return <ResultsScreen analysis={analysis} onNewRepo={handleReset} />;
  }

  return (
    <LandingScreen
      onAnalyze={handleAnalyze}
      error={error}
      onDismissError={() => setError(null)}
    />
  );
}
