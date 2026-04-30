import { useEffect, useMemo, useState } from "react";
import { AvatarUpload } from "./AvatarUpload";
import { Icon } from "../Icons";

const RESERVED_USERNAMES = ["admin", "spendly", "user", "test", "john", "jane"];

function validateName(value, currentName) {
  const trimmed = value.trim();
  const current = currentName.trim().toLowerCase();
  const normalized = trimmed.toLowerCase();

  if (!trimmed) {
    return { valid: false, tone: "error", message: "Name cannot be empty" };
  }

  if (RESERVED_USERNAMES.includes(normalized)) {
    return { valid: false, tone: "error", message: "Username already taken" };
  }

  if (normalized === current) {
    return { valid: false, tone: "neutral", message: "Same as current name" };
  }

  return { valid: true, tone: "success", message: "Username is available" };
}

function EmailRow({ email }) {
  return (
    <div className="profile-list-item">
      <div className="profile-list-item-main">
        <span className="profile-list-item-icon"><Icon name="mail" size={18} /></span>
        <div>
          <p className="profile-list-item-title">Email</p>
          <p className="profile-list-item-subtitle">Account details</p>
        </div>
      </div>
      <p className="profile-list-item-value">{email || "demo@spendly.app"}</p>
    </div>
  );
}

export function PersonalInfoCard({ displayName, email, avatarSrc, onAvatarSave, onNameSave }) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(displayName);

  useEffect(() => {
    if (!editingName) {
      setDraftName(displayName);
    }
  }, [displayName, editingName]);

  const validation = useMemo(() => validateName(draftName, displayName), [draftName, displayName]);
  const savedName = displayName.trim().toLowerCase();
  const draftNormalized = draftName.trim().toLowerCase();
  const canSave = validation.valid && draftNormalized !== savedName;

  const handleStartEdit = () => {
    setDraftName(displayName);
    setEditingName(true);
  };

  const handleCancel = () => {
    setDraftName(displayName);
    setEditingName(false);
  };

  const handleSave = () => {
    if (!canSave) return;
    onNameSave?.(draftName.trim());
    setEditingName(false);
  };

  return (
    <div className="profile-section-card">
      <div className="profile-avatar-row">
        <AvatarUpload displayName={displayName} avatarSrc={avatarSrc} onSave={onAvatarSave} />
      </div>

      <div className="profile-divider" />

      <button type="button" className="profile-list-item profile-action-row is-clickable" onClick={handleStartEdit}>
        <div className="profile-list-item-main">
          <span className="profile-list-item-icon"><Icon name="person" size={18} /></span>
          <div>
            <p className="profile-list-item-title">Name</p>
            <p className="profile-list-item-subtitle">Click to edit your display name</p>
          </div>
        </div>
        <div className="profile-list-item-action">
          <p className="profile-list-item-value">{displayName}</p>
          <span className="profile-chevron">›</span>
        </div>
      </button>

      {editingName && (
        <div className="profile-inline-editor">
          <input
            className="profile-inline-input"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Enter your name"
            autoFocus
          />
          <p className={`profile-inline-status ${validation.tone}`}>{validation.message}</p>
          <div className="profile-inline-actions">
            <button type="button" className="profile-inline-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="profile-inline-save" onClick={handleSave} disabled={!canSave}>
              Save name
            </button>
          </div>
        </div>
      )}

      <div className="profile-divider" />
      <EmailRow email={email} />
    </div>
  );
}
