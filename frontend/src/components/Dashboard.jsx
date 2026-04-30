import { useEffect, useRef } from "react";
import { formatCurrency, formatShortDate, getCategoryMeta } from "../lib/utils";
import { Icon } from "./Icons";

export function DashboardScreen({ displayName, transactions, totalSpent, transactionCount, topCategory, onSeeAll, onInsights, addToast }) {
  const recent = transactions.slice(0, 4);
  const warningShownRef = useRef(false);

  // Check budget warning on mount (only once)
  useEffect(() => {
    if (warningShownRef.current) return;
    
    const monthlyBudget = parseFloat(window.localStorage.getItem("spendly.profile.monthlyBudget")) || 0;
    
    if (monthlyBudget > 0) {
      const usage = (totalSpent / monthlyBudget) * 100;
      
      if (usage >= 80) {
        warningShownRef.current = true;
        addToast(`⚠ Your monthly budget is ${Math.round(usage)}% spent`, "warning", 0); // 0 = no auto-dismiss
      }
    }
  }, []);

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
              <div className={`transaction-amount ${item.type === 'income' ? 'income' : 'expense'}`}>
                <span className="sign">{item.type === 'income' ? '+' : '–'}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
