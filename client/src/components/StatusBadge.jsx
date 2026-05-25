export function StatusBadge({ status }) {
  const className = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`badge status-${className}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority.toLowerCase()}`}>{priority}</span>;
}
