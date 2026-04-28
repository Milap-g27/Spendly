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

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  const { data: txns, error } = await supabase
    .from("transactions")
    .select("type, amount, category, transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", formatDate(start))
    .lte("transaction_date", formatDate(end));

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
  const byCategoryTotals = new Map();
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    month_name: new Date(Date.UTC(year, index, 1)).toLocaleString("en-US", {
      month: "short",
    }),
    income: 0,
    expense: 0,
  }));

  (txns || []).forEach((txn) => {
    const amount = Number(txn.amount || 0);
    const monthPart = Number(txn.transaction_date?.split("-")[1] || 1);
    if (Number.isNaN(monthPart) || monthPart < 1 || monthPart > 12) {
      return;
    }
    const monthIndex = monthPart - 1;
    if (txn.type === "income") {
      totalIncome += amount;
      months[monthIndex].income += amount;
    } else {
      totalExpense += amount;
      months[monthIndex].expense += amount;
      byCategoryTotals.set(
        txn.category,
        (byCategoryTotals.get(txn.category) || 0) + amount,
      );
    }
  });

  const byCategory = Array.from(byCategoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0,
      color: colorMap.get(category) || "#9ca3af",
    }))
    .sort((a, b) => b.amount - a.amount);

  return jsonResponse({
    year,
    total_income: totalIncome,
    total_expense: totalExpense,
    net_savings: totalIncome - totalExpense,
    months,
    by_category: byCategory,
  });
});
