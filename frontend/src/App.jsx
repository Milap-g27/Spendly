import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { filterTabs } from "./lib/constants";
import { getRouteFromHash, edgeFetch, formatCurrency, getCategoryMeta, attachIcons } from "./lib/utils";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { getProfile as apiGetProfile, updateProfile as apiUpdateProfile, uploadAvatar as apiUploadAvatar } from "./services/profile";

import { AppHeader, BottomNav, DesktopSidebar, DesktopHeader } from "./components/Layout";
import { MobileDrawer } from "./components/MobileDrawer";
import { DashboardScreen } from "./components/Dashboard";
import { TransactionsScreen } from "./components/Transactions";
import { InsightsScreen } from "./components/Insights";
import { ProfileScreen } from "./components/Profile";
import { AuthScreen } from "./components/Auth";
import { AddTransactionScreen } from "./components/AddTransaction";
import { PrivacyPolicyScreen } from "./pages/PrivacyPolicy";
import { TermsScreen } from "./pages/Terms";
import { ToastContainer } from "./components/Toast";

/* ── FAB examples ─────────────────────────────────────────────────────── */
const FAB_EXAMPLES = [
  "500 for netflix",
  "2500 pocket money received",
  "paid 1200 electricity bill",
  "50000 salary credited",
];

