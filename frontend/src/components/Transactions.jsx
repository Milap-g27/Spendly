import { useMemo, useState, useEffect, useRef } from "react";
import { formatCurrency, formatShortDate, getCategoryMeta } from "../lib/utils";
import { filterTabs } from "../lib/constants";
import { Icon } from "./Icons";
import { SettlePanel } from "./SettlePanel";
import { supabase } from "../lib/supabaseClient";

function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <button 
        className="custom-dropdown-trigger" 
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{value}</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt} 
              className={`custom-dropdown-item ${opt === value ? "selected" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Date formatting utilities ──────────────────────────────── */
const getISTDate = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

const TODAY_IST = getISTDate(0);
const YESTERDAY_IST = getISTDate(-1);

function getRelativeLabel(dateValue) {
  if (dateValue === TODAY_IST) return "Today";
  if (dateValue === YESTERDAY_IST) return "Yesterday";
  return formatShortDate(dateValue);
}

/* ── SwipeableRow ─────────────────────────────────────────────── */
function SwipeableRow({ children, onDelete, disableSwipe }) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = -60;

  const isInteractiveElement = (target) => {
    // Don't swipe if clicking on buttons, links, or inputs
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
      setOffset(-80); // Snap open
    } else {
      setOffset(0); // Snap close
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

/* ── TransactionRow Extract ─────────────────────────────────────── */
function TransactionRow({ item, selectMode, isSelected, onToggleSelect, onLongPress, onDeleteSingle, onSettle }) {
  const meta = getCategoryMeta(item.category);
  const timerRef = useRef(null);
  const isLendOrBorrow = item.category === "Lend" || item.category === "Borrow";
  const outstanding = item.outstanding || 0;
  const isFullySettled = outstanding === 0 && item.totalSettled > 0;
  
  const startLongPress = () => {
    if (selectMode) return;
    timerRef.current = setTimeout(() => {
      onLongPress(item.id);
    }, 200);
  };
  const cancelLongPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseDown = (e) => {
    // Don't trigger long press if clicking buttons or interactive elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      cancelLongPress();
      return;
    }
    startLongPress();
  };

  const handleClick = (e) => {
    if (selectMode) {
      e.preventDefault();
      onToggleSelect(item.id);
    }
  };

  return (
    <SwipeableRow onDelete={() => onDeleteSingle(item)} disableSwipe={selectMode}>
      <div 
        className={`transaction-row compact ${isSelected ? 'selected' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={handleMouseDown}
        onTouchEnd={cancelLongPress}
        onClick={handleClick}
        style={{ paddingLeft: selectMode ? 44 : undefined, transition: "padding 0.2s" }}
      >
        {selectMode && (
          <div className="tx-checkbox-container">
            <div className={`tx-checkbox ${isSelected ? "checked" : ""}`}>
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
        )}

        <div className="icon-circle" style={{ backgroundColor: meta.icon }}>
          <span style={{ color: meta.color }}>
            <Icon name={item.icon} size={20}/>
          </span>
        </div>
        <div className="transaction-info">
          <p className="transaction-title">{item.description}</p>
          <div className="category-bar-wrap" style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              className="category-bar"
              style={{ backgroundColor: meta.chip, width: "100%" }}
            />
            <span className="category-pill">{item.category}</span>
            {isLendOrBorrow && (
              <>
                {isFullySettled && <span className="tx-settled-badge">✓ Settled</span>}
                {outstanding > 0 && (
                  <span className="tx-outstanding-badge">
                    {formatCurrency(outstanding)} outstanding
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="transaction-amount-wrapper">
          {isLendOrBorrow && !selectMode && (
            <button 
              className="tx-settle-btn" 
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                onSettle(item); 
              }}
              title="Settle transaction"
            >
              Settle
            </button>
          )}
          <div className={`transaction-amount ${item.type === 'income' ? 'income' : 'expense'}`}>
            <span className="sign">{item.type === 'income' ? '+' : '–'}</span>
            <span>{isLendOrBorrow ? formatCurrency(outstanding) : formatCurrency(item.amount)}</span>
          </div>
        </div>
      </div>
    </SwipeableRow>
  );
}

/* ── Main Transactions Screen ─────────────────────────────────── */
export function TransactionsScreen({ transactions, search, setSearch, activeFilter, setActiveFilter, customRange, setCustomRange, onApplyCustom, setTransactions, settleTransaction }) {
  const [typeFilter, setTypeFilter] = useState("All");

  /* Multiselect / Delete State */
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState([]); 
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const undoTimerRef = useRef(null);
  const snackbarExitTimerRef = useRef(null);

  /* Settle Panel State */
  const [selectedTransactionForSettle, setSelectedTransactionForSettle] = useState(null);
  const [settleLoading, setSettleLoading] = useState(false);

  const clearSnackbarExitTimer = () => {
    if (snackbarExitTimerRef.current) {
      clearTimeout(snackbarExitTimerRef.current);
      snackbarExitTimerRef.current = null;
    }
  };

  const hideUndoSnackbar = () => {
    clearSnackbarExitTimer();
    setSnackbarVisible(false);
    snackbarExitTimerRef.current = setTimeout(() => {
      setPendingDelete([]);
      snackbarExitTimerRef.current = null;
    }, 220);
  };

  /* Helper to physically delete from Supabase and remove from main state */
  const commitPendingDeletes = async (itemsToCommit) => {
    if (!itemsToCommit || itemsToCommit.length === 0) return;
    const ids = itemsToCommit.map(i => i.id);
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
    // Real DB delete
    await supabase.from('transactions').delete().in('id', ids);
  };

  /* Helper to queue soft deletes */
  const executeSoftDelete = (itemsToDelete) => {
    // If a deletion is already pending and user deletes again, commit the old one immediately
    if (pendingDelete.length > 0) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      commitPendingDeletes(pendingDelete);
    }

    clearSnackbarExitTimer();
    
    setPendingDelete(itemsToDelete);
    setSnackbarVisible(true);
    setSelectMode(false);
    setSelectedIds(new Set());
    
    // Start 5s countdown
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      commitPendingDeletes(itemsToDelete);
      hideUndoSnackbar();
    }, 5000);
  };

  /* Actions */
  const handleLongPress = (id) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const items = transactions.filter(t => selectedIds.has(t.id));
    executeSoftDelete(items);
  };

  const handleDeleteSingle = (item) => {
    executeSoftDelete([item]);
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    hideUndoSnackbar();
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleSettleTransaction = async (transactionId, settleAmount, note) => {
    setSettleLoading(true);
    const result = await settleTransaction(transactionId, settleAmount, note);
    setSettleLoading(false);
    return result;
  };

  const handleSettleOpen = (transaction) => {
    setSelectedTransactionForSettle(transaction);
  };

  const handleSettleClose = () => {
    setSelectedTransactionForSettle(null);
  };

  // Listen back button to prevent default and cancel select mode
  useEffect(() => {
    const onPopState = (e) => {
      if (selectMode) {
        // We aren't doing deep router integration, but loosely handling back
        cancelSelectMode();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [selectMode]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      clearSnackbarExitTimer();
    };
  }, []);

  /* Filtering */
  const sorted = useMemo(() =>
    [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)),
    [transactions]
  );

  const filtered = useMemo(() => {
    // Exclude pending deletes from showing
    const pendingIds = new Set(pendingDelete.map(p => p.id));
    let result = sorted.filter(t => !pendingIds.has(t.id));

    if (typeFilter !== "All") {
      result = result.filter(item => item.type === typeFilter.toLowerCase());
    }
    if (search.trim()) {
      const value = search.trim().toLowerCase();
      result = result.filter((item) =>
        `${item.description || ""} ${item.raw_input || ""}`.toLowerCase().includes(value)
      );
    }
    return result;
  }, [search, sorted, typeFilter, pendingDelete]);

  const groups = filtered.reduce((acc, item) => {
    const label = getRelativeLabel(item.transaction_date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div className="screen" style={{ paddingBottom: selectMode ? "100px" : "" }}>
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
          disabled={selectMode}
        />
      </div>

      <div className="filter-bar-ref" style={{ opacity: selectMode ? 0.5 : 1, pointerEvents: selectMode ? 'none' : 'auto' }}>
        <div className="filter-presets-desktop hide-on-mobile" style={{ display: 'flex', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-presets-ref">
            {filterTabs.filter(t => t !== "Custom").map((tab) => (
              <button
                key={tab}
                className={`filter-preset-btn-ref ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
            <button
              className={`filter-preset-btn-ref ${activeFilter === "Custom" ? "active" : ""}`}
              onClick={() => setActiveFilter("Custom")}
            >
              Custom
            </button>
          </div>

          <div className="filter-presets-ref" style={{ marginLeft: "auto" }}>
            {["All", "Income", "Expense"].map(type => (
              <button
                key={type}
                className={`filter-preset-btn-ref ${typeFilter === type ? "active" : ""}`}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-dropdowns-mobile hide-on-desktop">
          <CustomDropdown
            value={activeFilter}
            options={filterTabs}
            onChange={setActiveFilter}
          />

          <CustomDropdown
            value={typeFilter}
            options={["All", "Income", "Expense"]}
            onChange={setTypeFilter}
          />
        </div>
        
        {activeFilter === "Custom" && (
          <div className="filter-custom-row">
            <input
              type="date"
              className="filter-date-input-ref"
              value={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
            />
            <span className="filter-separator">to</span>
            <input
              type="date"
              className="filter-date-input-ref"
              value={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
            />
            <button className="filter-apply-btn-ref" onClick={onApplyCustom}>Apply</button>
          </div>
        )}
      </div>

      {/* Selection Top Bar */}
      {selectMode && (
        <div className="selection-topbar" style={{ marginBottom: "20px", borderRadius: "12px" }}>
          <div className="selection-topbar-inner">
            <span className="selection-count">{selectedIds.size} selected</span>
            <button className="selection-cancel-btn" onClick={cancelSelectMode}>Cancel</button>
          </div>
        </div>
      )}

      <div className="transaction-groups">
        {Object.entries(groups).map(([label, items]) => (
          <section key={label} className="transaction-group">
            <div className="group-header">
              <p className="group-title">{label}</p>
              {(label === "Today" || label === "Yesterday") && (
                <p className="group-date">{formatShortDate(items[0].transaction_date)}</p>
              )}
            </div>
            {items.map((item) => (
              <TransactionRow 
                key={item.id} 
                item={item} 
                selectMode={selectMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
                onLongPress={handleLongPress}
                onDeleteSingle={handleDeleteSingle}
                onSettle={handleSettleOpen}
              />
            ))}
          </section>
        ))}
      </div>

      {/* Floating Delete Selected Button */}
      {selectMode && (
        <div className="floating-delete-container">
          <button 
            className="floating-delete-btn"
            disabled={selectedIds.size === 0}
            onClick={handleDeleteSelected}
          >
            <Icon name="trash" size={20} color="#fff" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Undo Snackbar */}
      {pendingDelete.length > 0 && (
        <div className={`undo-snackbar ${snackbarVisible ? "is-visible" : ""}`}>
          <div className="undo-snackbar-content">
            <span>{pendingDelete.length} transaction{pendingDelete.length > 1 ? 's' : ''} deleted</span>
            <button className="undo-btn" onClick={handleUndo}>UNDO</button>
          </div>
          <div className="undo-progress-bar">
            {/* The timer progress animates using CSS */}
            <div className="undo-progress-fill" key={pendingDelete.length} />
          </div>
        </div>
      )}

      {/* Settle Panel */}
      {selectedTransactionForSettle && (
        <SettlePanel
          transaction={selectedTransactionForSettle}
          onClose={handleSettleClose}
          onSettle={handleSettleTransaction}
          isLoading={settleLoading}
        />
      )}
    </div>
  );
}
