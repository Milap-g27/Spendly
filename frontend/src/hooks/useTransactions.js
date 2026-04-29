import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { attachIcons, getDateRangeLimits, getCategoryMeta } from "../lib/utils";

export function useTransactions(session, activeFilter) {
  const [transactions, setTransactions] = useState([]);
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);

  const loadTransactions = async (filter = activeFilter, range = customRange) => {
    if (!session?.user) {
      setTransactions([]);
      return;
    }
    
    setLoading(true);
    try {
      const { from, to } = getDateRangeLimits(filter, range);
      
      let query = supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (from) query = query.gte("transaction_date", from);
      if (to) query = query.lte("transaction_date", to);

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data ? attachIcons(data) : []);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilter !== "Custom") {
      loadTransactions();
    }
  }, [session, activeFilter]);

  const expenses = useMemo(() => {
    return transactions.filter((i) => i.type !== "income");
  }, [transactions]);

  const totalSpent = useMemo(() =>
    expenses.reduce((s, i) => s + Number(i.amount || 0), 0),
    [expenses]
  );

  const byCategory = useMemo(() => {
    if (expenses.length === 0) return [];
    
    const totals = new Map();
    expenses.forEach((item) => {
      totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount || 0));
    });
    
    const total = totalSpent || 1;
    let list = Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        color: getCategoryMeta(name).color,
        percent: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);
      
    if (list.length > 0) {
      const sumPct = list.reduce((s, i) => s + i.percent, 0);
      const diff = 100 - sumPct;
      if (diff !== 0) {
        list[0].percent += diff;
      }
    }
    
    return list;
  }, [expenses, totalSpent]);

  const topCategory = byCategory.length > 0 ? byCategory[0].name : "—";

  return {
    transactions,
    expenses,
    totalSpent,
    byCategory,
    topCategory,
    customRange,
    setCustomRange,
    loading,
    refresh: () => loadTransactions(activeFilter, customRange),
    applyCustom: () => loadTransactions("Custom", customRange),
    setTransactions
  };
}
