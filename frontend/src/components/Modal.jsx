import { useEffect, useRef } from "react";

/**
 * Reusable modal dialog. Lightweight wrapper that:
 *   - locks body scroll while open
 *   - closes on Escape and on backdrop click
 *   - returns focus to the previously focused element when it unmounts
 *
 * Children are responsible for the inner layout and any action buttons.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
  closeOnBackdrop = true,
}) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      try { previouslyFocused.current?.focus?.(); } catch {}
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        style={{
          background: "var(--bg, #fff)",
          color: "var(--text, #0f172a)",
          borderRadius: 12,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          border: "1px solid var(--border, #e2e8f0)",
        }}
      >
        {title && (
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border, #e2e8f0)",
            fontWeight: 600,
            fontSize: 16,
          }}>
            {title}
          </div>
        )}
        <div style={{ padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
