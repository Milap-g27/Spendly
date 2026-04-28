import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabaseClient.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const supabase = getSupabaseClient(authHeader);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") || now.getFullYear());
  const month = Number(url.searchParams.get("month") || now.getMonth() + 1);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const { data: txns, error } = await supabase
    .from("transactions")
    .select("type, amount, category, transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("name, color");

  const colorMap = new Map(
    (categories || []).map((item) => [item.name, item.color]),
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const counts = new Map();
  const totals = new Map();

  (txns || []).forEach((txn) => {
    const amount = Number(txn.amount || 0);
    if (txn.type === "income") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      totals.set(txn.category, (totals.get(txn.category) || 0) + amount);
      counts.set(txn.category, (counts.get(txn.category) || 0) + 1);
    }
  });

  const byCategory = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      count: counts.get(category) || 0,
      color: colorMap.get(category) || "#9ca3af",
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = byCategory[0]?.category || null;

  return jsonResponse({
    year,
    month,
    total_income: totalIncome,
    total_expense: totalExpense,
    net: totalIncome - totalExpense,
    transaction_count: (txns || []).length,
    top_category: topCategory,
    by_category: byCategory,
  });
});
