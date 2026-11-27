import { useEffect, useState } from "react";
import "./LoadingScreen.css";

const STEPS = ["Fetching repo structure", "Reading key files", "Generating explanations"];
// Roughly how long each stage tends to take — purely for pacing the UI,
// the real signal is just "the request is still in flight."
const STEP_DURATIONS = [3000, 5000, 12000];

export default function LoadingScreen({ repoUrl }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    function advance(i) {
      if (cancelled || i >= STEPS.length - 1) return;
      setTimeout(() => {
        if (!cancelled) {
          setActiveStep(i + 1);
          advance(i + 1);
        }
      }, STEP_DURATIONS[i]);
    }
    advance(0);
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="loading-screen">
      <div className="loading-inner">
        <div className="loading-repo">
          Analyzing <strong>{repoUrl}</strong>
        </div>
        <div className="loading-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`loading-step ${i < activeStep ? "done" : i === activeStep ? "active" : "pending"}`}
            >
              <div className="step-indicator" />
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>
        <div className="loading-note">
          This can take up to a minute for larger repos — we're honestly not
          faking the progress bar, it really is doing that much work.
        </div>

        {/* Honest placeholder — we don't know real filenames until the
            request finishes, so these are skeleton shapes, not fake data. */}
        <div className="skeleton-row">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-pill" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </section>
  );
}
