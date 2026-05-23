/**
 * Splitwise-style greedy minimum transactions settlement algorithm and balance utilities
 */

/**
 * Computes net balances for all group members
 * 
 * @param {Array} expenses - List of group expenses
 * @param {Array} shares - List of all shares for group expenses
 * @param {Array} settlements - List of recorded settlements
 * @param {Array} members - List of group members
 * @returns {Map} Map of user_id to details (paid, owed, settledReceived, settledPaid, net)
 */
export function computeBalances(expenses = [], shares = [], settlements = [], members = []) {
  const balanceMap = {};

  // Initialize for all members
  members.forEach(member => {
    balanceMap[member.user_id] = {
      userId: member.user_id,
      displayName: member.display_name,
      avatarUrl: member.avatar_url,
      paid: 0,
      owed: 0,
      settledReceived: 0,
      settledPaid: 0,
      net: 0
    };
  });

  // 1. Accumulate expense payments
  expenses.forEach(exp => {
    const paidBy = exp.paid_by;
    if (balanceMap[paidBy]) {
      balanceMap[paidBy].paid += Number(exp.amount || 0);
    }
  });

  // 2. Accumulate shares (what each member owes)
  shares.forEach(share => {
    const userId = share.user_id;
    if (balanceMap[userId]) {
      balanceMap[userId].owed += Number(share.share_amount || 0);
    }
  });

  // 3. Accumulate settlements
  settlements.forEach(settle => {
    const paidBy = settle.paid_by;
    const paidTo = settle.paid_to;
    const amount = Number(settle.amount || 0);

    if (balanceMap[paidBy]) {
      balanceMap[paidBy].settledPaid += amount;
    }
    if (balanceMap[paidTo]) {
      balanceMap[paidTo].settledReceived += amount;
    }
  });

  // 4. Calculate net balance
  // Net = (total they paid) - (total they owe) - (settlements received) + (settlements paid)
  // Positive means they are owed money, negative means they owe money
  Object.keys(balanceMap).forEach(userId => {
    const b = balanceMap[userId];
    b.net = Math.round((b.paid - b.owed - b.settledReceived + b.settledPaid) * 100) / 100;
  });

  return balanceMap;
}

/**
 * Calculates the minimum transactions required to settle all debts in the group
 * 
 * @param {Object} balanceMap - Map of user_id to balance details (from computeBalances)
 * @returns {Array} List of transactions { fromUserId, fromName, toUserId, toName, amount }
 */
export function calculateSettlements(balanceMap) {
  const debtors = [];
  const creditors = [];

  // Separate into debtors and creditors
  Object.keys(balanceMap).forEach(userId => {
    const b = balanceMap[userId];
    const net = b.net;

    if (net < -0.01) {
      debtors.push({
        userId,
        name: b.displayName,
        amount: Math.abs(net)
      });
    } else if (net > 0.01) {
      creditors.push({
        userId,
        name: b.displayName,
        amount: net
      });
    }
  });

  // Sort both descending by amount to perform greedy matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0.01) {
      transactions.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: roundedAmount
      });
    }

    // Update remaining amounts
    debtor.amount -= roundedAmount;
    creditor.amount -= roundedAmount;

    if (debtor.amount < 0.01) {
      dIdx++;
    }
    if (creditor.amount < 0.01) {
      cIdx++;
    }
  }

  return transactions;
}
