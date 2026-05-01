import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Icon } from "./Icons";
import { PersonalInfoCard } from "./profile/PersonalInfoCard";
import { BudgetCard } from "./profile/BudgetCard";
import { ChangePasswordModal } from "./profile/ChangePasswordModal";
import { AboutCard } from "./profile/AboutCard";

function ProfileSection({ label, children }) {
  return (
    <section className="profile-section">
      <p className="profile-section-label">{label}</p>
      {children}
    </section>
  );
}

export function ProfileScreen({ displayName, session, transactions, navigate, onProfileChange, avatarSrc, monthlyBudget }) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <div className="screen profile-screen">
      <div className="page-title-row">
        <h2 className="page-title">Profile</h2>
      </div>

      <ProfileSection label="PERSONAL INFO">
        <PersonalInfoCard
          displayName={displayName}
          email={session?.user?.email}
          avatarSrc={avatarSrc}
          onAvatarSave={(nextAvatar) => onProfileChange?.({ avatarSrc: nextAvatar })}
          onNameSave={(nextName) => onProfileChange?.({ name: nextName })}
        />
      </ProfileSection>

      <ProfileSection label="BUDGET & LIMITS">
        <BudgetCard transactions={transactions} budget={monthlyBudget} onSaveBudget={(nextBudget) => onProfileChange?.({ monthlyBudget: nextBudget })} />
      </ProfileSection>

      <ProfileSection label="SECURITY">
        <div className="profile-section-card">
          <button type="button" className="profile-list-item profile-action-row is-clickable" onClick={() => setPasswordModalOpen(true)}>
            <div className="profile-list-item-main">
              <span className="profile-list-item-icon"><Icon name="lock" size={18} /></span>
              <div>
                <p className="profile-list-item-title">Change password</p>
                <p className="profile-list-item-subtitle">Keep your account secure</p>
              </div>
            </div>
            <div className="profile-list-item-action">
              <span className="profile-list-item-value">Update</span>
              <span className="profile-chevron">›</span>
            </div>
          </button>
        </div>
      </ProfileSection>

      <ProfileSection label="ABOUT">
        <AboutCard
          onOpenPrivacy={() => navigate("privacy")}
          onOpenTerms={() => navigate("terms")}
        />
      </ProfileSection>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        supabase={supabase}
      />
    </div>
  );
}
