import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SYSTEM_PROMPT = `You are a financial document analyzer for an Indian personal finance app.

Analyze the uploaded image of a financial document (receipt, bill, salary slip, invoice, etc.) and extract ALL financial information.

Return ONLY a valid JSON object. No explanation. No markdown. No code blocks. Just the raw JSON.

Output format:
{
  "document_type": "receipt" | "salary_slip" | "invoice" | "bill" | "other",
  "merchant_name": "<store/company name or null>",
  "date": "<YYYY-MM-DD or null>",
  "currency": "INR",
  "items": [
    { "name": "<item name>", "quantity": <number>, "price": <number> }
  ],
  "subtotal": <number or null>,
  "tax": <number or null>,
  "total_amount": <number>,
  "suggested_transaction": {
    "type": "income" | "expense",
    "amount": <number>,
    "category": "<from allowed list>",
    "description": "<short label, max 5 words, title case>",
    "date": "<YYYY-MM-DD or null>"
  },
  "salary_details": null,
  "confidence": "high" | "medium" | "low"
}

If the document is a salary slip, populate salary_details:
{
  "salary_details": {
    "basic_salary": <number or null>,
    "hra": <number or null>,
    "da": <number or null>,
    "other_allowances": <number or null>,
    "pf_deduction": <number or null>,
    "tax_deduction": <number or null>,
    "other_deductions": <number or null>,
    "net_salary": <number or null>,
    "employer_name": "<string or null>"
  }
}

Classification rules:
- Receipts/bills/invoices → type: "expense", amount = total_amount
- Salary slips → type: "income", amount = net_salary, category = "Salary"
- Allowed expense categories: Food, Transport, Shopping, Bills, Health, Entertainment, Education, Petrol, Other
- Allowed income categories: Salary, Freelance, Pocket Money, Other
- Strip currency symbols: ₹, Rs, Rs., INR → just numbers
- Date: convert to YYYY-MM-DD format. If only partial date, use current year. Return null if not found.
- items array: extract individual line items if visible on the document, empty array [] if not readable
- salary_details: only populate for salary slips, null for everything else
- confidence: "high" if document is clear and all key data extracted, "medium" if partially readable, "low" if blurry/unclear
- description: Use merchant name or a short summary. Max 5 words, title case.
- For grocery/supermarket receipts: category = "Food" or "Shopping" based on items
- For restaurant bills: category = "Food"
- For electricity/water/gas/wifi bills: category = "Bills"
- For medical/pharmacy bills: category = "Health"
- For fuel/petrol receipts: category = "Petrol"
- Always return a valid total_amount even if you have to sum items manually`;

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

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 1. Authenticate the user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, 500);
  }

  // Use the user's auth to verify identity
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  // 2. Parse the request body
  const body = await req.json().catch(() => null);
  if (!body?.storagePath) {
    return jsonResponse({ error: "storagePath is required" }, 400);
  }

  // 3. Download the image from Supabase Storage using service role key
  const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  const { data: fileData, error: downloadError } = await adminClient.storage
    .from("receipts")
    .download(body.storagePath);

  if (downloadError || !fileData) {
    console.error("Download error:", downloadError);
    return jsonResponse(
      { error: "Failed to download image from storage" },
      400,
    );
  }

  // 4. Convert to base64
  const arrayBuffer = await fileData.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64Image = btoa(binary);

  // Detect MIME type from the file extension
  const ext = body.storagePath.split(".").pop()?.toLowerCase() || "jpeg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
  };
  const mimeType = mimeMap[ext] || "image/jpeg";

  // 5. Send to Groq Vision API
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    return jsonResponse({ error: "Missing GROQ_API_KEY" }, 500);
  }

  const today = (() => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  })();

  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
  ];

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
            max_tokens: 1500,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Today is ${today}. Analyze this financial document image and extract all data.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        lastError = await response.text();
        console.error(`Model ${model} failed:`, lastError);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      // Strip markdown code fences if present
      const cleaned = content
        ?.replace(/```json\s*/gi, "")
        ?.replace(/```\s*/g, "")
        ?.trim();

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.total_amount && !parsed.suggested_transaction?.amount) {
        lastError = "Could not extract financial data from this image";
        continue;
      }

      // Ensure suggested_transaction exists
      if (!parsed.suggested_transaction) {
        parsed.suggested_transaction = {
          type: "expense",
          amount: parsed.total_amount || 0,
          category: "Other",
          description: parsed.merchant_name || "Document Scan",
          date: parsed.date || null,
        };
      }

      // Validate transaction type
      if (!["income", "expense"].includes(parsed.suggested_transaction.type)) {
        parsed.suggested_transaction.type = "expense";
      }

      // Ensure amount is a valid number
      parsed.suggested_transaction.amount = Number(
        parsed.suggested_transaction.amount,
      );
      if (
        isNaN(parsed.suggested_transaction.amount) ||
        parsed.suggested_transaction.amount <= 0
      ) {
        parsed.suggested_transaction.amount = Number(parsed.total_amount) || 0;
      }

      parsed.total_amount = Number(parsed.total_amount) || 0;

      // Validate confidence
      if (!["high", "medium", "low"].includes(parsed.confidence)) {
        parsed.confidence = "medium";
      }

      // Ensure items is an array
      if (!Array.isArray(parsed.items)) {
        parsed.items = [];
      }

      return jsonResponse(parsed);
    } catch (error) {
      lastError = error.message || "Parse error";
      console.error(`Model ${model} error:`, error);
      continue;
    }
  }

  return jsonResponse(
    {
      error:
        lastError ||
        "Could not analyze the image. Please try a clearer photo.",
    },
    422,
  );
});
