import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchGroups,
  createGroup as apiCreateGroup,
  fetchGroupDetail,
  addMember as apiAddMember,
  removeMember as apiRemoveMember,
  addExpense as apiAddExpense,
  deleteExpense as apiDeleteExpense,
  recordSettlement as apiRecordSettlement
} from "../services/groups";
import { computeBalances, calculateSettlements } from "../lib/splitSettleUtils";

export function useGroups(session) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGroups = useCallback(async () => {
    if (!session?.user) {
      setGroups([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [session]);

  const loadGroupDetail = useCallback(async (groupId) => {
    if (!session?.user || !groupId) {
      setSelectedGroup(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupDetail(groupId);
      setSelectedGroup(data);
    } catch (err) {
      console.error("Error fetching group detail:", err);
      setError(err.message || "Failed to load group details");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      loadGroups();
    } else {
      setGroups([]);
      setSelectedGroup(null);
    }
  }, [session, loadGroups]);

  const createGroup = async (name, description) => {
    setError(null);
    try {
      const group = await apiCreateGroup(name, description);
      await loadGroups();
      return { success: true, group };
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create group");
      return { success: false, error: err.message };
    }
  };

  const addMember = async (groupId, userId) => {
    setError(null);
    try {
      await apiAddMember(groupId, userId);
      await loadGroupDetail(groupId);
      // Also refresh the groups list so that members list is updated
      await loadGroups();
      return { success: true };
    } catch (err) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member");
      return { success: false, error: err.message };
    }
  };

  const removeMember = async (groupId, userId) => {
    setError(null);
    try {
      await apiRemoveMember(groupId, userId);
      await loadGroupDetail(groupId);
      await loadGroups();
      return { success: true };
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.message || "Failed to remove member");
      return { success: false, error: err.message };
    }
  };

  const addExpense = async (groupId, paidBy, amount, description, date, shares) => {
    setError(null);
    try {
      const expense = await apiAddExpense(groupId, paidBy, amount, description, date, shares);
      await loadGroupDetail(groupId);
      return { success: true, expense };
    } catch (err) {
      console.error("Error adding expense:", err);
      setError(err.message || "Failed to add expense");
      return { success: false, error: err.message };
    }
  };

  const deleteExpense = async (groupId, expenseId) => {
    setError(null);
    try {
      await apiDeleteExpense(expenseId);
      await loadGroupDetail(groupId);
      return { success: true };
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError(err.message || "Failed to delete expense");
      return { success: false, error: err.message };
    }
  };

  const recordSettlement = async (groupId, paidBy, paidTo, amount, note = "") => {
    setError(null);
    try {
      const settlement = await apiRecordSettlement(groupId, paidBy, paidTo, amount, note);
      await loadGroupDetail(groupId);
      return { success: true, settlement };
    } catch (err) {
      console.error("Error recording settlement:", err);
      setError(err.message || "Failed to record settlement");
      return { success: false, error: err.message };
    }
  };

  // Memoized balances and transactions computed for the selected group
  const balances = useMemo(() => {
    if (!selectedGroup) return {};
    const flatShares = selectedGroup.expenses.flatMap(e => e.shares || []);
    return computeBalances(
      selectedGroup.expenses,
      flatShares,
      selectedGroup.settlements || [],
      selectedGroup.members || []
    );
  }, [selectedGroup]);

  const settlements = useMemo(() => {
    if (!selectedGroup || Object.keys(balances).length === 0) return [];
    return calculateSettlements(balances);
  }, [selectedGroup, balances]);

  return {
    groups,
    selectedGroup,
    balances,
    settlements,
    loading,
    error,
    loadGroups,
    loadGroupDetail,
    createGroup,
    addMember,
    removeMember,
    addExpense,
    deleteExpense,
    recordSettlement,
    setError,
    setSelectedGroup
  };
}
