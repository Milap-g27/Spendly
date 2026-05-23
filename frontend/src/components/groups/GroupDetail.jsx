import React, { useState, useEffect } from "react";
import { AddExpenseModal } from "./AddExpenseModal";
import { SettleUpModal } from "./SettleUpModal";
import { Icon } from "../Icons";
import { formatCurrency, formatShortDate } from "../../lib/utils";

const TABS = ["Balances", "Expenses", "Settle Up"];

export function GroupDetail({ groupId, session, navigate, useGroupsHook, expensePrefill, onExpensePrefillConsumed }) {
  const {
    selectedGroup,
    balances,
    settlements,
    loading,
    error,
    loadGroupDetail,
    addExpense,
    deleteExpense,
    recordSettlement,
  } = useGroupsHook;

  const [activeTab, setActiveTab] = useState("Balances");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (groupId) {
      loadGroupDetail(groupId);
    }
  }, [groupId]);

  // Auto-open expense modal when FAB sends prefill data
  useEffect(() => {
    if (expensePrefill && selectedGroup) {
      setExpenseModalOpen(true);
    }
  }, [expensePrefill, selectedGroup]);

  if (loading && !selectedGroup) {
    return (
      <div className="screen group-detail-screen">
        <div className="group-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="screen group-detail-screen">
        <div className="card">
          <p style={{ color: "var(--muted)" }}>Group not found.</p>
          <button className="btn btn-outline" onClick={() => navigate("groups")}>
            ← Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const handleAddExpense = async (paidBy, amount, description, date, shares) => {
    return await addExpense(selectedGroup.id, paidBy, amount, description, date, shares);
  };

  const handleSettle = async (fromUserId, toUserId, amount, note) => {
    return await recordSettlement(selectedGroup.id, fromUserId, toUserId, amount, note);
  };

  const handleOpenSettle = (settlement) => {
    setSelectedSettlement(settlement);
    setSettleModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense? This cannot be undone.")) return;
    await deleteExpense(selectedGroup.id, expenseId);
  };

  const balanceList = Object.values(balances);

  const getMemberName = (uid) => {
    const m = selectedGroup.members.find(m => m.user_id === uid);
    return m?.display_name || "Unknown";
  };

  return (
    <div className="screen group-detail-screen">
      {/* Back button + header */}
      <div className="group-detail-topbar">
        <button className="back-btn" onClick={() => navigate("groups")}>
          <Icon name="chevron-right" size={20} style={{ transform: "rotate(180deg)" }} />
          <span>Groups</span>
        </button>
      </div>

      <div className="group-detail-hero card">
        <div className="group-detail-hero-inner">
          <div className="group-icon-circle">
            <Icon name="split" size={28} />
          </div>
          <div>
            <h2 className="group-detail-name">{selectedGroup.name}</h2>
            {selectedGroup.description && (
              <p className="group-detail-desc">{selectedGroup.description}</p>
            )}
            <p className="group-detail-meta">
              {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? "s" : ""}
              {" · "}
              {selectedGroup.expenses.length} expense{selectedGroup.expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Member avatars */}
        <div className="group-detail-members">
          {selectedGroup.members.map(m => (
            <div key={m.user_id} className="group-detail-member-avatar" title={m.display_name}>
              {m.display_name[0]?.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="groups-error-bar">⚠ {error}</p>}

      {/* Tabs */}
      <div className="group-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`group-tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Balances Tab ── */}
      {activeTab === "Balances" && (
        <div className="tab-content">
          {balanceList.length === 0 ? (
            <div className="card tab-empty">
              <p>No balances yet. Add an expense to get started.</p>
            </div>
          ) : (
            <div className="balances-list">
              {balanceList.map(b => {
                const net = b.net;
                const isYou = b.userId === currentUserId;
                return (
                  <div key={b.userId} className={`balance-card card ${net > 0.01 ? "net-positive" : net < -0.01 ? "net-negative" : "net-zero"}`}>
                    <div className="balance-card-left">
                      <div className="balance-avatar">{b.displayName[0]?.toUpperCase()}</div>
                      <div>
                        <p className="balance-name">
                          {isYou ? "You" : b.displayName}
                        </p>
                        <p className="balance-sub">
                          Paid {formatCurrency(b.paid)} · Owed {formatCurrency(b.owed)}
                        </p>
                      </div>
                    </div>
                    <div className="balance-card-right">
                      {net > 0.01 ? (
                        <span className="balance-net positive">+{formatCurrency(net)}</span>
                      ) : net < -0.01 ? (
                        <span className="balance-net negative">{formatCurrency(net)}</span>
                      ) : (
                        <span className="balance-net zero">Settled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Expenses Tab ── */}
      {activeTab === "Expenses" && (
        <div className="tab-content">
          <div className="expenses-list-header">
            <p className="expenses-count">{selectedGroup.expenses.length} expense{selectedGroup.expenses.length !== 1 ? "s" : ""}</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setExpenseModalOpen(true)}
            >
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
          {selectedGroup.expenses.length === 0 ? (
            <div className="card tab-empty">
              <p>No expenses yet.</p>
              <button className="btn btn-primary" onClick={() => setExpenseModalOpen(true)}>
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="expense-rows">
              {selectedGroup.expenses.map(exp => {
                const paidByName = getMemberName(exp.paid_by);
                const isYouPaid = exp.paid_by === currentUserId;
                return (
                  <div key={exp.id} className="expense-row card" onClick={() => setSelectedExpense(exp)} style={{ cursor: "pointer" }}>
                    <div className="expense-row-left">
                      <div className="expense-icon-wrap">
                        <Icon name="receipt" size={18} />
                      </div>
                      <div>
                        <p className="expense-description">{exp.description}</p>
                        <p className="expense-meta">
                          {isYouPaid ? "You paid" : `${paidByName} paid`}
                          {" · "}{formatShortDate(exp.expense_date)}
                        </p>
                        {exp.shares && exp.shares.length > 0 && (
                          <p className="expense-share-hint">
                            Split {exp.shares.length} way{exp.shares.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="expense-row-right">
                      <span className="expense-amount">{formatCurrency(exp.amount)}</span>
                      {isYouPaid && (
                        <button
                          className="expense-delete-btn"
                          onClick={(e) => { e.stopPropagation(); handleDeleteExpense(exp.id); }}
                          title="Delete expense"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Settle Up Tab ── */}
      {activeTab === "Settle Up" && (
        <div className="tab-content">
          {settlements.length === 0 ? (
            <div className="card tab-empty">
              <Icon name="split" size={36} style={{ color: "var(--muted)", marginBottom: 8 }} />
              <p>
                {balanceList.every(b => Math.abs(b.net) <= 0.01)
                  ? "Everyone is settled up! 🎉"
                  : "All settled! No pending transactions needed."}
              </p>
            </div>
          ) : (
            <div className="settle-cards">
              <p className="settle-cards-title">Minimum transactions to clear all debts:</p>
              {settlements.map((s, idx) => {
                const isYouOwe = s.fromUserId === currentUserId;
                const isOwedToYou = s.toUserId === currentUserId;
                return (
                  <div key={idx} className={`settle-card card ${isYouOwe ? "you-owe" : isOwedToYou ? "you-get" : ""}`}>
                    <div className="settle-card-left">
                      <div className={`settle-card-avatar ${isYouOwe ? "debtor" : ""}`}>
                        {s.fromName[0]?.toUpperCase()}
                      </div>
                      <div className="settle-card-info">
                        <p className="settle-card-from">
                          {isYouOwe ? "You" : s.fromName}
                        </p>
                        <p className="settle-card-label">owes</p>
                        <p className="settle-card-to">
                          {isOwedToYou ? "You" : s.toName}
                        </p>
                      </div>
                    </div>
                    <div className="settle-card-right">
                      <span className="settle-card-amount">{formatCurrency(s.amount)}</span>
                      <button
                        className="btn btn-success btn-sm settle-card-btn"
                        onClick={() => handleOpenSettle(s)}
                      >
                        {isYouOwe ? "Pay" : "Mark Paid"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past Settlements */}
          {selectedGroup.settlements && selectedGroup.settlements.length > 0 && (
            <div className="past-settlements">
              <p className="past-settlements-title">Payment History</p>
              {selectedGroup.settlements.map(s => (
                <div key={s.id} className="past-settlement-row">
                  <div>
                    <p className="past-settlement-text">
                      <strong>{getMemberName(s.paid_by)}</strong>
                      {" → "}
                      <strong>{getMemberName(s.paid_to)}</strong>
                    </p>
                    {s.note && <p className="past-settlement-note">{s.note}</p>}
                  </div>
                  <div className="past-settlement-right">
                    <span className="past-settlement-amount">{formatCurrency(s.amount)}</span>
                    <span className="past-settlement-date">
                      {new Date(s.settled_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short"
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          onExpensePrefillConsumed?.();
        }}
        onAdd={handleAddExpense}
        members={selectedGroup.members}
        currentUserId={currentUserId}
        prefillAmount={expensePrefill?.amount}
        prefillDescription={expensePrefill?.description}
        prefillDate={expensePrefill?.date}
      />

      <SettleUpModal
        isOpen={settleModalOpen}
        onClose={() => { setSettleModalOpen(false); setSelectedSettlement(null); }}
        onSettle={handleSettle}
        settlement={selectedSettlement}
      />

      {/* ── Expense Detail Modal ── */}
      {selectedExpense && (
        <div className="expense-modal-overlay show" onClick={() => setSelectedExpense(null)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="expense-modal-header">
              <h3 className="expense-modal-title">Expense Details</h3>
              <button className="expense-modal-close" onClick={() => setSelectedExpense(null)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="expense-detail-body">
              {/* Amount */}
              <div className="expense-detail-amount-row">
                <span className="expense-detail-amount">{formatCurrency(selectedExpense.amount)}</span>
              </div>

              {/* Info rows */}
              <div className="expense-detail-fields">
                <div className="expense-detail-field">
                  <span className="expense-detail-label">Description</span>
                  <span className="expense-detail-value">{selectedExpense.description}</span>
                </div>
                <div className="expense-detail-field">
                  <span className="expense-detail-label">Date</span>
                  <span className="expense-detail-value">
                    {new Date(selectedExpense.expense_date + "T00:00:00").toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                </div>
                <div className="expense-detail-field">
                  <span className="expense-detail-label">Paid by</span>
                  <span className="expense-detail-value">
                    <span className="expense-detail-avatar">
                      {getMemberName(selectedExpense.paid_by)[0]?.toUpperCase()}
                    </span>
                    {selectedExpense.paid_by === currentUserId ? "You" : getMemberName(selectedExpense.paid_by)}
                  </span>
                </div>
              </div>

              {/* Split breakdown */}
              {selectedExpense.shares && selectedExpense.shares.length > 0 && (
                <div className="expense-detail-splits">
                  <p className="expense-detail-splits-title">Split breakdown</p>
                  {selectedExpense.shares.map((s) => (
                    <div key={s.user_id} className="expense-detail-split-row">
                      <div className="expense-detail-split-left">
                        <span className="expense-detail-avatar-sm">
                          {getMemberName(s.user_id)[0]?.toUpperCase()}
                        </span>
                        <span>{s.user_id === currentUserId ? "You" : getMemberName(s.user_id)}</span>
                      </div>
                      <span className="expense-detail-split-amount">{formatCurrency(s.share_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
