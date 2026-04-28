import { useEffect, useMemo, useState } from "react";

import { supabase } from "./lib/supabaseClient";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const demoTransactions = [
  {
    id: "txn-1",
    description: "Groceries",
    category: "Food",
    amount: 850,
    transaction_date: "2025-04-12",
    type: "expense",
    icon: "cart",
  },
  {
    id: "txn-2",
    description: "Metro card recharge",
    category: "Transport",
    amount: 500,
    transaction_date: "2025-04-11",
    type: "expense",
    icon: "bus",
  },
  {
    id: "txn-3",
    description: "Electricity bill",
    category: "Bills",
    amount: 2200,
    transaction_date: "2025-04-10",
    type: "expense",
    icon: "bolt",
  },
  {
    id: "txn-4",
    description: "Doctor visit",
    category: "Health",
    amount: 800,
    transaction_date: "2025-04-09",
    type: "expense",
    icon: "heart",
  },
  {
    id: "txn-5",
    description: "Netflix subscription",
    category: "Entertainment",
    amount: 649,
    transaction_date: "2025-04-08",
    type: "expense",
    icon: "ticket",
  },
  {
    id: "txn-6",
    description: "New shoes",
    category: "Shopping",
    amount: 3200,
    transaction_date: "2025-04-07",
    type: "expense",
    icon: "shoe",
  },
  {
    id: "txn-7",
    description: "Dinner with friends",
    category: "Food",
    amount: 1450,
    transaction_date: "2025-04-05",
    type: "expense",
    icon: "fork",
  },
];

const categoryMeta = {
  Shopping: {
    color: "#e38b2f",
    chip: "#f5e1cb",
    icon: "#f8e7d3",
  },
  Food: {
    color: "#1c5b48",
    chip: "#dcefe6",
    icon: "#e7f3ee",
  },
  Bills: {
    color: "#5e7ea7",
    chip: "#dce6f3",
    icon: "#e5edf7",
  },
  Health: {
    color: "#d26b76",
    chip: "#f4d7dc",
    icon: "#f7e1e4",
  },
  Entertainment: {
    color: "#b38cc6",
    chip: "#eadcf3",
    icon: "#efe3f6",
  },
  Transport: {
    color: "#d4a767",
    chip: "#f1e0c6",
    icon: "#f5e8d3",
  },
  Other: {
    color: "#94a3b8",
    chip: "#e2e8f0",
    icon: "#eef2f6",
  },
};

const iconByCategory = {
  Food: "fork",
  Transport: "bus",
  Bills: "bolt",
  Health: "heart",
  Entertainment: "ticket",
  Shopping: "shoe",
  Other: "cart",
};

