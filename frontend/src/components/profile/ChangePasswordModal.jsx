import { useEffect, useState } from "react";
import { Icon } from "../Icons";

export function ChangePasswordModal({ open, onClose, supabase }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmPassword("");
      setLoading(false);
      setError("");
      setSuccess("");
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess("Password updated.");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (updateError) {
      setError(updateError.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="profile-modal-overlay" role="presentation" onClick={onClose}>
      <div className="profile-modal-panel" role="dialog" aria-modal="true" aria-labelledby="change-password-title" onClick={(event) => event.stopPropagation()}>
        <div className="profile-modal-header">
          <div>
            <p className="profile-modal-eyebrow">Security</p>
            <h3 id="change-password-title" className="profile-modal-title">Change password</h3>
          </div>
          <button type="button" className="profile-modal-close" aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <form className="profile-modal-form" onSubmit={handleSubmit}>
          <label className="profile-modal-field">
            <span>New password</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
            />
          </label>
          <label className="profile-modal-field">
            <span>Confirm password</span>
            <input
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the new password"
            />
          </label>

          {error && <p className="profile-modal-message error">{error}</p>}
          {success && <p className="profile-modal-message success">{success}</p>}

          <div className="profile-modal-actions">
            <button type="button" className="profile-modal-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="profile-modal-primary" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
