/**
 * Settlement utilities and validation helpers
 */

/**
 * Validate settlement amount
 * @param {number} amount - Amount to settle
 * @param {number} outstanding - Outstanding balance
 * @returns {object} { isValid: boolean, error?: string }
 */
export function validateSettleAmount(amount, outstanding) {
  const parsedAmount = parseFloat(amount);

  if (!amount || isNaN(parsedAmount)) {
    return { isValid: false, error: "Please enter a valid amount" };
  }

  if (parsedAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  if (parsedAmount > outstanding) {
    return {
      isValid: false,
      error: `Cannot settle more than outstanding balance`
    };
  }

  // Check for floating point precision issues
  // Allow up to 2 decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(parsedAmount.toString())) {
    return { isValid: false, error: "Amount can only have up to 2 decimal places" };
  }

  return { isValid: true };
}

/**
 * Calculate outstanding balance
 * @param {number} transactionAmount - Original transaction amount
 * @param {array} settlements - Array of settlement records
 * @returns {number} Outstanding balance
 */
export function calculateOutstanding(transactionAmount, settlements = []) {
  const totalSettled = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const outstanding = Number(transactionAmount) - totalSettled;
  // Round to 2 decimal places to avoid floating point errors
  return Math.round(outstanding * 100) / 100;
}

/**
 * Check if transaction is fully settled
 * @param {number} outstanding - Outstanding balance
 * @param {number} totalSettled - Total settled amount
 * @returns {boolean}
 */
export function isFullySettled(outstanding, totalSettled) {
  return outstanding === 0 && totalSettled > 0;
}

/**
 * Format settlement for display
 * @param {object} settlement - Settlement record
 * @returns {string} Formatted settlement string
 */
export function formatSettlement(settlement) {
  const date = new Date(settlement.settled_at);
  const dateStr = date.toLocaleDateString("en-IN", {
    year: "2-digit",
    month: "short",
    day: "numeric"
  });
  return `₹${Number(settlement.amount).toFixed(2)} on ${dateStr}`;
}

/**
 * Get settlement status badge
 * @param {number} outstanding - Outstanding balance
 * @returns {object} { status: string, color: string }
 */
export function getSettlementStatus(outstanding) {
  if (outstanding === 0) {
    return { status: "Settled", color: "#16a34a" };
  } else if (outstanding > 0) {
    return { status: "Pending", color: "#f97316" };
  }
  // This shouldn't happen if validation works correctly
  return { status: "Error", color: "#dc2626" };
}

/**
 * Validate transaction is eligible for settlement
 * @param {object} transaction - Transaction object
 * @returns {object} { isEligible: boolean, reason?: string }
 */
export function validateTransactionForSettlement(transaction) {
  if (!transaction) {
    return { isEligible: false, reason: "Transaction not found" };
  }

  const isLendOrBorrow = transaction.category === "Lend" || transaction.category === "Borrow";
  if (!isLendOrBorrow) {
    return { isEligible: false, reason: "Only Lend and Borrow transactions can be settled" };
  }

  if (transaction.outstanding === 0) {
    return { isEligible: false, reason: "Transaction is already fully settled" };
  }

  if (transaction.outstanding === undefined || transaction.outstanding < 0) {
    return { isEligible: false, reason: "Invalid transaction state" };
  }

  return { isEligible: true };
}
