import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "spendly.monthlyBudget";

function getCurrentMonthSpent(transactions = []) {
  const now = new Date();
  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== "expense") return sum;
    const date = new Date(`${transaction.transaction_date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return sum;
    if (date.getFullYear() !== now.getFullYear()) return sum;
    if (date.getMonth() !== now.getMonth()) return sum;
    return sum + Number(transaction.amount || 0);
  }, 0);
}

export function useBudget(transactions = []) {
  const [budget, setBudgetState] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    setBudgetState(Number.isFinite(saved) && saved > 0 ? saved : 0);
    setReady(true);
  }, []);

  const setBudget = (nextValue) => {
    const nextBudget = Math.max(0, Number(nextValue) || 0);
    setBudgetState(nextBudget);
    window.localStorage.setItem(STORAGE_KEY, String(nextBudget));
  };

  const spentThisMonth = useMemo(() => getCurrentMonthSpent(transactions), [transactions]);
  const remaining = Math.max(budget - spentThisMonth, 0);
  const usage = budget > 0 ? Math.min((spentThisMonth / budget) * 100, 100) : 0;

  return {
    budget,
    ready,
    spentThisMonth,
    remaining,
    usage,
    setBudget,
  };
}
