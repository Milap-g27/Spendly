import { useMemo } from "react";
import { formatCurrency, formatShortDate, getCategoryMeta } from "../lib/utils";
import { filterTabs } from "../lib/constants";
import { Icon } from "./Icons";

function getRelativeLabel(dateValue, referenceDate) {
  const date = new Date(`${dateValue}T00:00:00`);
  const diff = (referenceDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatShortDate(dateValue);
}

export function TransactionsScreen({ transactions, search, setSearch, activeFilter, setActiveFilter, customRange, setCustomRange, onApplyCustom }) {
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

      <div className="filter-bar-ref">
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
                  <div className={`transaction-amount ${item.type === 'income' ? 'income' : 'expense'}`}>
                    <span className="sign">{item.type === 'income' ? '+' : '–'}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
