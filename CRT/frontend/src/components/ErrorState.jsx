/**
 * Generic error/state surface — pairs with EmptyState/Skeleton for consistent
 * load → empty → error → ready transitions.
 */
export default function ErrorState({
  icon = "⚠",
  title = "Something went wrong",
  body,
  action,
  onRetry,
}) {
  return (
    <div className="error-state" role="alert" aria-live="polite">
      <div className="error-state-icon" aria-hidden>{icon}</div>
      <div className="error-state-title">{title}</div>
      {body && <div className="error-state-body muted">{body}</div>}
      {(onRetry || action) && (
        <div className="error-state-action">
          {onRetry ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              Try again
            </button>
          ) : action}
        </div>
      )}
    </div>
  );
}
