import { supabase } from "../lib/supabaseClient";

/**
 * Fetch all groups the current user belongs to
 */
export async function fetchGroups() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error("User not authenticated");

  // Step 1: Fetch memberships
  const { data: memberships, error: memErr } = await supabase
    .from("split_group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (memErr) throw memErr;
  if (!memberships || memberships.length === 0) return [];

  const groupIds = memberships.map(m => m.group_id);

  // Step 2: Fetch group details
  const { data: groups, error: groupsErr } = await supabase
    .from("split_groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsErr) throw groupsErr;

  // Step 3: For each group, fetch members count/avatars
  const { data: allMembers, error: membersErr } = await supabase
    .from("split_group_members")
    .select("group_id, user_id")
    .in("group_id", groupIds);

  if (membersErr) throw membersErr;

  const memberUserIds = Array.from(new Set(allMembers.map(m => m.user_id)));
  let profilesMap = {};
  if (memberUserIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", memberUserIds);

    if (profErr) throw profErr;

    profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});
  }

  // Step 4: Batch fetch expenses, shares, settlements for all groups
  const { data: allExpenses } = await supabase
    .from("split_expenses")
    .select("*")
    .in("group_id", groupIds);

  const expIds = (allExpenses || []).map(e => e.id);
  let allShares = [];
  if (expIds.length > 0) {
    const { data: sharesData } = await supabase
      .from("split_expense_shares")
      .select("*")
      .in("expense_id", expIds);
    allShares = sharesData || [];
  }

  const { data: allSettlements } = await supabase
    .from("split_settlements")
    .select("*")
    .in("group_id", groupIds);

  return groups.map(group => {
    const groupMembers = allMembers
      .filter(m => m.group_id === group.id)
      .map(m => ({
        user_id: m.user_id,
        display_name: profilesMap[m.user_id]?.display_name || "Unknown User",
        avatar_url: profilesMap[m.user_id]?.avatar_url || null
      }));

    // Filter sub-arrays for this group
    const grpExpenses = (allExpenses || []).filter(e => e.group_id === group.id);
    const grpExpIds = grpExpenses.map(e => e.id);
    const grpShares = allShares.filter(s => grpExpIds.includes(s.expense_id));
    const grpSettlements = (allSettlements || []).filter(s => s.group_id === group.id);

    // Compute user's net balance for this group
    let paid = 0;
    let owed = 0;
    let settledReceived = 0;
    let settledPaid = 0;

    grpExpenses.forEach(exp => {
      if (exp.paid_by === user.id) paid += Number(exp.amount || 0);
    });

    grpShares.forEach(share => {
      if (share.user_id === user.id) owed += Number(share.share_amount || 0);
    });

    grpSettlements.forEach(settle => {
      if (settle.paid_by === user.id) settledPaid += Number(settle.amount || 0);
      if (settle.paid_to === user.id) settledReceived += Number(settle.amount || 0);
    });

    const userNetBalance = Math.round((paid - owed - settledReceived + settledPaid) * 100) / 100;

    return {
      ...group,
      members: groupMembers,
      userNetBalance
    };
  });
}

/**
 * Create a new group and add the creator as member.
 * Uses a security definer RPC to avoid RLS chicken-and-egg issues
 * (INSERT succeeds but the chained .select() fails because the SELECT
 * policy requires group membership which doesn't exist yet).
 */
export async function createGroup(name, description) {
  const { data, error } = await supabase.rpc("create_group_with_member", {
    p_name: name,
    p_description: description || null
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch detailed data for a specific group (members, expenses, shares, settlements)
 */
export async function fetchGroupDetail(groupId) {
  // 1. Fetch group basic details
  const { data: group, error: groupErr } = await supabase
    .from("split_groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupErr) throw groupErr;

  // 2. Fetch group members
  const { data: members, error: membersErr } = await supabase
    .from("split_group_members")
    .select("*")
    .eq("group_id", groupId);

  if (membersErr) throw membersErr;

  // 3. Fetch profiles for members
  const memberUserIds = members.map(m => m.user_id);
  let profilesMap = {};
  if (memberUserIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", memberUserIds);
    if (profErr) throw profErr;

    profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});
  }

  const enrichedMembers = members.map(m => ({
    ...m,
    display_name: profilesMap[m.user_id]?.display_name || "Unknown User",
    avatar_url: profilesMap[m.user_id]?.avatar_url || null
  }));

  // 4. Fetch expenses
  const { data: expenses, error: expensesErr } = await supabase
    .from("split_expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("expense_date", { ascending: false });

  if (expensesErr) throw expensesErr;

  // 5. Fetch expense shares
  const expenseIds = expenses.map(e => e.id);
  let shares = [];
  if (expenseIds.length > 0) {
    const { data: sharesData, error: sharesErr } = await supabase
      .from("split_expense_shares")
      .select("*")
      .in("expense_id", expenseIds);
    if (sharesErr) throw sharesErr;
    shares = sharesData;
  }

  // Enrich expenses with shares
  const enrichedExpenses = expenses.map(exp => {
    const expShares = shares.filter(s => s.expense_id === exp.id);
    return {
      ...exp,
      shares: expShares
    };
  });

  // 6. Fetch settlements
  const { data: settlements, error: settlementsErr } = await supabase
    .from("split_settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("settled_at", { ascending: false });

  if (settlementsErr) throw settlementsErr;

  return {
    ...group,
    members: enrichedMembers,
    expenses: enrichedExpenses,
    settlements
  };
}

/**
 * Search users by email (RPC security definer call)
 */
export async function searchUsers(query) {
  const { data, error } = await supabase.rpc("search_users_by_email", { search_query: query });
  if (error) throw error;
  return data;
}

/**
 * Add a member to a group
 */
export async function addMember(groupId, userId) {
  const { data, error } = await supabase
    .from("split_group_members")
    .insert({ group_id: groupId, user_id: userId })
    .select();
  if (error) throw error;
  return data;
}

/**
 * Remove a member from a group
 */
export async function removeMember(groupId, userId) {
  const { error } = await supabase
    .from("split_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

/**
 * Add an expense and its associated shares
 */
export async function addExpense(groupId, paidBy, amount, description, date, shares) {
  // 1. Insert the expense record
  const { data: expense, error: expErr } = await supabase
    .from("split_expenses")
    .insert({
      group_id: groupId,
      paid_by: paidBy,
      amount: parseFloat(amount),
      description,
      expense_date: date
    })
    .select()
    .single();

  if (expErr) throw expErr;

  // 2. Prepare shares
  const sharesToInsert = shares.map(s => ({
    expense_id: expense.id,
    user_id: s.user_id,
    share_amount: parseFloat(s.share_amount)
  }));

  const { error: sharesErr } = await supabase
    .from("split_expense_shares")
    .insert(sharesToInsert);

  if (sharesErr) throw sharesErr;

  return {
    ...expense,
    shares: sharesToInsert
  };
}

/**
 * Delete an expense and its cascading shares
 */
export async function deleteExpense(expenseId) {
  const { error } = await supabase
    .from("split_expenses")
    .delete()
    .eq("id", expenseId);
  if (error) throw error;
  return true;
}

/**
 * Record a settlement between two members in a group
 */
export async function recordSettlement(groupId, paidBy, paidTo, amount, note = "") {
  const { data, error } = await supabase
    .from("split_settlements")
    .insert({
      group_id: groupId,
      paid_by: paidBy,
      paid_to: paidTo,
      amount: parseFloat(amount),
      note
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
