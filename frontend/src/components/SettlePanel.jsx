import { useState } from "react";
import { formatCurrency } from "../lib/utils";
import { validateSettleAmount } from "../lib/settleUtils";
import { Icon } from "./Icons";

export function SettlePanel({ transaction, onClose, onSettle, isLoading = false }) {
  const [settleAmount, setSettleAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!transaction) return null;

  const outstanding = transaction.outstanding || 0;
  const isFullySettled = outstanding === 0;

  const handleSettle = async () => {
    setError("");

    // Validate using utility
    const validation = validateSettleAmount(settleAmount, outstanding);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const amount = parseFloat(settleAmount);

    // Call the settle function
    const result = await onSettle(transaction.id, amount, note);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(result.error || "Failed to settle transaction");
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setSettleAmount(value);
    setError(""); // Clear error when user types
  };

  return (
    <div className="settle-panel-overlay" onClick={onClose}>
      <div className="settle-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settle-panel-header">
          <div>
            <div className="settle-panel-eyebrow">Settle Transaction</div>
            <div className="settle-panel-title">
              {transaction.category === "Lend" ? "Money You Lent" : "Money You Borrowed"}
            </div>
          </div>
          <button className="settle-panel-close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="settle-panel-info">
          <div className="settle-calculation">
            <div className="calc-row">
              <span className="calc-label">Original Amount</span>
              <span className="calc-value original">{formatCurrency(transaction.amount)}</span>
            </div>
            
            {transaction.totalSettled > 0 && (
              <>
                <div className="calc-operator">−</div>
                <div className="calc-row">
                  <span className="calc-label">Total Settled</span>
                  <span className="calc-value settled">{formatCurrency(transaction.totalSettled)}</span>
                </div>
              </>
            )}
            
            <div className="calc-divider"></div>
            
            <div className="calc-row result">
              <span className="calc-label">Outstanding Balance</span>
              <span className="calc-value outstanding-amount">
                {formatCurrency(outstanding)}
              </span>
            </div>
          </div>
        </div>

        {!isFullySettled && (
          <div className="settle-form">
            <div className="settle-field">
              <label>Settlement Amount</label>
              <div className="settle-input-wrapper">
                <span className="settle-currency">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={settleAmount}
                  onChange={handleAmountChange}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                  max={outstanding}
                  className="settle-amount-input"
                />
              </div>
              <div className="settle-quick-settle">
                <button
                  className="settle-quick-btn"
                  onClick={() => setSettleAmount(outstanding.toString())}
                  disabled={isLoading}
                >
                  Settle Full ({formatCurrency(outstanding)})
                </button>
              </div>
            </div>

            <div className="settle-field">
              <label>Note (Optional)</label>
              <input
                type="text"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isLoading}
                className="settle-note-input"
              />
            </div>

            {error && <div className="settle-message error">{error}</div>}
            {success && <div className="settle-message success">Settlement recorded! ✓</div>}

            <div className="settle-actions">
              <button className="settle-btn secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button
                className="settle-btn primary"
                onClick={handleSettle}
                disabled={isLoading || !settleAmount}
              >
                {isLoading ? "Processing..." : "Confirm Settlement"}
              </button>
            </div>
          </div>
        )}

        {isFullySettled && (
          <div className="settle-panel-settled">
            <div className="settle-settled-icon">✓</div>
            <div className="settle-settled-title">Fully Settled</div>
            <div className="settle-settled-text">This transaction has been completely settled.</div>
            <button className="settle-btn primary" onClick={onClose} style={{ marginTop: "16px" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
