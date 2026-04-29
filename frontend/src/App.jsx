import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const demoTransactions = [
  { id: "txn-1", description: "Groceries", category: "Food", amount: 850, transaction_date: "2025-04-12", type: "expense", icon: "cart" },
  { id: "txn-2", description: "Metro card recharge", category: "Transport", amount: 500, transaction_date: "2025-04-11", type: "expense", icon: "bus" },
  { id: "txn-3", description: "Electricity bill", category: "Bills", amount: 2200, transaction_date: "2025-04-10", type: "expense", icon: "bolt" },
  { id: "txn-4", description: "Doctor visit", category: "Health", amount: 800, transaction_date: "2025-04-09", type: "expense", icon: "heart" },
  { id: "txn-5", description: "Netflix subscription", category: "Entertainment", amount: 649, transaction_date: "2025-04-08", type: "expense", icon: "ticket" },
  { id: "txn-6", description: "New shoes", category: "Shopping", amount: 3200, transaction_date: "2025-04-07", type: "expense", icon: "shoe" },
  { id: "txn-7", description: "Dinner with friends", category: "Food", amount: 1450, transaction_date: "2025-04-05", type: "expense", icon: "fork" },
];

const categoryMeta = {
  Shopping:     { color: "#e38b2f", chip: "#f5e1cb", icon: "#f0e4d4" },
  Food:         { color: "#1c5b48", chip: "#dcefe6", icon: "#d8ede5" },
  Bills:        { color: "#5e7ea7", chip: "#dce6f3", icon: "#d8e5f0" },
  Health:       { color: "#d26b76", chip: "#f4d7dc", icon: "#f2d4d8" },
  Entertainment:{ color: "#b38cc6", chip: "#eadcf3", icon: "#e8d9f0" },
  Transport:    { color: "#d4a767", chip: "#f1e0c6", icon: "#eeddc2" },
  Other:        { color: "#94a3b8", chip: "#e2e8f0", icon: "#dde4ed" },
};

const iconByCategory = {
  Food: "fork", Transport: "bus", Bills: "bolt",
  Health: "heart", Entertainment: "ticket", Shopping: "shoe", Other: "cart",
};

