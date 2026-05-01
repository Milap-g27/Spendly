import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { attachIcons, getDateRangeLimits, getCategoryMeta } from "../lib/utils";

export function useTransactions(session, activeFilter) {
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);

  // Helper: Calculate outstanding balance for a transaction
  const calculateOutstanding = (transactionAmount, transactionSettlements = []) => {
    const totalSettled = transactionSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const outstanding = Number(transactionAmount) - totalSettled;
    return Math.round(outstanding * 100) / 100; // Round to 2 decimals
  };

  // Helper: Enrich transactions with outstanding and settlement data
  const enrichTransactionsWithSettlements = (txns, allSettlements) => {
    return txns.map(tx => {
      const txSettlements = allSettlements.filter(s => s.transaction_id === tx.id);
      const outstanding = calculateOutstanding(tx.amount, txSettlements);
      return {
        ...tx,
        settlements: txSettlements,
        totalSettled: txSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0),
        outstanding
      };
    });
  };

  const loadTransactions = async (filter = activeFilter, range = customRange) => {
    if (!session?.user) {
      setTransactions([]);
      setSettlements([]);
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

      // Fetch all settlements for the current user
      const { data: settlementsData, error: settlementsError } = await supabase
        .from("settlements")
        .select("*")
        .order("settled_at", { ascending: false });

      if (settlementsError) throw settlementsError;

      const enrichedData = data ? enrichTransactionsWithSettlements(attachIcons(data), settlementsData || []) : [];
      setTransactions(enrichedData);
      setSettlements(settlementsData || []);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setTransactions([]);
      setSettlements([]);
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

  const totalSpent = useMemo(() => {
    return expenses.reduce((s, i) => {
      // For Lend/Borrow transactions, use the outstanding balance
      // (the amount actually owed/still lent)
      const isLendOrBorrow = i.category === "Lend" || i.category === "Borrow";
      const amount = isLendOrBorrow ? (i.outstanding || 0) : Number(i.amount || 0);
      return s + amount;
    }, 0);
  }, [expenses]);

  const byCategory = useMemo(() => {
    if (expenses.length === 0) return [];
    
    const totals = new Map();
    expenses.forEach((item) => {
      const isLendOrBorrow = item.category === "Lend" || item.category === "Borrow";
      const amount = isLendOrBorrow ? (item.outstanding || 0) : Number(item.amount || 0);
      totals.set(item.category, (totals.get(item.category) || 0) + amount);
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

  // Settle a Lend/Borrow transaction
  const settleTransaction = async (transactionId, settleAmount, note = "") => {
    try {
      if (!transactionId || settleAmount <= 0) {
        throw new Error("Invalid transaction ID or settlement amount");
      }

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const tx = transactions.find(t => t.id === transactionId);
      if (!tx) throw new Error("Transaction not found");

      // Verify this is a Lend/Borrow transaction
      if (tx.category !== "Lend" && tx.category !== "Borrow") {
        throw new Error("Only Lend and Borrow transactions can be settled");
      }

      const outstanding = tx.outstanding || 0;
      if (outstanding <= 0) {
        throw new Error("This transaction is already fully settled");
      }

      if (settleAmount > outstanding) {
        throw new Error(`Cannot settle more than outstanding balance of ${outstanding}`);
      }

      // Round to 2 decimal places
      const roundedAmount = Math.round(settleAmount * 100) / 100;

      // Insert settlement record with user_id for RLS
      const { data, error } = await supabase
        .from("settlements")
        .insert([
          {
            transaction_id: transactionId,
            user_id: session.user.id,
            amount: roundedAmount,
            note: note || null
          }
        ])
        .select();

      if (error) {
        // Handle specific Supabase errors
        if (error.code === "23514") {
          throw new Error("Settlement amount must be greater than 0");
        }
        if (error.code === "23503") {
          throw new Error("Transaction no longer exists");
        }
        if (error.code === "42501") {
          throw new Error("Permission denied: You can only settle your own transactions");
        }
        throw error;
      }

      // Update local state with new settlement
      const newSettlement = data?.[0];
      if (newSettlement) {
        setSettlements([newSettlement, ...settlements]);

        // Update the transaction with new settlement info
        const updatedTransactions = transactions.map(t => {
          if (t.id === transactionId) {
            const newSettlements = [newSettlement, ...t.settlements];
            const newOutstanding = calculateOutstanding(t.amount, newSettlements);
            return {
              ...t,
              settlements: newSettlements,
              totalSettled: newSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0),
              outstanding: newOutstanding
            };
          }
          return t;
        });
        setTransactions(updatedTransactions);
      }

      return { success: true, transaction: newSettlement };
    } catch (err) {
      console.error("Error settling transaction:", err);
      return { success: false, error: err.message };
    }
  };

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
    setTransactions,
    settleTransaction
  };
}
