import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { filterTabs } from "./lib/constants";
import { getRouteFromHash, edgeFetch, formatCurrency, getCategoryMeta, attachIcons } from "./lib/utils";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";

import { AppHeader, BottomNav, DesktopSidebar, DesktopHeader } from "./components/Layout";
import { DashboardScreen } from "./components/Dashboard";
import { TransactionsScreen } from "./components/Transactions";
import { InsightsScreen } from "./components/Insights";
import { ProfileScreen } from "./components/Profile";
import { AuthScreen } from "./components/Auth";
import { AddTransactionScreen } from "./components/AddTransaction";

/* ── FAB examples ─────────────────────────────────────────────────────── */
const FAB_EXAMPLES = [
  "500 for netflix",
  "2500 pocket money received",
  "paid 1200 electricity bill",
  "50000 salary credited",
];

/* ── FAB Component ────────────────────────────────────────────────────── */
function FAB({ session, onSaved }) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const [parsed, setParsed]   = useState(null);
  const [status, setStatus]   = useState("idle"); // idle|parsing|ready|saving|done
  const [error, setError]     = useState("");

  const today = new Date().toISOString().slice(0, 10);

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
      setStatus("done");
      onSaved?.(saved);
      setTimeout(close, 1600);
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

          {/* Example chips */}
          {status === "idle" && !parsed && (
            <div className="fab-example-chips">
              {FAB_EXAMPLES.map((ex) => (
                <button key={ex} className="fab-ex-chip"
                  onClick={() => { setText(ex); handleParse(ex); }}>
                  {ex}
                </button>
              ))}
            </div>
          )}

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
              {status === "done" ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{isIncome ? "💚" : "✅"}</div>
                  <p style={{ fontWeight: 600, color: "var(--text)" }}>Saved to Spendly!</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {formatCurrency(parsed.amount)} · {parsed.category}
                  </p>
                </div>
              ) : (
                <>
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
                    <span className="fab-meta-chip">{parsed.date || "Today"}</span>
                  </div>
                  <button
                    className={`fab-save-btn ${isIncome ? "income" : "expense"}`}
                    onClick={handleSave}
                    disabled={status === "saving"}
                  >
                    {status === "saving" ? "Saving…" : `Save ${isIncome ? "Income" : "Expense"} →`}
                  </button>
                </>
              )}
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
  
  const { session, loading: authLoading } = useAuth();
  const { 
    transactions, 
    setTransactions,
    totalSpent, 
    byCategory, 
    topCategory, 
    customRange, 
    setCustomRange, 
    applyCustom 
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

  const displayName = useMemo(() => {
    if (!session?.user) return "User";
    return session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
  }, [session]);

  const navigate = (next) => { window.location.hash = `#/${next}`; };

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
        />
      )}
      {route === "transactions" && (
        <TransactionsScreen
          transactions={transactions} search={search} setSearch={setSearch}
          activeFilter={activeFilter} setActiveFilter={setActiveFilter}
          customRange={customRange} setCustomRange={setCustomRange}
          onApplyCustom={applyCustom}
        />
      )}
      {route === "add" && (
        <AddTransactionScreen 
          session={session} 
          navigate={navigate} 
          setTransactions={setTransactions} 
        />
      )}
      {route === "insights" && (
        <InsightsScreen totalSpent={totalSpent} byCategory={byCategory}/>
      )}
      {route === "profile" && (
        <ProfileScreen displayName={displayName} session={session}/>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="mobile-shell">
        <div className="app-frame">
          <AppHeader displayName={displayName}/>
          <main className="app-main">{screenContent}</main>
          <BottomNav route={route} navigate={navigate}/>
          <FAB session={session} onSaved={handleFabSaved} />
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="desktop-shell">
        <DesktopSidebar route={route} navigate={navigate} displayName={displayName}/>
        <div className="desktop-body">
          <DesktopHeader route={route} displayName={displayName} activeFilter={activeFilter}/>
          <main className="desktop-main">{screenContent}</main>
        </div>
        <FAB session={session} onSaved={handleFabSaved} />
      </div>
    </>
  );
}