/* ── FAB Component ────────────────────────────────────────────────────── */
function FAB({ session, onSaved, addToast, onUndoTransaction }) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const [parsed, setParsed]   = useState(null);
  const [status, setStatus]   = useState("idle"); // idle|parsing|ready|saving|done
  const [error, setError]     = useState("");

  const getISTDate = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  };
  
  const today = getISTDate(0);
  const yesterdayStr = getISTDate(-1);

  const close = () => {
    setOpen(false);
    setText(""); setParsed(null); setStatus("idle"); setError("");
  };

  const handleParse = async (inputText) => {
    const t = (inputText || text).trim();
    if (!t) return;
    setStatus("parsing"); setError(""); setParsed(null);
    try {
      const result = await edgeFetch("/parse", {
        method: "POST",
        body: { text: t, today },
        token: session?.access_token,
      });
      setParsed(result);
      setStatus("ready");
    } catch (e) {
      setError(e.message || "Could not parse. Try rephrasing.");
      setStatus("idle");
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setStatus("saving");
    try {
      const saved = await edgeFetch("/transactions", {
        method: "POST",
        body: {
          raw_input:        text,
          type:             parsed.type,
          amount:           parsed.amount,
          category:         parsed.category,
          description:      parsed.description,
          transaction_date: parsed.date || today,
        },
        token: session?.access_token,
      });
      
      // Show success toast with undo
      if (addToast) {
        addToast(
          `✓ ${parsed.type === "income" ? "Income" : "Expense"} of ₹${parsed.amount.toFixed(2)} added`,
          "success",
          5000,
          () => onUndoTransaction?.(saved.id)
        );
      }
      
      onSaved?.(saved);
      close();
    } catch (e) {
      setError("Save failed: " + e.message);
      setStatus("ready");
    }
  };

  const isIncome = parsed?.type === "income";
  const catMeta  = parsed ? getCategoryMeta(parsed.category) : null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fab-overlay ${open ? "show" : ""}`}
        onClick={close}
      />

      {/* Popup */}
      <div className={`fab-popup ${open ? "show" : ""}`}>
        <div className="fab-popup-inner">
          <p className="fab-popup-label">Quick add</p>
          <p className="fab-popup-title">What did you spend or earn?</p>

          <div className="fab-input-row">
            <input
              className="fab-nlp-input"
              placeholder="Add a Transaction"
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); setParsed(null); setStatus("idle"); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleParse(); }}
              autoFocus={open}
            />
            <button
              className="fab-submit-btn"
              onClick={() => handleParse()}
              disabled={status === "parsing"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Parsing bar */}
          <div className={`fab-parsing-bar ${status === "parsing" ? "show" : ""}`}>
            <div className="fab-parsing-fill" style={{ width: status === "parsing" ? "80%" : "0%" }} />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#dc2626", marginTop: 10 }}>⚠ {error}</p>
          )}

          {/* Result preview */}
          {parsed && status !== "parsing" && (
            <div className={`fab-result show ${isIncome ? "income" : "expense"}`}>
              <div className="fab-result-top">
                <span className={`fab-result-amount ${isIncome ? "income" : "expense"}`}>
                  {formatCurrency(parsed.amount)}
                </span>
                <span className="type-badge" style={{
                  background: isIncome ? "#dcfce7" : "#fee2e2",
                  color: isIncome ? "#166534" : "#991b1b",
                }}>
                  {isIncome ? "↑ Income" : "↓ Expense"}
                </span>
              </div>
              <div className="fab-meta">
                <span className="fab-meta-chip" style={{
                  background: catMeta.chip, color: catMeta.color, border: "none"
                }}>
                  {parsed.category}
                </span>
                <span className="fab-meta-chip">{parsed.description}</span>
                <span className="fab-meta-chip">{
                  (() => {
                    if (!parsed.date || parsed.date === today) return "📅 Today";
                    if (parsed.date === yesterdayStr) return "📅 Yesterday";
                    const d = new Date(parsed.date + "T00:00:00");
                    return "📅 " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                  })()
                }</span>
              </div>
              <button
                className={`fab-save-btn ${isIncome ? "income" : "expense"}`}
                onClick={handleSave}
                disabled={status === "saving"}
              >
                {status === "saving" ? "Saving…" : `Save ${isIncome ? "Income" : "Expense"} →`}
              </button>
            </div>
          )}
        </div>
        <p className="fab-popup-tip">Powered by AI · Press Enter to parse</p>
      </div>

      {/* The + button */}
      <button className={`fab ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash());
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(filterTabs[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState("User");
  const [profileAvatarSrc, setProfileAvatarSrc] = useState("");
  const [profileMonthlyBudget, setProfileMonthlyBudget] = useState(0);
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = "info", duration = 5000, onUndoCallback = null) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts([{ id, message, type, duration, onUndo: onUndoCallback }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleUndoTransaction = async (txId) => {
    if (!txId) return;
    // Remove from UI immediately
    setTransactions(prev => prev.filter(tx => tx.id !== txId));
    // Delete from database
    try {
      await supabase.from('transactions').delete().eq('id', txId);
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      // Optionally re-add to list if deletion failed
    }
  };
  
  const { session, loading: authLoading } = useAuth();
  const { 
    transactions, 
    setTransactions,
    totalSpent, 
    byCategory, 
    topCategory, 
    customRange, 
    setCustomRange, 
    applyCustom,
    settleTransaction
  } = useTransactions(session, activeFilter);

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "#/dashboard";
    const handleChange = () => {
      if (window.location.hash === "#/logout") {
        supabase.auth.signOut().then(() => {
          window.location.hash = "#/dashboard";
        });
        return;
      }
      setRoute(getRouteFromHash());
    };
    window.addEventListener("hashchange", handleChange);
    return () => window.removeEventListener("hashchange", handleChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [route]);

  useEffect(() => {
    if (!session?.user) return;
    const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";

    (async () => {
      try {
        const p = await apiGetProfile(session.user);
        setProfileName(p?.display_name || fallbackName);
        setProfileAvatarSrc(p?.avatar_url || "");
        setProfileMonthlyBudget(Number(p?.monthly_budget) || 0);
      } catch (err) {
        setProfileName(window.localStorage.getItem("spendly.profile.name") || fallbackName);
        setProfileAvatarSrc(window.localStorage.getItem("spendly.profile.avatar") || "");
        setProfileMonthlyBudget(Number(window.localStorage.getItem("spendly.profile.monthlyBudget")) || 0);
      }
    })();
  }, [session]);

  const displayName = profileName;

  const navigate = (next) => { window.location.hash = `#/${next}`; };
  const isPolicyRoute = route === "privacy" || route === "terms";

  const updateProfile = async (patch) => {
    try {
      if (Object.prototype.hasOwnProperty.call(patch, "name")) {
        const updated = await apiUpdateProfile({ display_name: patch.name || null }, session.user);
        setProfileName(updated.display_name || "User");
        window.localStorage.setItem("spendly.profile.name", updated.display_name || "User");
      }

      if (Object.prototype.hasOwnProperty.call(patch, "monthlyBudget")) {
        const budgetValue = patch.monthlyBudget === "" || patch.monthlyBudget == null ? 0 : Number(patch.monthlyBudget);
        const updated = await apiUpdateProfile({ monthly_budget: budgetValue }, session.user);
        setProfileMonthlyBudget(Number(updated.monthly_budget) || 0);
        window.localStorage.setItem("spendly.profile.monthlyBudget", String(Number(updated.monthly_budget) || 0));
      }

      // avatarSrc may be a string preview or a File object (from AvatarUpload)
      if (Object.prototype.hasOwnProperty.call(patch, "avatarSrc")) {
        if (patch.avatarSrc instanceof File) {
          const publicUrl = await apiUploadAvatar(patch.avatarSrc, session.user);
          setProfileAvatarSrc(publicUrl || "");
          window.localStorage.setItem("spendly.profile.avatar", publicUrl || "");
        } else {
          // preview/base64 string — persist as temporary local state
          setProfileAvatarSrc(patch.avatarSrc || "");
          window.localStorage.setItem("spendly.profile.avatar", patch.avatarSrc || "");
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleFabSaved = (tx) => {
    setTransactions(prev => {
      const newList = [attachIcons([tx])[0], ...prev];
      return newList.sort((a, b) => {
        const timeDiff = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });
  };

  if (isPolicyRoute) {
    return route === "privacy"
      ? <PrivacyPolicyScreen navigate={navigate} />
      : <TermsScreen navigate={navigate} />;
  }

  if (authLoading) return null; // Or a splash screen
  if (!session) return <AuthScreen supabase={supabase} />;

  const screenContent = (
    <>
      {route === "dashboard" && (
        <DashboardScreen
          displayName={displayName} transactions={transactions}
          totalSpent={totalSpent} transactionCount={transactions.length} topCategory={topCategory}
          onSeeAll={() => navigate("transactions")}
          onInsights={() => navigate("insights")}
          addToast={addToast}
          monthlyBudget={profileMonthlyBudget}
        />
      )}
      {route === "transactions" && (
        <TransactionsScreen
          transactions={transactions} search={search} setSearch={setSearch}
          activeFilter={activeFilter} setActiveFilter={setActiveFilter}
          customRange={customRange} setCustomRange={setCustomRange}
          onApplyCustom={applyCustom} setTransactions={setTransactions}
          settleTransaction={settleTransaction}
        />
      )}
      {route === "add" && (
        <AddTransactionScreen 
          session={session} 
          navigate={navigate} 
          setTransactions={setTransactions}
          addToast={addToast}
          onUndoTransaction={handleUndoTransaction}
        />
      )}
      {route === "insights" && (
        <InsightsScreen totalSpent={totalSpent} byCategory={byCategory} transactions={transactions}/>
      )}
      {route === "profile" && (
        <ProfileScreen
          displayName={displayName}
          session={session}
          transactions={transactions}
          navigate={navigate}
          avatarSrc={profileAvatarSrc}
          monthlyBudget={profileMonthlyBudget}
          onProfileChange={updateProfile}
        />
      )}
      {route === "budgets" && (
        <div className="screen">
          <div className="card">
            <p className="page-title">Budgets</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              Budget tracking is not set up yet in this build.
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      
      {/* ── Mobile layout ── */}
      <div className="mobile-shell">
        <div className="app-frame">
          <AppHeader displayName={displayName} avatarSrc={profileAvatarSrc} onMenuClick={() => setMenuOpen(true)} menuOpen={menuOpen}/>
          <main className="app-main">{screenContent}</main>
          <BottomNav route={route} navigate={navigate}/>
          <FAB session={session} onSaved={handleFabSaved} addToast={addToast} onUndoTransaction={handleUndoTransaction} />
        </div>
      </div>

      <MobileDrawer
        menuOpen={menuOpen}
        route={route}
        navigate={navigate}
        setMenuOpen={setMenuOpen}
      />

      {/* ── Desktop layout ── */}
      <div className="desktop-shell">
        <DesktopSidebar route={route} navigate={navigate} displayName={displayName}/>
        <div className="desktop-body">
          <DesktopHeader route={route} displayName={displayName} avatarSrc={profileAvatarSrc} activeFilter={activeFilter}/>
          <main className="desktop-main">{screenContent}</main>
        </div>
        <FAB session={session} onSaved={handleFabSaved} addToast={addToast} onUndoTransaction={handleUndoTransaction} />
      </div>
    </>
  );
}
