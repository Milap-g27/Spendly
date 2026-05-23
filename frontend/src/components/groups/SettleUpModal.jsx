import React, { useState } from "react";
import { Icon } from "../Icons";
import { formatCurrency } from "../../lib/utils";

export function SettleUpModal({ isOpen, onClose, onSettle, settlement }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !settlement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await onSettle(
        settlement.fromUserId,
        settlement.toUserId,
        settlement.amount,
        note.trim()
      );
      if (!res.success) {
        setError(res.error || "Failed to record settlement");
      } else {
        setNote("");
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to record settlement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="settle-modal-overlay show" onClick={onClose}>
      <div className="settle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settle-modal-header">
          <h3 className="settle-modal-title">Settle Up</h3>
          <button className="settle-modal-close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settle-modal-form">
          {error && <p className="settle-error">{error}</p>}

          {/* Settlement summary */}
          <div className="settle-summary-card">
            <div className="settle-summary-row">
              <div className="settle-person">
                <div className="settle-person-avatar debtor">
                  {settlement.fromName[0]?.toUpperCase()}
                </div>
                <span className="settle-person-name">{settlement.fromName}</span>
              </div>

              <div className="settle-arrow">
                <div className="settle-amount">{formatCurrency(settlement.amount)}</div>
                <div className="settle-arrow-line">
                  <Icon name="chevron-right" size={20} />
                </div>
              </div>

              <div className="settle-person">
                <div className="settle-person-avatar creditor">
                  {settlement.toName[0]?.toUpperCase()}
                </div>
                <span className="settle-person-name">{settlement.toName}</span>
              </div>
            </div>
            <p className="settle-summary-hint">
              Recording this payment will update the group balance.
            </p>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label" htmlFor="settle-note">Note (Optional)</label>
            <input
              id="settle-note"
              type="text"
              className="form-input"
              placeholder="e.g. UPI transfer, Cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="settle-modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={submitting}
            >
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
