import "./TopControls.css";

const ROLES = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "fullstack", label: "Full-stack" },
  { key: "pm", label: "PM" }
];

export function RoleSelector({ activeRole, onChange }) {
  return (
    <div className="role-cluster">
      <span className="role-label">Onboarding as:</span>
      {ROLES.map(r => (
        <button
          key={r.key}
          className={`role-pill ${activeRole === r.key ? "active" : ""}`}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
      <button
        className={`role-pill ${activeRole === "other" ? "active" : ""}`}
        onClick={() => onChange("other")}
      >
        Other
      </button>
      {activeRole === "other" && (
        <input
          type="text"
          className="role-other-input show"
          placeholder="Your role, then Enter"
          aria-label="Your role"
          autoFocus
        />
      )}
    </div>
  );
}

export function ProgressStrip({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="progress-wrap">
      <span className="progress-label">Day 1 checklist</span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{done} of {total} done</span>
    </div>
  );
}