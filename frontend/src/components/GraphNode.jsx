import { Handle, Position } from "reactflow";
import "./GraphNode.css";

const COLORS = {
  entry: "#7c8cff",
  core: "#b78bff",
  data: "#4ade80",
  config: "#8a90a0"
};

export default function GraphNode({ data }) {
  const { name, category, readingOrderStep, meta, flags, dimmed, selected, traced, tracing } = data;
  const flagged = flags && flags.length > 0;

  return (
    <div
      className={`graph-node ${dimmed ? "dimmed" : ""} ${selected ? "selected" : ""} ${tracing ? (traced ? "trace-hot" : "trace-dim") : ""}`}
      style={{ "--accent": COLORS[category] || COLORS.config }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="node-accent" />
      <div className="node-main">
        <div className="node-name">{name}</div>
        <div className="node-meta">{meta}</div>
      </div>
      {flagged && <span className="node-warn" title={flags[0]}>⚠</span>}
      <span className="node-badge">{readingOrderStep ?? "·"}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}