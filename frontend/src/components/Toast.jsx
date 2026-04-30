import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (duration === 0) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(id), 200); // Allow animation to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✕";
      default:
        return "ℹ";
    }
  };

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(() => {
      onUndo?.();
      onDismiss?.(id);
    }, 100);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(id), 200);
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? "toast-visible" : ""}`}>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
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
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={onDismiss}
          onUndo={toast.onUndo}
        />
      ))}
    </div>
  );
}