const filterTabs = ["This Month", "This Week", "Custom Range"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  const amount = Number(value || 0);
  return currencyFormatter.format(amount);
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRouteFromHash() {
  const raw = window.location.hash.replace("#", "");
  const clean = raw.startsWith("/") ? raw.slice(1) : raw;
  if (clean.startsWith("transactions")) return "transactions";
  if (clean.startsWith("insights")) return "insights";
  return "dashboard";
}

function buildDonutGradient(segments) {
  if (!segments.length) return "conic-gradient(#e5e7eb 0deg 360deg)";
  let start = 0;
  const stops = segments.map((segment) => {
    const end = start + segment.percent;
    const stop = `${segment.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function Icon({ name }) {
  switch (name) {
    case "cart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.5" fill="currentColor" />
          <circle cx="18" cy="20" r="1.5" fill="currentColor" />
        </svg>
      );
    case "bus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="5"
            y="4"
            width="14"
            height="12"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8 16v3m8-3v3M7 9h10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20s-6-4.4-8.4-7.6C1.4 9.4 3.3 5 7.5 5c2.1 0 3.4 1.1 4.5 2.6C13.1 6.1 14.4 5 16.5 5c4.2 0 6.1 4.4 3.9 7.4C18 15.6 12 20 12 20Z"
            fill="currentColor"
          />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7h14v3a2 2 0 0 0 0 4v3H5v-3a2 2 0 0 0 0-4V7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9 9h6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "shoe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 16c4 0 6-4 9-4 2.2 0 3.6 1.3 6 1.3 1.5 0 3-.4 3-.4v4.1H3Z"
            fill="currentColor"
          />
        </svg>
      );
    case "fork":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 3v7a2 2 0 0 0 4 0V3m8 0v18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "arrow-left":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15 6 9 12l6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "share":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 12h8m-4-4 4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="4"
            y="6"
            width="16"
            height="12"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="11"
            cy="11"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M20 20 16.5 16.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function getRelativeLabel(dateValue, referenceDate) {
  const date = new Date(`${dateValue}T00:00:00`);
  const diff =
    (referenceDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatShortDate(dateValue);
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

async function edgeFetch(path, { method = "GET", body, token } = {}) {
  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

function DashboardScreen({
  displayName,
  transactions,
  totalSpent,
  topCategory,
  onSeeAll,
  onInsights,
}) {
  const recent = transactions.slice(0, 4);

  return (
    <div className="screen">
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-mark" />
          <span>Spendly</span>
        </div>
        <div className="user-chip">
          <span>{displayName}</span>
          <div className="avatar">N</div>
        </div>
      </header>

      <div className="greeting">
        <p>Hello, {displayName}</p>
      </div>

      <section className="card hero-card">
        <p className="card-label">Total Spent</p>
        <h1>{formatCurrency(totalSpent)}</h1>
      </section>

      <section className="summary-grid">
        <div className="card summary-card">
          <p className="card-label">Transactions</p>
          <h2>{transactions.length}</h2>
        </div>
        <button className="card summary-card" onClick={onInsights}>
          <p className="card-label">Top Category</p>
          <div className="summary-pill">
            <span className="summary-pill-icon">{topCategory[0]}</span>
            <h2>{topCategory}</h2>
          </div>
        </button>
      </section>

      <section className="card transaction-card">
        <div className="transaction-card-header">
          <h3>Recent Transactions</h3>
          <button className="text-button" onClick={onSeeAll}>
            See All
          </button>
        </div>
        <div className="transaction-list">
          {recent.map((item) => (
            <div key={item.id} className="transaction-row">
              <div
                className="icon-circle"
                style={{ backgroundColor: getCategoryMeta(item.category).icon }}
              >
                <Icon name={item.icon} />
              </div>
              <div>
                <p className="transaction-title">{item.description}</p>
                <p className="transaction-sub">
                  {formatShortDate(item.transaction_date)} - {formatCurrency(item.amount)}
                </p>
              </div>
              <div className="transaction-amount">- {formatCurrency(item.amount)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TransactionsScreen({
  transactions,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  onBack,
}) {
  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) =>
      b.transaction_date.localeCompare(a.transaction_date)
    );
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const value = search.trim().toLowerCase();
    return sorted.filter((item) => {
      const haystack = `${item.description || ""} ${item.raw_input || ""}`
        .toLowerCase();
      return haystack.includes(value);
    });
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
      <header className="page-header">
        <button className="icon-button" onClick={onBack}>
          <Icon name="arrow-left" />
        </button>
        <h2>All Transactions</h2>
        <span className="header-spacer" />
      </header>

      <div className="search-bar">
        <Icon name="search" />
        <input
          type="text"
          placeholder="Search transactions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="filter-row">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeFilter === tab ? "active" : ""}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="transaction-groups">
        {Object.entries(groups).map(([label, items]) => (
          <section key={label} className="transaction-group">
            <div className="group-header">
              <p className="group-title">{label}</p>
              {label === "Today" || label === "Yesterday" ?
                (
                  <p className="group-date">
                    {formatShortDate(items[0].transaction_date)}
                  </p>
                ) : null}
            </div>
            {items.map((item) => (
              <div key={item.id} className="transaction-row compact">
                <div
                  className="icon-circle"
                  style={{ backgroundColor: getCategoryMeta(item.category).icon }}
                >
                  <Icon name={item.icon} />
                </div>
                <div>
                  <p className="transaction-title">{item.description}</p>
                  <span
                    className="category-pill"
                    style={{ backgroundColor: getCategoryMeta(item.category).chip }}
                  >
                    {item.category}
                  </span>
                </div>
                <div className="transaction-amount">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function InsightsScreen({ totalSpent, byCategory, onBack }) {
  const gradient = buildDonutGradient(byCategory);

  return (
    <div className="screen insights-screen">
      <header className="page-header">
        <button className="icon-button" onClick={onBack}>
          <Icon name="arrow-left" />
        </button>
        <span className="header-spacer" />
        <button className="icon-button ghost">
          <Icon name="share" />
        </button>
      </header>

      <h1 className="insights-title">Spending Insights</h1>

      <section className="card donut-card">
        <div className="donut" style={{ background: gradient }}>
          <div className="donut-center">
            <p>Total Spent:</p>
            <h2>{formatCurrency(totalSpent)}</h2>
          </div>
        </div>
      </section>

      <section className="card category-card">
        <h3>By Category</h3>
        <div className="category-list">
          {byCategory.map((item) => (
            <div key={item.name} className="category-row">
              <div className="category-header">
                <span>{item.name}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
              <div className="bar-track">
                <span
                  className="bar-fill"
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash());
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(filterTabs[0]);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState(attachIcons(demoTransactions));

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/dashboard";
    }
    const handleChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handleChange);
    return () => window.removeEventListener("hashchange", handleChange);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      if (!supabaseUrl || !session?.access_token) {
        setTransactions(attachIcons(demoTransactions));
        return;
      }

      try {
        const result = await edgeFetch("/transactions?limit=50", {
          token: session.access_token,
        });
        if (!active) return;
        const items = result?.data ? attachIcons(result.data) : [];
        setTransactions(items);
      } catch (error) {
        if (!active) return;
        setTransactions(attachIcons(demoTransactions));
      }
    }

    loadTransactions();

    return () => {
      active = false;
    };
  }, [session]);

  const displayName = useMemo(() => {
    if (!session?.user) return "Nitish";
    return (
      session.user.user_metadata?.full_name ||
      session.user.email?.split("@")[0] ||
      "User"
    );
  }, [session]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter((item) => item.type !== "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  const byCategory = useMemo(() => {
    const totals = new Map();
    transactions.forEach((item) => {
      if (item.type === "income") return;
      totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount || 0));
    });

    const total = totalSpent || 1;
    return Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        color: getCategoryMeta(name).color,
        percent: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, totalSpent]);

  const topCategory = byCategory[0]?.name || "Food";

  const navigate = (next) => {
    window.location.hash = `#/${next}`;
  };

  return (
    <div className="app-shell">
      <nav className="route-switch">
        {[
          { label: "Dashboard", value: "dashboard" },
          { label: "Transactions", value: "transactions" },
          { label: "Insights", value: "insights" },
        ].map((item) => (
          <button
            key={item.value}
            className={route === item.value ? "active" : ""}
            onClick={() => navigate(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="app-frame">
        {route === "dashboard" ?
          (
            <DashboardScreen
              displayName={displayName}
              transactions={transactions}
              totalSpent={totalSpent}
              topCategory={topCategory}
              onSeeAll={() => navigate("transactions")}
              onInsights={() => navigate("insights")}
            />
          ) : null}
        {route === "transactions" ?
          (
            <TransactionsScreen
              transactions={transactions}
              search={search}
              setSearch={setSearch}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onBack={() => navigate("dashboard")}
            />
          ) : null}
        {route === "insights" ?
          (
            <InsightsScreen
              totalSpent={totalSpent}
              byCategory={byCategory}
              onBack={() => navigate("dashboard")}
            />
          ) : null}
      </div>
    </div>
  );
}