import { useEffect, useRef, useState } from "react";

/**
 * Toast Component
 * Renders a single toast notification with automatic dismissal
 * 
 * @param {Object} props
 * @param {string} props.id - Unique toast ID
 * @param {string} props.message - Toast message text
 * @param {'success'|'warning'|'error'|'info'} props.type - Toast type
 * @param {number} props.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {Function} props.onDismiss - Callback when toast is dismissed
 * @param {Function} props.onUndo - Optional callback for undo action
 */
export function Toast({ id, message, type = "info", duration = 3000, onDismiss, onUndo }) {
  const [isVisible, setIsVisible] = useState(true);
  const dismissTimerRef = useRef(null);
  const actionTimerRef = useRef(null);

  const clearTimers = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
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
    actionTimerRef.current = setTimeout(() => {
      onUndo?.();
      onDismiss?.(id);
    }, 180);
  };

  const handleClose = () => {
    clearTimers();
    setIsVisible(false);
    actionTimerRef.current = setTimeout(() => onDismiss?.(id), 220);
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? "toast-visible" : ""}`}>
      <div className="toast-content">
        <div className="toast-message">{message}</div>
      </div>
      <div className="toast-actions">
        {onUndo && (
          <button
            className="toast-undo"
            onClick={handleUndo}
          >
            UNDO
          </button>
        )}
        <button
          className="toast-close"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer Component
 * Manages and renders all active toasts
 */
export function ToastContainer({ toasts, onDismiss, onUndo }) {
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
