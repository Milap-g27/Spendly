import { useRef, useState } from "react";
import { Icon } from "../Icons";

export function AvatarUpload({ displayName, avatarSrc, onSave }) {
  const inputRef = useRef(null);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState("");
  const [pendingFile, setPendingFile] = useState(null);

  const activeAvatarSrc = pendingAvatarSrc || avatarSrc || "";

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const nextValue = typeof reader.result === "string" ? reader.result : "";
      if (nextValue) setPendingAvatarSrc(nextValue);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = () => {
    if (pendingFile) {
      onSave?.(pendingFile);
      setPendingFile(null);
      setPendingAvatarSrc("");
      return;
    }
    if (pendingAvatarSrc) {
      onSave?.(pendingAvatarSrc);
      setPendingAvatarSrc("");
    }
  };

  const handleCancel = () => {
    setPendingAvatarSrc("");
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-upload-row">
        <button
          type="button"
          className="avatar-upload-avatar"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload avatar photo"
        >
          {activeAvatarSrc ? (
            <img className="avatar-upload-image" src={activeAvatarSrc} alt="Profile avatar preview" />
          ) : (
            <span className="avatar-upload-fallback">{displayName?.[0]?.toUpperCase() || "N"}</span>
          )}
          <span className="avatar-upload-overlay">
            <Icon name="camera" size={18} />
          </span>
        </button>

        <button type="button" className="avatar-upload-box" onClick={() => inputRef.current?.click()}>
          <span className="avatar-upload-copy">
            <strong>Upload photo</strong>
            <span>PNG, JPG, or WebP</span>
          </span>
          <span className="avatar-upload-cta">
            <Icon name="camera" size={16} />
          </span>
        </button>
      </div>

      {(pendingAvatarSrc || pendingFile) && (
        <div className="profile-inline-actions avatar-save-bar">
          <button type="button" className="profile-inline-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="profile-inline-save" onClick={handleSave}>
            Save photo
          </button>
        </div>
      )}

      <input ref={inputRef} className="visually-hidden-input" type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
