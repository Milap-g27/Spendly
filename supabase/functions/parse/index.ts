import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are a financial transaction parser for an Indian personal finance app.

Parse the user's natural language text and return ONLY a valid JSON object. No explanation.
No markdown. No code blocks. Just the raw JSON.

Output format:
{
  "type": "income" | "expense",
  "amount": <number, no currency symbols>,
  "category": "<one of the allowed categories>",
  "description": "<short clean label, max 4 words, title case>",
  "date": "<YYYY-MM-DD>" | null
}

Allowed categories:
  expense: Food, Transport, Shopping, Bills, Health, Entertainment, Other
  income:  Salary, Pocket Money, Freelance, Other

Classification rules (VERY IMPORTANT — follow strictly):
EXPENSE keywords/contexts — if ANY of these appear, classify as "expense":
  - buying, bought, paid, spent, spending, bill, subscription, ordered, ate, eaten
  - food items: panipuri, biryani, pizza, burger, chai, coffee, samosa, dosa, etc.
  - shopping items: shoes, clothes, phone, laptop, etc.
  - services: uber, ola, cab, auto, bus, train, metro, petrol, diesel
  - bills: electricity, water, gas, wifi, internet, mobile recharge, rent
  - health: doctor, medicine, hospital, pharmacy, gym
  - entertainment: movie, netflix, spotify, game, concert
  - If text is JUST a food/item name with a number, it's ALWAYS an expense
  - "20 panipuri" = expense (buying panipuri)
  - "500 netflix" = expense (netflix subscription)
  - "1200 electricity" = expense (electricity bill)

INCOME keywords/contexts — ONLY classify as income if these appear:
  - received, credited, salary, wages, pocket money, allowance, earned, got paid, got
  - freelance, project payment, refund, cashback, bonus, dividend, interest
  - Words like "received", "credited", "earned", "got" MUST be present for income

DEFAULT: If ambiguous and no clear income keyword exists, default to EXPENSE.

Other rules:
- Strip currency words: rs, rupees, inr, ₹ -> just the number
- Date resolution rules (use today's date provided in the user message):
  - "yesterday" → subtract 1 day from today
  - "day before yesterday" → subtract 2 days from today  
  - Day names like "monday", "tuesday" → most recent past occurrence (never future)
  - "15 april", "april 15", "15th april" → 2026-04-15 (use current year if no year given)
  - "15th", "15" (day only, no month) → use current month and year
  - "last month 15th" → previous month, day 15
  - If NO date is mentioned at all → return null (the app will default to today)
  - Always return date in YYYY-MM-DD format
- description: max 4 words, title case, no currency symbols
- Always pick the closest matching category from the allowed list`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => null);
  if (!body?.text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const today = body.today || (() => {
    const now = new Date();
    // IST = UTC + 5:30
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return ist.toISOString().slice(0, 10);
  })();

  // Try primary model, then fallback
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastError = "";

  for (const model of models) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.05,
            max_tokens: 200,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Today is ${today}. Parse: "${body.text}"` },
            ],
          }),
        },
      );

      if (!response.ok) {
        lastError = await response.text();
        console.error(`Model ${model} failed:`, lastError);
        continue; // try next model
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      // Strip any markdown code fences the model may have added
      const cleaned = content
        ?.replace(/```json\s*/gi, "")
        ?.replace(/```\s*/g, "")
        ?.trim();

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.type || !parsed.amount || !parsed.category) {
        lastError = "Missing required fields in parsed result";
        continue;
      }

      // Ensure type is valid
      if (!["income", "expense"].includes(parsed.type)) {
        parsed.type = "expense";
      }

      // Ensure amount is a number
      parsed.amount = Number(parsed.amount);
      if (isNaN(parsed.amount) || parsed.amount <= 0) {
        lastError = "Invalid amount";
        continue;
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      lastError = error.message || "Parse error";
      console.error(`Model ${model} error:`, error);
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: lastError || "All models failed" }),
    {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
