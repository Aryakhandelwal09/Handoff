import { useState } from "react";
import "./SidePanel.css";

function firstSentence(text = "") {
  const t = text.trim();
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : t;
}

export default function SidePanel({
  nodes,
  selectedNode,
  checklist,
  checkedItems,
  onToggleItem,
  onSelectNode,
  onOpenError
}) {
  const [view, setView] = useState("summarized"); // "summarized" | "detailed"

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const totalSteps = Math.max(0, ...nodes.map(n => n.readingOrderStep || 0));
  const doneCount = checklist.filter((_, i) => checkedItems[i]).length;

  let connected = [];
  if (selectedNode) {
    const ids = new Set(selectedNode.connections || []);
    nodes.forEach(n => {
      if ((n.connections || []).includes(selectedNode.id)) ids.add(n.id);
    });
    connected = [...ids].filter(id => byId[id] && id !== selectedNode.id);
  }
  const flagged = selectedNode && selectedNode.flags && selectedNode.flags.length > 0;

  return (
    <div className="side-panel">
      <div className="panel-scroll">
        <div className="seg" role="group" aria-label="Explanation style">
          <button className={view === "summarized" ? "on" : ""} onClick={() => setView("summarized")}>
            Summarized
          </button>
          <button className={view === "detailed" ? "on" : ""} onClick={() => setView("detailed")}>
            Detailed
          </button>
        </div>

        {selectedNode ? (
          <div className="file-details">
            <h3>
              {selectedNode.name}
              {flagged && <span className="flag">⚠ flagged risky</span>}
            </h3>
            <p className="meta">
              {selectedNode.readingOrderStep != null
                ? `Step ${selectedNode.readingOrderStep} of ${totalSteps} · `
                : ""}
              {selectedNode.category}
            </p>
            <div className="file-path">{selectedNode.path}</div>

            {view === "summarized" ? (
              <>
                <div className="lab">Summary</div>
                <p>{firstSentence(selectedNode.explanation)}</p>
              </>
            ) : (
              <>
                <div className="lab">What it does</div>
                <p>{selectedNode.explanation}</p>
                {flagged && (
                  <>
                    <div className="lab">Watch out</div>
                    <ul className="flag-list">
                      {selectedNode.flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </>
                )}
              </>
            )}

            {connected.length > 0 && (
              <>
                <div className="lab">Connected to</div>
                <div>
                  {connected.map(id => (
                    <button key={id} className="cn" onClick={() => onSelectNode(id)}>
                      {byId[id].name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="empty">Click a node in the graph to see its explanation.</p>
        )}

        <div className="cl">
          <h4>Day 1 checklist · {doneCount} of {checklist.length}</h4>
          {checklist.map((item, i) => (
            <label key={i} className={`ci ${checkedItems[i] ? "done" : ""}`}>
              <input type="checkbox" checked={!!checkedItems[i]} onChange={() => onToggleItem(i)} />
              <span>
                {item.text}
                {item.warning && <span className="warn">⚠ {item.warning}</span>}
              </span>
            </label>
          ))}
        </div>

        <div className="tip">
          Hit an error while running the project?{" "}
          <button onClick={onOpenError}>Paste it here</button>
        </div>
      </div>
    </div>
  );
}