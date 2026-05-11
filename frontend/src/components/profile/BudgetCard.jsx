import { useEffect, useMemo, useState } from "react";
import { Icon } from "../Icons";
import { formatCurrency } from "../../lib/utils";

function BudgetStatRow({ icon, label, sublabel, value, tone }) {
  return (
    <div className="profile-list-item">
      <div className="profile-list-item-main">
        <span className="profile-list-item-icon"><Icon name={icon} size={18} /></span>
        <div>
          <p className="profile-list-item-title">{label}</p>
          <p className="profile-list-item-subtitle">{sublabel}</p>
        </div>
      </div>
      <p className={`profile-list-item-value ${tone || ""}`}>{value}</p>
    </div>
  );
}

export function BudgetCard({ totalSpent = 0, budget = 0, onSaveBudget }) {
  const [savedBudget, setSavedBudget] = useState(Number(budget) || 0);
  const [draftBudget, setDraftBudget] = useState("");

  useEffect(() => {
    const nextBudget = Number(budget) || 0;
    setSavedBudget(nextBudget);
    setDraftBudget(nextBudget > 0 ? String(nextBudget) : "");
  }, [budget]);

  const remaining = Math.max(savedBudget - totalSpent, 0);
  const usage = savedBudget > 0 ? Math.min((totalSpent / savedBudget) * 100, 100) : 0;
  const normalizedDraft = draftBudget.trim() === "" ? 0 : Number(draftBudget);
  const canSave = Number.isFinite(normalizedDraft) && normalizedDraft !== savedBudget;

  const handleSave = () => {
    const nextBudget = Math.max(0, Number(draftBudget) || 0);
    onSaveBudget?.(nextBudget);
    setSavedBudget(nextBudget);
    setDraftBudget(nextBudget > 0 ? String(nextBudget) : "");
  };

  const handleCancel = () => {
    setDraftBudget(savedBudget > 0 ? String(savedBudget) : "");
  };

  return (
    <div className="profile-section-card">
      <div className="profile-budget-input-row">
        <div className="profile-list-item-main budget-heading-row">
          <span className="profile-list-item-icon"><Icon name="calendar" size={18} /></span>
          <div>
            <p className="profile-list-item-title">Monthly budget</p>
            <p className="profile-list-item-subtitle">Set your spending limit</p>
          </div>
        </div>
        <div className="budget-input-shell">
          <span className="budget-input-currency">₹</span>
          <input
            className="budget-input"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0"
            value={draftBudget}
            onChange={(event) => setDraftBudget(event.target.value)}
          />
          <button type="button" className="budget-save-btn" disabled={!canSave} onClick={handleSave}>
            Save
          </button>
        </div>
        <div className="budget-edit-hint">
          <button type="button" className="budget-cancel-btn" onClick={handleCancel} disabled={!canSave}>
            Cancel
          </button>
        </div>
      </div>

      <div className="budget-progress-wrap">
        <div className="budget-progress-bar">
          <div className="budget-progress-fill" style={{ width: `${usage}%` }} />
        </div>
        <p className="budget-note">
          {savedBudget > 0 ? `${Math.round(usage)}% of your monthly budget is used` : "Set a budget to see how much room is left this month."}
        </p>
      </div>

      <div className="profile-divider" />
      <BudgetStatRow icon="bolt" label="Spent" sublabel="This month" value={formatCurrency(totalSpent)} tone="expense" />
      <div className="profile-divider" />
      <BudgetStatRow icon="home" label="Remaining" sublabel="This month" value={formatCurrency(remaining)} tone="income" />
    </div>
  );
}
