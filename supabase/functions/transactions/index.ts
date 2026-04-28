import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../_shared/supabaseClient.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  if (req.method === "GET") {
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const category = url.searchParams.get("category");
    const type = url.searchParams.get("type");

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .range(start, end);

    if (category) {
      query = query.eq("category", category);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, count, error } = await query;
    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ data, total: count ?? 0, page, limit });
  }

  if (req.method === "POST") {
    const payload = await req.json().catch(() => null);
    if (
      payload?.amount === undefined ||
      payload?.category === undefined ||
      payload?.type === undefined
    ) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const insertPayload = {
      ...payload,
      user_id: user.id,
      transaction_date: payload.transaction_date || new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(data, 201);
  }

  if (req.method === "PUT") {
    const payload = await req.json().catch(() => null);
    if (!payload?.id) {
      return jsonResponse({ error: "Missing transaction id" }, 400);
    }

    const { id, ...updates } = payload;
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(data);
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) {
      return jsonResponse({ error: "Missing transaction id" }, 400);
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
