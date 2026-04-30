import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icons";
import { edgeFetch } from "../lib/utils";

/* ── Inline SVG Icons ─────────────────────────────────────────── */

const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B52F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

/* ── Custom Select Dropdown ───────────────────────────────────── */

function CustomSelect({ value, options, placeholder, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedOpt = options.find(o => o.value === value);

  return (
    <>
      <div
        className="at-input has-left-icon has-right-icon"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", cursor: "pointer",
          color: selectedOpt ? "var(--text)" : "var(--muted)",
        }}
      >
        {selectedOpt ? selectedOpt.label : placeholder}
      </div>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%",
            background: "var(--card)", borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: "1px solid var(--border)", zIndex: 100,
            overflow: "hidden", animation: "dropdownFadeIn 0.15s ease-out",
            maxHeight: "240px", overflowY: "auto",
          }}>
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: "12px 16px", fontSize: "15px", cursor: "pointer",
                  color: value === opt.value ? "var(--accent)" : "var(--text)",
                  background: value === opt.value ? "var(--accent-light)" : "transparent",
                  fontWeight: value === opt.value ? "600" : "500",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (value !== opt.value) e.target.style.background = "var(--bg)"; }}
                onMouseLeave={e => { if (value !== opt.value) e.target.style.background = "transparent"; }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── Custom Calendar Popup ────────────────────────────────────── */

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function CalendarPopup({ selectedISO, onSelect, onClose }) {
  const [viewYear, setViewYear] = useState(() => parseInt(selectedISO.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(selectedISO.slice(5, 7)) - 1);
  const ref = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  /* Build calendar grid */
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayISO = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const pad = n => String(n).padStart(2, "0");

  return (
    <div className="cal-popup" ref={ref}>
      {/* Header */}
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* Day labels */}
      <div className="cal-grid cal-day-labels">
        {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
      </div>

      {/* Day cells */}
      <div className="cal-grid cal-days">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = iso === selectedISO;
          const isToday = iso === todayISO;
          return (
            <button
              key={i}
              type="button"
              className={`cal-day ${isSelected ? "cal-day-selected" : ""} ${isToday && !isSelected ? "cal-day-today" : ""}`}
              onClick={() => { onSelect(iso); onClose(); }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="cal-footer">
        <button type="button" className="cal-footer-btn" onClick={() => { onSelect(""); onClose(); }}>Clear</button>
        <button type="button" className="cal-footer-btn cal-footer-today" onClick={() => { onSelect(todayISO); onClose(); }}>Today</button>
      </div>
    </div>
  );
}

/* ── Main Screen ──────────────────────────────────────────────── */

export function AddTransactionScreen({ session, navigate, setTransactions, addToast, onUndoTransaction }) {
  const defaultDateISO = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const [type, setType]             = useState("expense");
  const [category, setCategory]     = useState("");
  const [amount, setAmount]         = useState("");
  const [description, setDescription] = useState("");
  const [dateISO, setDateISO]       = useState(defaultDateISO);
  const [calOpen, setCalOpen]       = useState(false);
  const [status, setStatus]         = useState("idle");
  const [error, setError]           = useState("");

  const expenseCategories = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Bills & Utilities", "Education", "Others"];
  const incomeCategories  = ["Salary", "Freelance", "Investment", "Gift", "Others"];
  const currentCategories = type === "expense" ? expenseCategories : incomeCategories;

  /* Display date as YYYY/MM/DD */
  const displayDate = dateISO ? dateISO.replace(/-/g, "/") : "Select date";

  /* ── Submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!category)                                       { setError("Please select a category.");                return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError("Please enter a valid amount greater than 0."); return; }
    if (!description.trim())                             { setError("Please enter a description.");              return; }
    if (!dateISO)                                        { setError("Please select a date.");                    return; }

    setStatus("saving");
    try {
      if (!session) throw new Error("Not logged in");

      const payload = {
        raw_input:        description,
        type,
        amount:           Number(amount),
        category:         category === "Others" ? "Other" : category === "Bills & Utilities" ? "Bills" : category,
        description:      description.trim(),
        transaction_date: dateISO,
      };

      const saved = await edgeFetch("/transactions", {
        method: "POST", body: payload, token: session.access_token,
      });

      setStatus("done");
      if (setTransactions) {
        setTransactions(prev => {
          const newList = [saved, ...prev];
          return newList.sort((a, b) => {
            const td = new Date(b.transaction_date) - new Date(a.transaction_date);
            return td !== 0 ? td : new Date(b.created_at) - new Date(a.created_at);
          });
        });
      }
      
      // Show success toast with undo
      if (addToast) {
        addToast(
          `✓ ${type === "income" ? "Income" : "Expense"} of ₹${Number(amount).toFixed(2)} added`,
          "success",
          5000,
          () => onUndoTransaction?.(saved.id)
        );
      }
      
      navigate("dashboard");
    } catch (err) {
      setError("Save failed: " + err.message);
      setStatus("idle");
    }
  };

  if (!session) {
    return (
      <div className="screen" style={{ alignItems: "center", paddingTop: 40 }}>
        <p>Please log in to add transactions.</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="card">
        <p className="page-title">ADD TRANSACTION</p>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
            padding: "10px 14px", fontSize: 13, color: "#991b1b", marginBottom: 16,
          }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Transaction Type ─────────────────────── */}
          <div className="at-form-group">
            <label className="at-form-label">Transaction type</label>
            <div className="at-input-wrapper">
              <div className="at-icon-left">
                <div className={`icon-circle-bg ${type === "expense" ? "icon-expense" : "icon-income"}`}>
                  {type === "expense" ? <ArrowDownIcon /> : <ArrowUpIcon />}
                </div>
              </div>
              <CustomSelect
                value={type}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income",  label: "Income"  },
                ]}
                onChange={val => { setType(val); setCategory(""); }}
              />
              <div className="at-icon-right"><Icon name="chevron-down" size={18} /></div>
            </div>
          </div>

          {/* ── Category ─────────────────────────────── */}
          <div className="at-form-group">
            <label className="at-form-label">Category</label>
            <div className="at-input-wrapper">
              <div className="at-icon-left"><TagIcon /></div>
              <CustomSelect
                value={category}
                placeholder="Select category"
                options={currentCategories.map(c => ({ value: c, label: c }))}
                onChange={setCategory}
              />
              <div className="at-icon-right"><Icon name="chevron-down" size={18} /></div>
            </div>
          </div>

          {/* ── Amount + Date side by side ────────────── */}
          <div className="at-side-by-side">
            {/* Amount */}
            <div className="at-form-group at-half">
              <label className="at-form-label">Amount</label>
              <div className="at-input-wrapper">
                <div className="at-icon-left icon-rupee">₹</div>
                <input
                  type="number" step="0.01"
                  className="at-input has-left-icon"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Transaction Date — click to open custom calendar */}
            <div className="at-form-group at-half" style={{ position: "relative" }}>
              <label className="at-form-label">Transaction date</label>
              <div className="at-input-wrapper at-date-field" onClick={() => setCalOpen(!calOpen)}>
                <span className="at-date-display">{displayDate}</span>
                <button
                  type="button"
                  className="at-date-cal-btn"
                  onClick={e => { e.stopPropagation(); setCalOpen(!calOpen); }}
                  aria-label="Open calendar"
                >
                  <Icon name="calendar" size={20} />
                </button>
              </div>

              {/* Custom calendar popup — renders INSIDE the app */}
              {calOpen && (
                <CalendarPopup
                  selectedISO={dateISO}
                  onSelect={setDateISO}
                  onClose={() => setCalOpen(false)}
                />
              )}
            </div>
          </div>

          {/* ── Description ──────────────────────────── */}
          <div className="at-form-group">
            <label className="at-form-label">Description</label>
            <textarea
              className="at-textarea"
              placeholder="Enter description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* ── Submit ────────────────────────────────── */}
          <button type="submit" className="at-submit-btn" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
