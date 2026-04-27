import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";

/**
 * Promise-style confirmation dialog. Two ways to use:
 *   1) Controlled: <ConfirmDialog open onConfirm onClose ... />
 *   2) Imperative via useConfirm() — see below.
 *
 * Defaults to a destructive (danger) action. Pass tone="primary" for safe
 * confirmations like "approve" or "publish".
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onClose,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmBtnRef.current?.focus?.(), 50);
    }
  }, [open]);

  return (
    <Modal open={!!open} onClose={busy ? () => {} : onClose} title={title} width={460}>
      {body && (
        <div style={{ marginTop: 0, color: "var(--text-soft)", lineHeight: 1.5 }}>
          {typeof body === "string" ? <p style={{ margin: 0 }}>{body}</p> : body}
        </div>
      )}
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 20, gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmBtnRef}
          type="button"
          className={`btn ${tone === "primary" ? "btn-primary" : "btn-danger"}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? <span className="spinner" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Imperative hook — returns [dialogElement, askConfirm].
 * Usage:
 *   const [confirmEl, confirm] = useConfirm();
 *   if (await confirm({ title, body, tone, confirmLabel })) { ... }
 *   return (<>{confirmEl}<button onClick={...}/></>);
 */
export function useConfirm() {
  const [state, setState] = useState({ open: false });
  const resolverRef = useRef(null);

  function ask(opts = {}) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, ...opts });
    });
  }

  function close(result) {
    setState((s) => ({ ...s, open: false }));
    const r = resolverRef.current;
    resolverRef.current = null;
    if (r) r(result);
  }

  const el = (
    <ConfirmDialog
      {...state}
      open={!!state.open}
      onConfirm={() => close(true)}
      onClose={() => close(false)}
    />
  );
  return [el, ask];
}