const filterTabs = ["This Month", "This Week", "Custom Range"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getRouteFromHash() {
  const raw = window.location.hash.replace("#", "");
  const clean = raw.startsWith("/") ? raw.slice(1) : raw;
  if (clean.startsWith("transactions")) return "transactions";
  if (clean.startsWith("insights")) return "insights";
  if (clean.startsWith("profile")) return "profile";
  return "dashboard";
}

function buildDonutGradient(segments) {
  if (!segments.length) return "conic-gradient(#e5e7eb 0deg 360deg)";
  let start = 0;
  const stops = segments.map((seg) => {
    const end = start + seg.percent;
    const stop = `${seg.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function getCategoryMeta(category) {
  return categoryMeta[category] || categoryMeta.Other;
}

function attachIcons(items) {
  return items.map((item) => ({
    ...item,
    icon: item.icon || iconByCategory[item.category] || "cart",
    description: item.description || item.raw_input || "Expense",
  }));
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function Icon({ name, size = 22 }) {
  const props = { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true };
  switch (name) {
    case "menu":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "home":
      return <svg {...props} fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
    case "swap":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L4 7m3-3 3 3"/><path d="M17 8v12m0 0 3-3m-3 3-3-3"/></svg>;
    case "barchart":
      return <svg {...props} fill="currentColor"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>;
    case "person":
      return <svg {...props} fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>;
    case "cart":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H7"/><circle cx="10" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "bus":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="5" y="4" width="14" height="12" rx="3"/><path d="M8 16v3m8-3v3M7 9h10" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/></svg>;
    case "bolt":
      return <svg {...props} fill="currentColor"><path d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z"/></svg>;
    case "heart":
      return <svg {...props} fill="currentColor"><path d="M12 20s-6-4.4-8.4-7.6C1.4 9.4 3.3 5 7.5 5c2.1 0 3.4 1.1 4.5 2.6C13.1 6.1 14.4 5 16.5 5c4.2 0 6.1 4.4 3.9 7.4C18 15.6 12 20 12 20Z"/></svg>;
    case "ticket":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M5 7h14v3a2 2 0 0 0 0 4v3H5v-3a2 2 0 0 0 0-4V7Z"/><path d="M9 9h6" strokeLinecap="round"/></svg>;
    case "shoe":
      return <svg {...props} fill="currentColor"><path d="M3 16c4 0 6-4 9-4 2.2 0 3.6 1.3 6 1.3 1.5 0 3-.4 3-.4v4.1H3Z"/></svg>;
    case "fork":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 3v7a2 2 0 0 0 4 0V3m8 0v18"/></svg>;
    case "search":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M20 20 16.5 16.5" strokeLinecap="round"/></svg>;
    case "share":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h8m-4-4 4 4-4 4"/><rect x="4" y="6" width="16" height="12" rx="3"/></svg>;
    case "download":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4"/><path d="M5 20h14"/></svg>;
    case "calendar":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case "bell":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M15 17H9m3 4a1 1 0 0 0 1-1h-2a1 1 0 0 0 1 1zM5.07 17A8 8 0 0 1 4 13V9a8 8 0 1 1 16 0v4a8 8 0 0 1-1.07 4H5.07z"/></svg>;
    case "chevron-down":
      return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>;
    default:
      return null;
  }
}

const NAV_TABS = [
  { label: "Dashboard", value: "dashboard", icon: "home" },
  { label: "Transactions", value: "transactions", icon: "swap" },
  { label: "Insights", value: "insights", icon: "barchart" },
  { label: "Profile", value: "profile", icon: "person" },
];

// ─── Mobile Header ────────────────────────────────────────────────────────────

function AppHeader({ displayName }) {
  return (
    <header className="app-header">
      <button className="header-icon-btn" aria-label="Menu"><Icon name="menu" size={24}/></button>
      <div className="header-logo">
        <div className="logo-s">S</div>
        <span className="logo-text">Spendly</span>
      </div>
      <div className="header-avatar">{displayName[0]?.toUpperCase() || "N"}</div>
    </header>
  );
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────

function BottomNav({ route, navigate }) {
  return (
    <nav className="bottom-nav">
      {NAV_TABS.map((tab) => (
        <button key={tab.value} className={`bottom-nav-item ${route === tab.value ? "active" : ""}`} onClick={() => navigate(tab.value)}>
          <span className="bottom-nav-icon"><Icon name={tab.icon} size={24}/></span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar({ route, navigate, displayName }) {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-logo">
        <div className="logo-s">S</div>
        <span className="logo-text">Spendly</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_TABS.map((tab) => (
          <button key={tab.value} className={`sidebar-nav-item ${route === tab.value ? "active" : ""}`} onClick={() => navigate(tab.value)}>
            <span className="sidebar-nav-icon"><Icon name={tab.icon} size={20}/></span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{displayName[0]?.toUpperCase() || "N"}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{displayName}</p>
          <p className="sidebar-user-role">Personal</p>
        </div>
        <span className="sidebar-chevron"><Icon name="chevron-down" size={16}/></span>
      </div>
    </aside>
  );
}

// ─── Desktop Header ───────────────────────────────────────────────────────────

function DesktopHeader({ route, displayName }) {
  const current = NAV_TABS.find((t) => t.value === route);
  return (
    <header className="desktop-header">
      <h1 className="desktop-header-title">{current?.label || "Dashboard"}</h1>
      <div className="desktop-header-right">
        <button className="desktop-date-pill">
          <Icon name="calendar" size={15}/>
          <span>Apr 1 – Apr 28, 2025</span>
          <Icon name="chevron-down" size={14}/>
        </button>
        <button className="desktop-bell-btn" aria-label="Notifications">
          <Icon name="bell" size={18}/>
        </button>
        <button className="desktop-user-pill">
          <div className="desktop-user-avatar">{displayName[0]?.toUpperCase() || "N"}</div>
          <span className="desktop-user-name">{displayName}</span>
          <Icon name="chevron-down" size={14}/>
        </button>
      </div>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardScreen({ displayName, transactions, totalSpent, transactionCount, topCategory, onSeeAll, onInsights }) {
  const recent = transactions.slice(0, 4);
  return (
    <div className="screen">
      <div className="greeting">
        <h1 className="greeting-title">Hello, {displayName}</h1>
        <p className="greeting-sub">Here's your spending overview</p>
      </div>

      <section className="card hero-card">
        <p className="card-label">Total Spent</p>
        <h2 className="hero-amount">{formatCurrency(totalSpent)}</h2>
      </section>

      <div className="summary-grid">
        <div className="card summary-card">
          <p className="card-label">Transactions</p>
          <h3 className="summary-value">{transactionCount}</h3>
        </div>
        <button className="card summary-card" onClick={onInsights}>
          <p className="card-label">Top Category</p>
          <div className="summary-pill">
            <span className="summary-pill-icon">{topCategory[0]}</span>
            <h3 className="summary-value">{topCategory}</h3>
          </div>
        </button>
      </div>

      <section className="card transaction-card">
        <div className="transaction-card-header">
          <h3 className="section-title">Recent Transactions</h3>
          <button className="see-all-btn" onClick={onSeeAll}>See All</button>
        </div>
        <div className="transaction-list">
          {recent.map((item) => (
            <div key={item.id} className="transaction-row">
              <div className="icon-circle" style={{ backgroundColor: getCategoryMeta(item.category).icon }}>
                <span style={{ color: getCategoryMeta(item.category).color }}>
                  <Icon name={item.icon} size={20}/>
                </span>
              </div>
              <div className="transaction-info">
                <p className="transaction-title">{item.description}</p>
                <p className="transaction-sub">{formatShortDate(item.transaction_date)}</p>
              </div>
              <div className="transaction-amount">– {formatCurrency(item.amount)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function getRelativeLabel(dateValue, referenceDate) {
  const date = new Date(`${dateValue}T00:00:00`);
  const diff = (referenceDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatShortDate(dateValue);
}

function TransactionsScreen({ transactions, search, setSearch, activeFilter, setActiveFilter }) {
  const sorted = useMemo(() =>
    [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)),
    [transactions]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const value = search.trim().toLowerCase();
    return sorted.filter((item) =>
      `${item.description || ""} ${item.raw_input || ""}`.toLowerCase().includes(value)
    );
  }, [search, sorted]);

  const referenceDate = filtered.length
    ? new Date(`${filtered[0].transaction_date}T00:00:00`)
    : new Date();

  const groups = filtered.reduce((acc, item) => {
    const label = getRelativeLabel(item.transaction_date, referenceDate);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="page-title-row">
        <h2 className="page-title">All Transactions</h2>
      </div>

      <div className="search-bar">
        <Icon name="search" size={18}/>
        <input
          type="text"
          placeholder="Search transactions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-row">
        {filterTabs.map((tab) => (
          <button key={tab} className={`filter-pill ${activeFilter === tab ? "active" : ""}`} onClick={() => setActiveFilter(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="transaction-groups">
        {Object.entries(groups).map(([label, items]) => (
          <section key={label} className="transaction-group">
            <div className="group-header">
              <p className="group-title">{label}</p>
              {(label === "Today" || label === "Yesterday") && (
                <p className="group-date">{formatShortDate(items[0].transaction_date)}</p>
              )}
            </div>
            {items.map((item) => {
              const meta = getCategoryMeta(item.category);
              return (
                <div key={item.id} className="transaction-row compact">
                  <div className="icon-circle" style={{ backgroundColor: meta.icon }}>
                    <span style={{ color: meta.color }}>
                      <Icon name={item.icon} size={20}/>
                    </span>
                  </div>
                  <div className="transaction-info">
                    <p className="transaction-title">{item.description}</p>
                    <div className="category-bar-wrap" style={{ width: "100%" }}>
                      <div
                        className="category-bar"
                        style={{ backgroundColor: meta.chip, width: "100%" }}
                      />
                      <span className="category-pill">{item.category}</span>
                    </div>
                  </div>
                  <div className="transaction-amount">{formatCurrency(item.amount)}</div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function InsightsScreen({ totalSpent, byCategory }) {
  const gradient = buildDonutGradient(byCategory);

  return (
    <div className="screen">
      {/* Title row rendered inline for mobile; on desktop, insights-header-row handles layout */}
      <div className="insights-header-row">
        <div>
          <h2 className="page-title">Spending Insights</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Track and analyze your spending habits</p>
        </div>
        <button className="export-btn">
          <Icon name="download" size={15}/>
          Export Report
        </button>
      </div>

      <div className="insights-columns">
        <section className="card donut-card">
          <div className="donut" style={{ background: gradient }}>
            <div className="donut-center">
              <p>Total Spent</p>
              <h2>{formatCurrency(totalSpent)}</h2>
            </div>
          </div>
          <div className="donut-legend">
            {byCategory.map((item) => (
              <div key={item.name} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ backgroundColor: item.color }}/>
                {item.name}
              </div>
            ))}
          </div>
        </section>

        <section className="card category-card">
          <div className="category-card-header">
            <h3 className="section-title">By Category</h3>
          </div>
          <div className="category-list">
            {byCategory.map((item) => (
              <div key={item.name} className="category-row">
                <div className="category-header">
                  <span className="category-name">{item.name}</span>
                  <div className="category-right">
                    <span className="category-amount">{formatCurrency(item.amount)}</span>
                    <span className="category-pct">{item.percent}%</span>
                  </div>
                </div>
                <div className="bar-track">
                  <span className="bar-fill" style={{ width: `${item.percent}%`, backgroundColor: item.color }}/>
                </div>
              </div>
            ))}
            <div className="category-total-row">
              <span>Total</span>
              <span>{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileScreen({ displayName, session }) {
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthScreen({ supabase }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const authAction = isLogin
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { data: { full_name: email.split("@")[0] } } });

    const { data, error } = await authAction;

    if (error) {
      setError(error.message);
    } else if (!isLogin && !data?.session) {
      setError("Signed up successfully! You can now sign in.");
      setIsLogin(true); // Switch to login after signup
    }
    setLoading(false);
  };

  return (
    <div className="screen" style={{ justifyContent: "center", display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", padding: "1rem" }}>
      <section className="card" style={{ width: "100%", maxWidth: 400, padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", gap: "0.5rem" }}>
          <div className="app-logo">S</div>
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Spendly</h2>
        </div>
        <h3 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: "1.25rem", margin: "0 0 1.5rem 0", color: "var(--text)" }}>
          {isLogin ? "Sign In" : "Create Account"}
        </h3>
        
        {error && (
          <div style={{ color: "#b91c1c", fontSize: "14px", marginBottom: "1rem", padding: "0.75rem", background: "#fee2e2", borderRadius: 6 }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text)" }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", fontSize: "16px", background: "var(--card)", boxSizing: "border-box", outline: "none" }} 
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text)" }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", fontSize: "16px", background: "var(--card)", boxSizing: "border-box", outline: "none" }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ background: "var(--accent)", color: "#fff", padding: "0.875rem", borderRadius: 8, fontWeight: 600, border: "none", cursor: loading ? "default" : "pointer", marginTop: "0.5rem", fontSize: "16px", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: "14px", marginTop: "1.5rem", color: "var(--muted)" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }} 
            style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </section>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

async function edgeFetch(path, { method = "GET", body, token } = {}) {
  if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${supabaseUrl}/functions/v1${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  if (!response.ok) { const text = await response.text(); throw new Error(text || `Request failed: ${response.status}`); }
  return response.json();
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash());
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(filterTabs[0]);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "#/dashboard";
    const handleChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handleChange);
    return () => window.removeEventListener("hashchange", handleChange);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setSession(data.session); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadTransactions() {
      if (!supabaseUrl || !session?.user) {
        setTransactions([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("transaction_date", { ascending: false });

        if (error) throw error;
        if (!active) return;
        setTransactions(data ? attachIcons(data) : []);
      } catch (err) {
        console.error("Error loading transactions:", err);
        if (active) setTransactions([]);
      }
    }
    loadTransactions();
    return () => { active = false; };
  }, [session]);

  const displayName = useMemo(() => {
    if (!session?.user) return "Nitish";
    return session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
  }, [session]);

  const expenses = useMemo(() => {
    return transactions.filter((i) => i.type !== "income");
  }, [transactions]);

  const transactionCount = expenses.length;

  const totalSpent = useMemo(() =>
    expenses.reduce((s, i) => s + Number(i.amount || 0), 0),
    [expenses]
  );

  const byCategory = useMemo(() => {
    if (expenses.length === 0) return [];
    
    const totals = new Map();
    expenses.forEach((item) => {
      totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount || 0));
    });
    
    const total = totalSpent || 1;
    let list = Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        color: getCategoryMeta(name).color,
        percent: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
      
    if (list.length > 0) {
      const sumPct = list.reduce((s, i) => s + i.percent, 0);
      const diff = 100 - sumPct;
      if (diff !== 0) {
        // Adjust the largest category to absorb rounding remainders
        list[0].percent += diff;
      }
    }
    
    return list;
  }, [expenses, totalSpent]);

  const topCategory = byCategory.length > 0 ? byCategory[0].name : "—";
  const navigate = (next) => { window.location.hash = `#/${next}`; };

  if (!session) {
    return <AuthScreen supabase={supabase} />;
  }

  const screenContent = (
    <>
      {route === "dashboard" && (
        <DashboardScreen
          displayName={displayName} transactions={transactions}
          totalSpent={totalSpent} transactionCount={transactionCount} topCategory={topCategory}
          onSeeAll={() => navigate("transactions")}
          onInsights={() => navigate("insights")}
        />
      )}
      {route === "transactions" && (
        <TransactionsScreen
          transactions={transactions} search={search} setSearch={setSearch}
          activeFilter={activeFilter} setActiveFilter={setActiveFilter}
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
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="desktop-shell">
        <DesktopSidebar route={route} navigate={navigate} displayName={displayName}/>
        <div className="desktop-body">
          <DesktopHeader route={route} displayName={displayName}/>
          <main className="desktop-main">{screenContent}</main>
        </div>
      </div>
    </>
  );
}
