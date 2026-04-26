/**
 * Reusable pager. Hidden when totalPages <= 1.
 * Designed to mirror the look of the existing Leaderboard pagination so the app
 * stays visually consistent.
 */
export default function Pagination({ page, totalPages, onChange, total }) {
  if (!totalPages || totalPages <= 1) return null;
  const safe = Math.max(1, Math.min(totalPages, page || 1));
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        padding: "16px 0",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        className="btn btn-ghost"
        disabled={safe <= 1}
        onClick={() => onChange(Math.max(1, safe - 1))}
      >
        ← Previous
      </button>
      <span className="muted small">
        Page {safe} of {totalPages}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={safe >= totalPages}
        onClick={() => onChange(Math.min(totalPages, safe + 1))}
      >
        Next →
      </button>
    </div>
  );
}
