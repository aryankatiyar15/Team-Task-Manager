export function InlineAlert({ type = "error", message }) {
  if (!message) return null;

  return <div className={`alert alert-${type}`}>{message}</div>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }) {
  return <div className="loading-block">{label}</div>;
}
