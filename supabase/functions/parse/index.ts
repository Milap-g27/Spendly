import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are a financial transaction parser for an Indian personal finance app.

Parse the user's sentence and return ONLY a valid JSON object. No explanation.
No markdown. No code blocks. Just the raw JSON.

Output format:
{
  "type": "income" | "expense",
  "amount": <number, no currency symbols>,
  "category": "<one of the allowed categories>",
  "description": "<short clean label>",
  "date": "<YYYY-MM-DD>" | null
}

Allowed categories:
  expense: Food, Transport, Shopping, Bills, Health, Entertainment, Other
  income:  Salary, Pocket Money, Freelance, Other

Rules:
- buying / paying / spending / eating / bill / subscription -> expense
- received / salary / pocket money / earned / got / income  -> income
- Strip currency words: rs, rupees, inr -> just the number
- date: convert "yesterday", "monday", "12 april" -> YYYY-MM-DD, else null
- description: max 4 words, title case, no currency
- Always pick the closest matching category`;

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

  const today = body.today || new Date().toISOString().slice(0, 10);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.1,
        max_tokens: 150,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Today is ${today}. Parse: "${body.text}"` },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      JSON.stringify({ error: errorText || "Groq request failed" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  try {
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON from parser" }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
