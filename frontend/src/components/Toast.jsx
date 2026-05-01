import { useEffect, useRef, useState } from "react";

export function Toast({ id, message, type = "info", duration = 3000, onDismiss, onUndo }) {
  const [isVisible, setIsVisible] = useState(true);
  const dismissTimerRef = useRef(null);
  const actionTimerRef = useRef(null);

  const clearTimers = () => {
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null; }
    if (actionTimerRef.current)  { clearTimeout(actionTimerRef.current);  actionTimerRef.current  = null; }
  };

  useEffect(() => {
    clearTimers();
    if (duration === 0) return () => clearTimers();

    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      actionTimerRef.current = setTimeout(() => onDismiss?.(id), 220);
    }, duration);

    return () => clearTimers();
  }, [id, duration, onDismiss]);

  const handleUndo = () => {
    clearTimers();
    setIsVisible(false);
    actionTimerRef.current = setTimeout(() => { onUndo?.(); onDismiss?.(id); }, 180);
  };

  const handleClose = () => {
    clearTimers();
    setIsVisible(false);
    actionTimerRef.current = setTimeout(() => onDismiss?.(id), 220);
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? "toast-visible" : ""}`}>
      {/* Top row: message + buttons */}
      <div className="toast-body">
        <div className="toast-message">{message}</div>
        <div className="toast-actions">
          {onUndo && (
            <button className="toast-undo" onClick={handleUndo}>UNDO</button>
          )}
          <button className="toast-close" onClick={handleClose}>✕</button>
        </div>
      </div>

      {/* Progress bar — drains from 100% → 0% over `duration` ms */}
      {duration > 0 && (
        <div className="toast-progress-track">
          <div
            className="toast-progress-fill"
            key={id}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  const activeToast = toasts[toasts.length - 1];
  return (
    <div className="toast-container">
      {activeToast && (
        <Toast
          key={activeToast.id}
          id={activeToast.id}
          message={activeToast.message}
          type={activeToast.type}
          duration={activeToast.duration}
          onDismiss={onDismiss}
          onUndo={activeToast.onUndo}
        />
      )}
    </div>
  );
}
