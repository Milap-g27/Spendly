import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatShortDate, getCategoryMeta } from "../lib/utils";
import { Icon } from "./Icons";
import { supabase } from "../lib/supabaseClient";

/* ── SwipeableRow for Dashboard ─────────────────────────────── */
function SwipeableRow({ children, onDelete, disableSwipe }) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = -60;

  const isInteractiveElement = (target) => {
    return (
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.closest('button') ||
      target.closest('a')
    );
  };

  const onTouchStart = (e) => {
    if (disableSwipe || isInteractiveElement(e.target)) return;
    setIsSwiping(true);
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const onTouchMove = (e) => {
    if (!isSwiping || disableSwipe) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startX.current;
    if (diff < 0) {
      currentX.current = Math.max(diff, -100);
      setOffset(currentX.current);
    } else {
      currentX.current = 0;
      setOffset(0);
    }
  };

  const onTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (currentX.current < SWIPE_THRESHOLD) {
      setOffset(-80);
    } else {
      setOffset(0);
      currentX.current = 0;
    }
  };

  useEffect(() => {
    if (disableSwipe && offset !== 0) {
      setOffset(0);
      currentX.current = 0;
    }
  }, [disableSwipe, offset]);

  return (
    <div className="swipeable-container" onMouseLeave={onTouchEnd}>
      <div 
        className="swipeable-actions" 
        style={{ opacity: offset < 0 ? 1 : 0 }}
      >
        <button 
          className="swipeable-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(); setOffset(0); }}
        >
          <Icon name="trash" size={24} color="#fff" />
        </button>
      </div>
      <div 
        className="swipeable-content"
        style={{ transform: `translateX(${offset}px)` }}
        onMouseDown={onTouchStart}
        onMouseMove={onTouchMove}
        onMouseUp={onTouchEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export function DashboardScreen({ displayName, transactions, totalSpent, transactionCount, topCategory, onSeeAll, onInsights, addToast, monthlyBudget = 0 }) {
  const recent = transactions.slice(0, 4);
  const [transactionList, setTransactionList] = useState(transactions);
  const warningShownRef = useRef(false);

  // Check budget warning on mount (only once)
  useEffect(() => {
    if (warningShownRef.current) return;
    
    const budgetValue = Number(monthlyBudget) || 0;

    if (budgetValue > 0) {
      const usage = (totalSpent / budgetValue) * 100;
      
      if (usage >= 80) {
        warningShownRef.current = true;
        addToast(`⚠ Your monthly budget is ${Math.round(usage)}% spent`, "warning", 5000);
      }
    }
  }, [totalSpent, addToast, monthlyBudget]);

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
            <SwipeableRow 
              key={item.id}
              onDelete={async () => {
                setTransactionList(prev => prev.filter(t => t.id !== item.id));
                await supabase.from('transactions').delete().eq('id', item.id);
              }}
            >
              <div className="transaction-row">
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
            </SwipeableRow>
          ))}
        </div>
      </section>
    </div>
  );
}
