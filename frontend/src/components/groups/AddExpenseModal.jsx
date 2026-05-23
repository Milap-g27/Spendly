import React, { useState, useEffect } from "react";
import { Icon } from "../Icons";

export function AddExpenseModal({ isOpen, onClose, onAdd, members = [], currentUserId, prefillAmount, prefillDescription, prefillDate }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const [paidBy, setPaidBy] = useState(currentUserId || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [splitMode, setSplitMode] = useState("equal"); // "equal" | "custom"
  const [selectedSplitMembers, setSelectedSplitMembers] = useState(
    members.map(m => m.user_id)
  );
  const [customAmounts, setCustomAmounts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaidBy(currentUserId || "");
      setAmount(prefillAmount != null ? String(prefillAmount) : "");
      setDescription(prefillDescription || "");
      setDate(prefillDate || today);
      setSplitMode("equal");
      setSelectedSplitMembers(members.map(m => m.user_id));
      setCustomAmounts({});
      setError("");
    }
  }, [isOpen, currentUserId, members]);

  // Sync selected members when members list changes
  useEffect(() => {
    setSelectedSplitMembers(members.map(m => m.user_id));
  }, [members]);

  if (!isOpen) return null;

  const totalAmt = parseFloat(amount) || 0;
  const splitCount = selectedSplitMembers.length;
  const equalShare = splitCount > 0 ? Math.round((totalAmt / splitCount) * 100) / 100 : 0;

  const toggleMember = (userId) => {
    setSelectedSplitMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const customTotal = Object.values(customAmounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0), 0
  );
  const remaining = Math.round((totalAmt - customTotal) * 100) / 100;

  const getShares = () => {
    if (splitMode === "equal") {
      // For equal split with rounding, the last person gets the remainder
      const base = Math.floor((totalAmt / splitCount) * 100) / 100;
      const lastExtra = Math.round((totalAmt - base * splitCount) * 100) / 100;
      return selectedSplitMembers.map((uid, idx) => ({
        user_id: uid,
        share_amount: idx === splitCount - 1 ? base + lastExtra : base
      }));
    } else {
      return selectedSplitMembers.map(uid => ({
        user_id: uid,
        share_amount: parseFloat(customAmounts[uid] || 0)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) return setError("Description is required");
    if (!totalAmt || totalAmt <= 0) return setError("Please enter a valid amount");
    if (selectedSplitMembers.length === 0) return setError("Select at least one person to split with");
    if (!paidBy) return setError("Please select who paid");

    if (splitMode === "custom") {
      if (Math.abs(remaining) > 0.01) {
        return setError(`Custom amounts don't add up. Remaining: ₹${remaining.toFixed(2)}`);
      }
    }

    const shares = getShares();
    setSubmitting(true);
    try {
      const res = await onAdd(paidBy, totalAmt, description.trim(), date, shares);
      if (!res.success) {
        setError(res.error || "Failed to add expense");
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberName = (uid) => {
    const m = members.find(m => m.user_id === uid);
    return m?.display_name || "Unknown";
  };

  return (
    <div className="expense-modal-overlay show" onClick={onClose}>
      <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
        <div className="expense-modal-header">
          <h3 className="expense-modal-title">Add Expense</h3>
          <button className="expense-modal-close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="expense-modal-form">
          {error && <p className="expense-error">{error}</p>}

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="exp-desc">Description</label>
            <input
              id="exp-desc"
              type="text"
              className="form-input"
              placeholder="e.g. Dinner at Taj, Electricity bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="exp-amount">Amount (₹)</label>
            <input
              id="exp-amount"
              type="number"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              disabled={submitting}
            />
          </div>

          {/* Row: Paid By + Date */}
          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label" htmlFor="exp-paid-by">Paid by</label>
              <select
                id="exp-paid-by"
                className="form-input form-select"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                disabled={submitting}
              >
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}{m.user_id === currentUserId ? " (You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="exp-date">Date</label>
              <input
                id="exp-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Split Mode Toggle */}
          <div className="form-group">
            <label className="form-label">Split type</label>
            <div className="split-mode-toggle">
              <button
                type="button"
                className={`split-mode-btn ${splitMode === "equal" ? "active" : ""}`}
                onClick={() => setSplitMode("equal")}
              >
                Equal Split
              </button>
              <button
                type="button"
                className={`split-mode-btn ${splitMode === "custom" ? "active" : ""}`}
                onClick={() => setSplitMode("custom")}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Split Among */}
          <div className="form-group">
            <label className="form-label">Split among</label>
            <div className="split-members-grid">
              {members.map((m) => {
                const isSelected = selectedSplitMembers.includes(m.user_id);
                return (
                  <div
                    key={m.user_id}
                    className={`split-member-row ${isSelected ? "selected" : ""}`}
                  >
                    <label className="split-member-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(m.user_id)}
                        disabled={submitting}
                        className="split-member-checkbox"
                      />
                      <div className="split-member-avatar-sm">
                        {m.display_name[0]?.toUpperCase()}
                      </div>
                      <span className="split-member-name">
                        {m.display_name}{m.user_id === currentUserId ? " (You)" : ""}
                      </span>
                    </label>

                    {splitMode === "equal" ? (
                      <span className="split-amount-preview">
                        {isSelected && totalAmt > 0 ? `₹${equalShare.toFixed(2)}` : "—"}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="split-custom-input"
                        placeholder="0.00"
                        value={isSelected ? (customAmounts[m.user_id] || "") : ""}
                        disabled={!isSelected || submitting}
                        min="0"
                        step="0.01"
                        onChange={(e) => setCustomAmounts(prev => ({
                          ...prev,
                          [m.user_id]: e.target.value
                        }))}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {splitMode === "custom" && totalAmt > 0 && (
              <div className={`custom-remaining ${Math.abs(remaining) <= 0.01 ? "ok" : "error"}`}>
                {Math.abs(remaining) <= 0.01
                  ? "✓ Amounts add up correctly"
                  : `Remaining: ₹${remaining.toFixed(2)}`}
              </div>
            )}
          </div>

          <div className="expense-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
