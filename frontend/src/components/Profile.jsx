import { supabase } from "../lib/supabaseClient";

export function ProfileScreen({ displayName, session }) {
  return (
    <div className="screen">
      <div className="page-title-row">
        <h2 className="page-title">Profile</h2>
      </div>
      <section className="card profile-card">
        <div className="profile-avatar-large">{displayName[0]?.toUpperCase() || "N"}</div>
        <h3 className="profile-name">{displayName}</h3>
        <p className="profile-email">{session?.user?.email || "demo@spendly.app"}</p>
        <button
          className="btn"
          style={{ marginTop: "1.5rem", background: "none", border: "1px solid var(--red-base)", color: "var(--red-base)", width: "100%", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
