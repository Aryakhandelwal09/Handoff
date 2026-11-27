import { useMemo, useState, useCallback, useEffect } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import GraphNode from "../components/GraphNode";
import SidePanel from "../components/SidePanel";
import { RoleSelector, ProgressStrip } from "../components/TopControls";
import SummaryCard from "../components/SummaryCard";
import ErrorDrawer from "../components/ErrorDrawer";
import "./ResultsScreen.css";

const nodeTypes = { handoffNode: GraphNode };
const TRACE_COLOR = "#ff6b5e";

function layoutNodes(nodes) {
  const ordered = [...nodes].sort((a, b) => {
    if (a.readingOrderStep == null && b.readingOrderStep == null) return 0;
    if (a.readingOrderStep == null) return 1;
    if (b.readingOrderStep == null) return -1;
    return a.readingOrderStep - b.readingOrderStep;
  });

  const COLS = 3;
  return ordered.map((node, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const zigzagY = row % 2 === 0 ? 0 : 60;
    return {
      ...node,
      position: { x: col * 230 + 60, y: row * 170 + zigzagY + 40 }
    };
  });
}

export default function ResultsScreen({ analysis, onNewRepo }) {
  const { repoName, nodes: rawNodes, checklist, summary, degraded, degradedReason } = analysis;

  const [activeRole, setActiveRole] = useState("fullstack");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [tracePaths, setTracePaths] = useState([]);
  // Both reset every time a results screen opens, so the tip is always visible until used or dismissed.
  const [seenHelp, setSeenHelp] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const openErrorDrawer = useCallback(() => {
    setErrorOpen(true);
    setSeenHelp(true);
    setShowTip(false);
  }, []);
  const dismissTip = useCallback(() => {
    setShowTip(false);
    setSeenHelp(true);
  }, []);
  const closeErrorDrawer = useCallback(() => setErrorOpen(false), []);

  const storageKey = `handoff-checklist-${repoName}`;
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems));
    } catch {
      // localStorage unavailable — progress just won't persist, not fatal
    }
  }, [checkedItems, storageKey]);

  const positioned = useMemo(() => layoutNodes(rawNodes), [rawNodes]);

  const flowNodes = useMemo(() => {
    return positioned.map(n => {
      const dimmed = activeRole !== "other" && !n.role.includes(activeRole);
      return {
        id: n.id,
        type: "handoffNode",
        position: n.position,
        data: {
          name: n.name,
          category: n.category,
          readingOrderStep: n.readingOrderStep,
          meta: n.flags?.length ? `${n.category} · flagged` : `${n.category} · ${n.connections?.length || 0} connections`,
          flags: n.flags,
          dimmed,
          selected: n.id === selectedNodeId,
          traced: tracePaths.includes(n.path),
          tracing: tracePaths.length > 0
        }
      };
    });
  }, [positioned, activeRole, selectedNodeId, tracePaths]);

  const flowEdges = useMemo(() => {
    const byId = Object.fromEntries(positioned.map(n => [n.id, n]));
    const traceSet = new Set(tracePaths);
    const tracing = traceSet.size > 0;
    const bothTraced = (a, b) => tracing && traceSet.has(a.path) && traceSet.has(b.path);
    const edges = [];

    positioned.forEach(n => {
      (n.connections || []).forEach(targetId => {
        if (!byId[targetId]) return;
        const hot = bothTraced(n, byId[targetId]);
        const isConnectedToHover = hoveredNodeId && (n.id === hoveredNodeId || targetId === hoveredNodeId);
        edges.push({
          id: `dep-${n.id}-${targetId}`,
          source: n.id,
          target: targetId,
          style: {
            stroke: hot ? TRACE_COLOR : isConnectedToHover ? "#7c8cff" : "#2a2f3a",
            strokeWidth: hot ? 2.5 : isConnectedToHover ? 2 : 1.4,
            opacity: tracing && !hot ? 0.12 : hoveredNodeId && !isConnectedToHover ? 0.15 : 1
          }
        });
      });
    });

    const orderedWithStep = positioned
      .filter(n => n.readingOrderStep != null)
      .sort((a, b) => a.readingOrderStep - b.readingOrderStep);

    for (let i = 0; i < orderedWithStep.length - 1; i++) {
      const a = orderedWithStep[i];
      const b = orderedWithStep[i + 1];
      const hot = bothTraced(a, b);
      edges.push({
        id: `order-${i}`,
        source: a.id,
        target: b.id,
        style: {
          stroke: hot ? TRACE_COLOR : "#7c8cff",
          strokeWidth: 2.5,
          opacity: tracing && !hot ? 0.2 : 1
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: hot ? TRACE_COLOR : "#7c8cff" },
        animated: true
      });
    }

    return edges;
  }, [positioned, hoveredNodeId, tracePaths]);

  const selectedNode = rawNodes.find(n => n.id === selectedNodeId) || null;
  const doneCount = Object.values(checkedItems).filter(Boolean).length;

  const onNodeClick = useCallback((_, node) => setSelectedNodeId(node.id), []);
  const onNodeMouseEnter = useCallback((_, node) => setHoveredNodeId(node.id), []);
  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  // Degraded mode: both AI providers failed. There's no graph or checklist
  // possible without AI, so show the README-based summary plainly instead
  // of trying to render an empty graph and side panel. This check sits
  // after every hook call above so hook order stays identical every render.
  if (degraded) {
    return (
      <section className="results-screen">
        <div className="topbar">
          <div className="repo-pill">{repoName}</div>
          <button className="pill-btn" onClick={onNewRepo}>New repo</button>
        </div>
        <div className="degraded-notice">
          <h3>Full analysis unavailable</h3>
          <p>{degradedReason}</p>
          <div className="degraded-summary">{summary}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="results-screen">
      <div className="topbar">
        <div className="repo-pill">{repoName}</div>
        <div className="topbar-actions">
          <div className="help-wrap">
            <button
              className={`help-btn${seenHelp ? " seen" : ""}`}
              onClick={openErrorDrawer}
              aria-expanded={errorOpen}
            >
              <span className="help-ic">!</span>Stuck? Paste error
            </button>
            {showTip && !errorOpen && (
              <div className="help-callout" role="status">
                Hit an error? Paste it here and Handoff will trace it to the files.
                <button onClick={dismissTip} aria-label="Dismiss tip">✕</button>
              </div>
            )}
          </div>
          <button className="pill-btn" onClick={onNewRepo}>New repo</button>
        </div>
      </div>

      <div className="subbar">
        <ProgressStrip done={doneCount} total={checklist.length} />
        <RoleSelector activeRole={activeRole} onChange={setActiveRole} />
      </div>

      <SummaryCard repoName={repoName} baseSummary={summary} nodes={rawNodes} />

      <div className="results-body">
        <div className="canvas-wrap">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f232c" gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>

          <div className="legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: "#7c8cff" }} />Entry point</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#b78bff" }} />Core logic</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#4ade80" }} />Data</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#8a90a0" }} />Config</div>
          </div>

          {tracePaths.length > 0 && (
            <div className="trace-chip">
              Error trace shown on graph
              <button onClick={() => setTracePaths([])}>Clear</button>
            </div>
          )}
        </div>

        <SidePanel
          nodes={rawNodes}
          selectedNode={selectedNode}
          checklist={checklist}
          checkedItems={checkedItems}
          onToggleItem={(i) => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))}
          onSelectNode={setSelectedNodeId}
          onOpenError={openErrorDrawer}
        />
      </div>

      <ErrorDrawer
        open={errorOpen}
        onClose={closeErrorDrawer}
        repoName={repoName}
        onTrace={setTracePaths}
      />
    </section>
  );
}