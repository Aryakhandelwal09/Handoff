import { useState } from "react";
import "./LandingScreen.css";

export default function LandingScreen({ onAnalyze, error, onDismissError }) {
  const [url, setUrl] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url.trim());
  }

  return (
    <section className="landing">
      <div className="landing-inner">
        <div className={`landing-focus ${error ? "dim" : ""}`}>
          <div className="eyebrow-badge"><span className="dot" />Built for team handoffs</div>
          <h1 className="hero">
            Get anyone up to speed <span className="accent">on any codebase</span>
          </h1>
          <p className="hero-sub">
            Paste a repo link. Get a reading order, plain-English explanations,
            and a checklist a new teammate can actually follow.
          </p>
          <form className="paste-card" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="github.com/your-team/project"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit">Generate</button>
          </form>
          <div className="landing-footnote">
            Works with any public repo · no account needed · try <code>facebook/react</code>
          </div>
        </div>

        {error && (
          <div className="error-block show">
            <svg className="error-icon" viewBox="0 0 46 46" fill="none">
              <circle cx="12" cy="14" r="5" fill="none" stroke="#7c8cff" strokeWidth="1.6" opacity="0.9" />
              <circle cx="34" cy="14" r="5" fill="none" stroke="#2a2f3a" strokeWidth="1.6" />
              <circle cx="23" cy="35" r="5" fill="none" stroke="#4ade80" strokeWidth="1.6" opacity="0.9" />
              <path d="M 16 16 L 19 32" stroke="#4ade80" strokeWidth="1.4" opacity="0.7" />
              <path d="M 16.5 12 L 29.5 12.5" stroke="#ff6b5e" strokeWidth="1.6" strokeDasharray="3 3" />
              <circle cx="23" cy="12.2" r="2" fill="#ff6b5e" />
            </svg>
            <div className="error-copy">
              <h4>Couldn't connect to that repo</h4>
              <p>{error}</p>
              <button onClick={onDismissError}>Try again</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}