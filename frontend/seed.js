import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env rules");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const email = `demo${Date.now()}@spendly.com`;
  const password = "password123";

  // 1. Sign up user
  console.log(`Signing up user ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Demo User"
      }
    }
  });

  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`User created. User ID: ${userId}`);

  // 2. Prepare transactions
  const demoTransactions = [
    { user_id: userId, description: "Groceries", category: "Food", amount: 850, type: "expense", transaction_date: "2026-04-12", raw_input: "Groceries 850" },
    { user_id: userId, description: "Metro card recharge", category: "Transport", amount: 500, type: "expense", transaction_date: "2026-04-11", raw_input: "Metro 500" },
    { user_id: userId, description: "Electricity bill", category: "Bills", amount: 2200, type: "expense", transaction_date: "2026-04-10", raw_input: "Electricity 2200" },
    { user_id: userId, description: "Doctor visit", category: "Health", amount: 800, type: "expense", transaction_date: "2026-04-09", raw_input: "Doctor 800" },
    { user_id: userId, description: "Netflix subscription", category: "Entertainment", amount: 649, type: "expense", transaction_date: "2026-04-08", raw_input: "Netflix 649" },
    { user_id: userId, description: "New shoes", category: "Shopping", amount: 3200, type: "expense", transaction_date: "2026-04-07", raw_input: "Shoes 3200" },
    { user_id: userId, description: "Dinner with friends", category: "Food", amount: 1450, type: "expense", transaction_date: "2026-04-05", raw_input: "Dinner 1450" }
  ];

  // 3. Insert transactions
  console.log("Inserting demo transactions...");
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .insert(demoTransactions)
    .select();

  if (txError) {
    console.error("Error inserting transactions:", txError.message);
    return;
  }

  console.log(`Successfully inserted ${txData.length} transactions for user ${email}.`);
  console.log("------------------------------------------");
  console.log("USE THESE CREDENTIALS IN YOUR LOGIN FORM:");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log("------------------------------------------");
}

seed();
