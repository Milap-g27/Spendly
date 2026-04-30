import pkg from "../../../package.json";
import { Icon } from "../Icons";

function ActionRow({ icon, label, value, onClick, destructive = false }) {
  const RowTag = onClick ? "button" : "div";
  const rowProps = onClick ? { type: "button" } : {};

  return (
    <RowTag {...rowProps} className={`profile-list-item profile-action-row ${onClick ? "is-clickable" : ""}`} onClick={onClick}>
      <div className="profile-list-item-main">
        <span className={`profile-list-item-icon ${destructive ? "is-destructive" : ""}`}><Icon name={icon} size={18} /></span>
        <div>
          <p className="profile-list-item-title">{label}</p>
          <p className="profile-list-item-subtitle">About Spendly</p>
        </div>
      </div>
      <div className="profile-list-item-action">
        <span className={`profile-list-item-value ${destructive ? "is-destructive" : ""}`}>{value}</span>
        {onClick && <Icon name="chevron-right" size={16} />}
      </div>
    </RowTag>
  );
}

export function AboutCard({ onOpenPrivacy, onOpenTerms, onSignOut }) {
  return (
    <div className="profile-section-card">
      <ActionRow icon="info" label="App version" value={`Spendly v${pkg.version}`} />
      <div className="profile-divider" />
      <ActionRow icon="shield" label="Privacy Policy" value="Open" onClick={onOpenPrivacy} />
      <div className="profile-divider" />
      <ActionRow icon="document" label="Terms of Service" value="Open" onClick={onOpenTerms} />
      {onSignOut && (
        <>
          <div className="profile-divider" />
          <ActionRow icon="logout" label="Sign out" value="Exit" onClick={onSignOut} destructive />
        </>
      )}
    </div>
  );
}
