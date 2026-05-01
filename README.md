# 💎 Spendly — AI-Powered Personal Finance Tracker

> Track income & expenses using plain English. Powered by **ChatGroq (LLaMA 3)** for natural language parsing, **FastAPI** backend, **Supabase** database, and a **React** mobile-first frontend.

---

## 📸 What It Does

Type sentences like:
- `"100 rs for panipuri"` → 🔴 Expense · ₹100 · Food
- `"2500 pocket money received"` → 🟢 Income · ₹2500 · Pocket Money
- `"paid 1200 electricity bill yesterday"` → 🔴 Expense · ₹1200 · Bills · (yesterday's date)
- `"got 50000 salary on 1st april"` → 🟢 Income · ₹50000 · Salary · 2026-04-01

No dropdowns. No forms. Just type and save.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                 │
│  Mobile-first PWA  │  Recharts  │  Tailwind CSS           │
└──────────────────────────┬───────────────────────────────┘
                           │ REST / JSON
┌──────────────────────────▼───────────────────────────────┐
│               BACKEND (Python + FastAPI)                  │
│                                                           │
│   /api/parse  ──────────► ChatGroq (LLaMA 3)             │
│   /api/transactions                                       │
│   /api/analytics/monthly                                  │
│   /api/analytics/yearly                                   │
│   /api/categories                                         │
└──────────────────────────┬───────────────────────────────┘
                           │ Supabase Python Client
┌──────────────────────────▼───────────────────────────────┐
│                  DATABASE (Supabase / PostgreSQL)          │
│   auth.users  │  transactions  │  categories              │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer      | Technology              | Why                                         |
|------------|-------------------------|---------------------------------------------|
| Frontend   | React 18 + Vite         | Fast HMR, modern bundling                   |
| Styling    | Tailwind CSS            | Utility-first, mobile-first                 |
| Charts     | Recharts                | Lightweight, composable                     |
| Backend    | Python 3.11 + FastAPI   | Async, auto-docs, Pydantic validation       |
| AI Parser  | ChatGroq (LLaMA 3 8B)   | Free tier, 14K req/day, replaces all NLP    |
| Database   | Supabase (PostgreSQL)   | Auth + RLS + real-time, free tier           |
| Auth       | Supabase Auth           | JWT, email/pass, Google OAuth               |
| Deployment | Vercel + Railway        | Free tier CI/CD                             |

---

## 📁 Project Structure

```
spendly/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry, CORS, routers
│   │   ├── config.py               # Settings (env vars via pydantic-settings)
│   │   ├── database.py             # Supabase client setup
│   │   │
│   │   ├── models/
│   │   │   ├── transaction.py      # Pydantic models: Transaction, ParsedEntry
│   │   │   ├── analytics.py        # MonthlyStats, YearlyStats, CategoryStat
│   │   │   └── category.py         # Category model
│   │   │
│   │   ├── routers/
│   │   │   ├── parse.py            # POST /api/parse  (ChatGroq)
│   │   │   ├── transactions.py     # CRUD /api/transactions
│   │   │   ├── analytics.py        # GET /api/analytics/*
│   │   │   └── categories.py       # GET/POST /api/categories
│   │   │
│   │   └── services/
│   │       ├── groq_parser.py      # ChatGroq API call + prompt
│   │       ├── transaction_svc.py  # Business logic layer
│   │       └── analytics_svc.py    # Aggregation queries
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                 # Routes
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx       # Main screen (matches design)
│   │   │   ├── AddTransaction.jsx  # NLP input screen
│   │   │   ├── Monthly.jsx         # Monthly breakdown
│   │   │   ├── Yearly.jsx          # Yearly overview
│   │   │   ├── Transactions.jsx    # Full list + filters
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── BottomNav.jsx   # Mobile navigation
│   │   │   ├── dashboard/
│   │   │   │   ├── ProfileCard.jsx
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── RecentTransactions.jsx
│   │   │   │   └── CategoryBreakdown.jsx
│   │   │   ├── input/
│   │   │   │   ├── NLPInput.jsx    # The sentence input box
│   │   │   │   └── ParsedPreview.jsx # Shows AI result before saving
│   │   │   └── charts/
│   │   │       ├── MonthlyBarChart.jsx
│   │   │       └── YearlyGroupedBar.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTransactions.js
│   │   │   └── useAnalytics.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + all API calls
│   │   │
│   │   └── utils/
│   │       ├── formatters.js       # ₹ formatting, date helpers
│   │       └── categoryColors.js   # Category → color map
│   │
│   ├── public/
│   │   ├── manifest.json           # PWA config for iOS
│   │   └── icons/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql
│   │   ├── 002_seed_categories.sql
│   │   └── 003_rls_policies.sql
│   └── seed.sql
│
├── docker-compose.yml
└── README.md
```

---

## 🗄️ Database Schema

### `transactions` table
```sql
CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_input        TEXT NOT NULL,
  type             TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast monthly/yearly queries
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, transaction_date DESC);
```

### `categories` table
```sql
CREATE TABLE categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID REFERENCES auth.users(id),  -- NULL = global default
  name     TEXT NOT NULL,
  type     TEXT CHECK (type IN ('income', 'expense', 'both')) NOT NULL,
  color    TEXT NOT NULL,    -- hex color e.g. "#ef4444"
  icon     TEXT              -- emoji e.g. "🍕"
);
```

### Row Level Security (RLS)
```sql
-- Users can only see/edit their own transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);

-- Categories: global (user_id IS NULL) OR own
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see global + own categories"
  ON categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
```

### Seeded Default Categories
| Name          | Type    | Color     | Icon |
|---------------|---------|-----------|------|
| Food          | expense | `#ef4444` | 🍕   |
| Transport     | expense | `#f97316` | 🚌   |
| Shopping      | expense | `#eab308` | 🛍️   |
| Bills         | expense | `#3b82f6` | 🧾   |
| Health        | expense | `#ec4899` | 💊   |
| Entertainment | expense | `#8b5cf6` | 🎬   |
| Lend          | expense | `#06b6d4` | 🤝   |
| Borrow        | expense | `#f59e0b` | ⬇️   |
| Salary        | income  | `#22c55e` | 💼   |
| Pocket Money  | income  | `#14b8a6` | 👛   |
| Freelance     | income  | `#6366f1` | 💻   |
| Education     | expense | `#7c3aed` | 🎓   |
| Petrol        | expense | `#f59e0b` | ⛽   |
| Other         | both    | `#6b7280` | 📦   |

---

## 🤖 ChatGroq NLP Parser — The Core

### How It Replaces NLP

Traditional NLP pipeline you'd need WITHOUT Groq:
```
Raw text → Tokenizer → NER model → Intent classifier
        → Amount extractor → Category mapper → Date parser
```

With ChatGroq (one API call):
```
Raw text → Groq (LLaMA 3) → Structured JSON ✅
```

### Prompt Design (`backend/app/services/groq_parser.py`)

```python
SYSTEM_PROMPT = """
You are a financial transaction parser for an Indian personal finance app.

Parse the user's sentence and return ONLY a valid JSON object. No explanation.
No markdown. No code blocks. Just the raw JSON.

Output format:
{
  "type": "income" | "expense",
  "amount": <number, no currency symbols>,
  "category": "<one of the allowed categories>",
  "description": "<short clean label>",
  "date": "<YYYY-MM-DD> | null"
}

Allowed categories:
  expense: Food, Transport, Shopping, Bills, Health, Entertainment, Lend, Borrow, Education, Petrol, Other
  income:  Salary, Pocket Money, Freelance, Other

Rules:
- buying / paying / spending / eating / bill / subscription → expense
- received / salary / pocket money / earned / got / income   → income
- Strip currency words: rs, rupees, ₹, inr → just the number
- date: convert "yesterday", "monday", "12 april" → YYYY-MM-DD, else null
- description: max 4 words, title case, no currency
- Always pick the closest matching category
"""

async def parse_transaction(text: str, today: str) -> dict:
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    response = await client.chat.completions.create(
        model="llama3-8b-8192",
        temperature=0.1,          # low = consistent structured output
        max_tokens=150,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f'Today is {today}. Parse: "{text}"'}
        ]
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)        # always valid JSON at temp=0.1
```

### Test Parsing Examples
| Input | type | amount | category | description |
|---|---|---|---|---|
| `100 rs for panipuri` | expense | 100 | Food | Panipuri |
| `2500 pocket money` | income | 2500 | Pocket Money | Pocket Money |
| `paid 649 netflix` | expense | 649 | Entertainment | Netflix Subscription |
| `50000 salary credited` | income | 50000 | Salary | Salary |
| `doctor visit 800 yesterday` | expense | 800 | Health | Doctor Visit |
| `metro recharge 150` | expense | 150 | Transport | Metro Card Recharge |
| `freelance project 8000` | income | 8000 | Freelance | Freelance Project |

---

## 🔌 Backend API Reference

### Base URL: `http://localhost:8000`

All protected routes require `Authorization: Bearer <supabase_jwt>` header.

---

### `POST /api/parse`
Parse a natural language sentence (does NOT save to DB).

**Request:**
```json
{ "text": "100 rs for panipuri", "today": "2026-04-28" }
```

**Response:**
```json
{
  "type": "expense",
  "amount": 100.00,
  "category": "Food",
  "description": "Panipuri",
  "date": null
}
```

---

### `POST /api/transactions`
Save a transaction (usually after user confirms parsed result).

**Request:**
```json
{
  "raw_input": "100 rs for panipuri",
  "type": "expense",
  "amount": 100.00,
  "category": "Food",
  "description": "Panipuri",
  "transaction_date": "2026-04-28"
}
```

**Response:** `201 Created` + full transaction object.

---

### `GET /api/transactions`
Get all transactions for the authenticated user.

**Query params:** `?page=1&limit=20&category=Food&type=expense`

**Response:**
```json
{
  "data": [ { ...transaction }, ... ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

### `DELETE /api/transactions/{id}`
Delete a transaction. Returns `204 No Content`.

---

### `GET /api/analytics/monthly`
**Query params:** `?year=2026&month=4`

**Response:**
```json
{
  "year": 2026,
  "month": 4,
  "total_income": 52500.00,
  "total_expense": 12450.75,
  "net": 40049.25,
  "transaction_count": 8,
  "top_category": "Food",
  "by_category": [
    { "category": "Food", "amount": 2300.00, "count": 3, "color": "#ef4444" },
    { "category": "Bills", "amount": 2200.00, "count": 1, "color": "#3b82f6" }
  ]
}
```

---

### `GET /api/analytics/yearly`
**Query params:** `?year=2026`

**Response:**
```json
{
  "year": 2026,
  "total_income": 315000.00,
  "total_expense": 89450.75,
  "net_savings": 225549.25,
  "months": [
    { "month": 1, "month_name": "Jan", "income": 52500, "expense": 9200 },
    { "month": 2, "month_name": "Feb", "income": 52500, "expense": 11300 }
  ],
  "by_category": [
    { "category": "Food", "amount": 18400.00, "percentage": 20.6 }
  ]
}
```

---

### `GET /api/categories`
Returns global + user-defined categories.

### `POST /api/categories`
Create a custom category.

---

## 🚀 Implementation Plan — Sprint by Sprint

### ⚙️ Pre-Sprint: Environment Setup (Day 0)

```bash
# 1. Create Supabase project at supabase.com
#    → Copy URL + anon key + service role key

# 2. Create Groq account at console.groq.com
#    → Generate API key (free, 14,400 req/day)

# 3. Clone repo structure
mkdir spendly && cd spendly
mkdir backend frontend supabase
```

---

### 🗄️ Sprint 1 — Database (Day 1)

**Goal:** Supabase schema ready, seed data in place.

```bash
# Run migrations in Supabase SQL Editor (in order):
supabase/migrations/001_create_tables.sql
supabase/migrations/002_seed_categories.sql
supabase/migrations/003_rls_policies.sql
```

**Deliverable:** Tables exist, RLS blocks unauthenticated access, seed categories visible.

---

### 🐍 Sprint 2 — FastAPI Skeleton (Day 2)

**Goal:** Server runs, health check works, env vars loaded.

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install fastapi uvicorn supabase groq pydantic-settings python-dotenv
```

**`requirements.txt`:**
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
supabase==2.4.6
groq==0.9.0
pydantic-settings==2.2.1
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0
httpx==0.27.0
```

**`.env.example`:**
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_xxxx
SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

**`app/main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import parse, transactions, analytics, categories

app = FastAPI(title="Spendly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router,        prefix="/api", tags=["Parse"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
app.include_router(analytics.router,    prefix="/api", tags=["Analytics"])
app.include_router(categories.router,   prefix="/api", tags=["Categories"])

@app.get("/health")
def health(): return {"status": "ok"}
```

```bash
uvicorn app.main:app --reload
# Visit: http://localhost:8000/docs  ← auto-generated Swagger UI
```

**Deliverable:** `GET /health` returns `{"status":"ok"}`, Swagger docs visible.

---

### 🤖 Sprint 3 — ChatGroq Parser Route (Day 3)

**Goal:** `POST /api/parse` returns structured JSON from any sentence.

**`app/routers/parse.py`:**
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.groq_parser import parse_transaction
from app.dependencies import get_current_user
from datetime import date

router = APIRouter()

class ParseRequest(BaseModel):
    text: str
    today: str = str(date.today())

@router.post("/parse")
async def parse_nlp(body: ParseRequest, user=Depends(get_current_user)):
    if not body.text.strip():
        raise HTTPException(400, "Text cannot be empty")
    try:
        result = await parse_transaction(body.text, body.today)
        return result
    except Exception as e:
        raise HTTPException(422, f"Parse failed: {str(e)}")
```

**`app/dependencies.py` — JWT auth from Supabase:**
```python
from fastapi import Header, HTTPException
from app.database import supabase_admin

async def get_current_user(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(401, "Invalid auth scheme")
    try:
        user = supabase_admin.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
```

**Test with curl:**
```bash
curl -X POST http://localhost:8000/api/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"text": "100 rs for panipuri"}'
```

**Deliverable:** Parser returns correct JSON for 10+ test sentences.

---

### 💾 Sprint 4 — Transaction CRUD (Day 4)

**Goal:** Save, list, delete transactions with proper auth.

**`app/models/transaction.py`:**
```python
from pydantic import BaseModel
from typing import Optional
from datetime import date
from uuid import UUID

class TransactionCreate(BaseModel):
    raw_input: str
    type: str            # "income" | "expense"
    amount: float
    category: str
    description: Optional[str] = None
    transaction_date: date

class Transaction(TransactionCreate):
    id: UUID
    user_id: UUID
    created_at: str

class TransactionListResponse(BaseModel):
    data: list[Transaction]
    total: int
    page: int
    limit: int
```

**`app/routers/transactions.py`:**
```python
@router.post("/transactions", status_code=201)
async def create_transaction(body: TransactionCreate, user=Depends(get_current_user)):
    payload = body.model_dump()
    payload["user_id"] = str(user.id)
    payload["transaction_date"] = str(body.transaction_date)
    result = supabase.table("transactions").insert(payload).execute()
    return result.data[0]

@router.get("/transactions")
async def list_transactions(
    page: int = 1, limit: int = 20,
    category: str = None, type: str = None,
    user=Depends(get_current_user)
):
    query = supabase.table("transactions") \
        .select("*", count="exact") \
        .eq("user_id", str(user.id)) \
        .order("transaction_date", desc=True) \
        .range((page - 1) * limit, page * limit - 1)

    if category: query = query.eq("category", category)
    if type:     query = query.eq("type", type)

    result = query.execute()
    return {"data": result.data, "total": result.count, "page": page, "limit": limit}

@router.delete("/transactions/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: str, user=Depends(get_current_user)):
    supabase.table("transactions") \
        .delete() \
        .eq("id", transaction_id) \
        .eq("user_id", str(user.id)) \
        .execute()
```

**Deliverable:** CRUD tested via Swagger UI at `/docs`.

---

### 📊 Sprint 5 — Analytics Routes (Day 5)

**Goal:** Monthly + yearly aggregation endpoints working.

**`app/services/analytics_svc.py`:**
```python
async def get_monthly_stats(user_id: str, year: int, month: int) -> dict:
    # Raw SQL via Supabase RPC for aggregation
    result = supabase.rpc("get_monthly_stats", {
        "p_user_id": user_id,
        "p_year": year,
        "p_month": month
    }).execute()
    return result.data
```

**Supabase SQL function for monthly stats:**
```sql
CREATE OR REPLACE FUNCTION get_monthly_stats(
  p_user_id UUID, p_year INT, p_month INT
)
RETURNS JSON LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'total_income',  COALESCE(SUM(amount) FILTER (WHERE type='income'),  0),
    'total_expense', COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0),
    'transaction_count', COUNT(*),
    'by_category', (
      SELECT json_agg(cat_row ORDER BY cat_amount DESC)
      FROM (
        SELECT category,
               SUM(amount) AS cat_amount,
               COUNT(*)    AS cat_count
        FROM   transactions
        WHERE  user_id = p_user_id
          AND  EXTRACT(YEAR  FROM transaction_date) = p_year
          AND  EXTRACT(MONTH FROM transaction_date) = p_month
        GROUP BY category
      ) AS sub(category, cat_amount, cat_count)
      CROSS JOIN LATERAL (
        SELECT json_build_object(
          'category', category,
          'amount',   cat_amount,
          'count',    cat_count
        ) AS cat_row
      ) AS lr
    )
  )
  FROM transactions
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR  FROM transaction_date) = p_year
    AND EXTRACT(MONTH FROM transaction_date) = p_month;
$$;
```

**Deliverable:** Monthly and yearly JSON responses match API spec above.

---

### ⚛️ Sprint 6 — React Frontend Core (Days 6–8)

**Goal:** Auth screens + Dashboard with real data.

```bash
cd frontend
npm create vite@latest . -- --template react
npm install tailwindcss @tailwindcss/vite axios recharts
npm install @supabase/supabase-js react-router-dom
```

**Key implementation — NLP Input Screen (`AddTransaction.jsx`):**
```jsx
const [text, setText] = useState("")
const [parsed, setParsed] = useState(null)
const [loading, setLoading] = useState(false)

const handleParse = async () => {
  setLoading(true)
  const result = await api.post("/parse", {
    text,
    today: new Date().toISOString().split("T")[0]
  })
  setParsed(result.data)
  setLoading(false)
}

const handleSave = async () => {
  await api.post("/transactions", {
    ...parsed,
    raw_input: text,
    transaction_date: parsed.date || new Date().toISOString().split("T")[0]
  })
  navigate("/dashboard")
}
```

**Mobile bottom nav — critical for iOS:**
```jsx
// BottomNav.jsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t
                pb-[env(safe-area-inset-bottom)] z-50">
  <div className="flex justify-around py-2">
    <NavItem to="/dashboard" icon="🏠" label="Home" />
    <NavItem to="/add"       icon="➕" label="Add"  />
    <NavItem to="/monthly"   icon="📅" label="Month" />
    <NavItem to="/yearly"    icon="📊" label="Year"  />
  </div>
</nav>
```

**Deliverable:** Login → Dashboard shows real stats, Add flow parses + saves.

---

### 📈 Sprint 7 — Charts & Analytics Views (Days 9–10)

**Goal:** Monthly and Yearly views with Recharts.

**Monthly bar chart:**
```jsx
// MonthlyBarChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

<BarChart data={byCategoryData} layout="vertical">
  <XAxis type="number" tickFormatter={v => `₹${v/1000}k`} />
  <YAxis type="category" dataKey="category" width={100} />
  <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
  <Bar dataKey="amount" fill="#1a3a2a" radius={[0,4,4,0]} />
</BarChart>
```

**Yearly grouped bar chart:**
```jsx
// YearlyGroupedBar.jsx
<BarChart data={monthlyData}>
  <XAxis dataKey="month_name" />
  <YAxis tickFormatter={v => `₹${v/1000}k`} />
  <Bar dataKey="income"  fill="#22c55e" name="Income"  radius={[4,4,0,0]} />
  <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4,4,0,0]} />
</BarChart>
```

**Deliverable:** Both chart pages render with real data, month selector works.

---

## 🗄️ Database & Local Setup

This project uses Supabase (PostgreSQL) for the database, authentication, RLS policies, migrations, and Edge Functions. Below are quick steps to get the database and app running locally.

### Quick start (local Supabase via Docker)

1. Install Docker and the Supabase CLI (optional but recommended).
2. From the project root, bring up Supabase services:

```bash
docker compose up -d
# or via Supabase CLI: supabase start
```

3. Apply migrations (Supabase CLI recommended):

```bash
supabase db reset
supabase db push
```

4. Seed example data (if needed):

```bash
psql $DATABASE_URL -f supabase/seed.sql
```

5. Set environment variables for the frontend (create `frontend/.env`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the app at the Vite dev server URL (usually `http://localhost:5173`).

### Notes
- Migrations are in `supabase/migrations/` and should be applied in numeric order.
- RLS policies are defined in `003_rls_policies.sql`; ensure your auth tokens are valid when testing protected endpoints.
- For production, use a hosted Supabase project and set environment variables accordingly.

If you'd like, I can add a `.env.example` to the repository and a short `CONTRIBUTING.md` with deploy/run steps.

---

### 📱 Sprint 8 — iOS / PWA Polish (Day 11)

**Goal:** Installable on iPhone, safe area handled, no zoom bugs.

**`frontend/public/manifest.json`:**
```json
{
  "name": "Spendly",
  "short_name": "Spendly",
  "description": "AI-powered expense tracker",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#1a3a2a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`index.html` head tags for iOS:**
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Spendly">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="viewport" content="width=device-width, initial-scale=1,
      viewport-fit=cover">
```

**Critical CSS (`index.css`):**
```css
/* Prevent zoom on input focus (iOS Safari bug) */
input, textarea, select { font-size: 16px !important; }

/* Safe area for notch and home bar */
body {
  padding-top:    env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

### 🧪 Sprint 9 — Testing (Day 12)

**Backend tests (`pytest`):**
```bash
pip install pytest pytest-asyncio httpx
pytest backend/tests/ -v
```

**Test files to write:**
- `test_parser.py` — 20 input sentences, assert correct type/category
- `test_transactions.py` — CRUD with mock auth
- `test_analytics.py` — monthly/yearly aggregation correctness

**Frontend:**
- Manual test on iPhone Safari (Add to Home Screen)
- Test Hindi-English mixed input: `"aaj 200 ka petrol"` → Petrol

---

### 🚢 Sprint 10 — Deployment (Day 13)

**Backend → Railway:**
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# railway.toml
[build]
  builder = "dockerfile"
[deploy]
  startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

**Frontend → Vercel:**
```bash
cd frontend
npx vercel --prod
# Set env: VITE_API_URL=https://your-backend.railway.app
# Set env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Setup
```bash
git clone https://github.com/yourname/spendly.git
cd spendly
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with your keys
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# VITE_API_URL=http://localhost:8000
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
npm run dev
# App: http://localhost:5173
```

### 4. Database
```bash
# Run in Supabase SQL Editor:
# 1. supabase/migrations/001_create_tables.sql
# 2. supabase/migrations/002_seed_categories.sql
# 3. supabase/migrations/003_rls_policies.sql
```

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_xxxx
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔒 Security Notes

- All DB queries use RLS — users **cannot** access each other's data even with a valid JWT
- Groq API key lives only on backend — never exposed to frontend
- Supabase service role key used only for admin operations server-side
- JWT verified on every protected route via Supabase Auth

---

## 🗺️ Roadmap

- [ ] Budget goals per category per month
- [ ] Recurring transactions (rent, subscriptions)
- [ ] CSV / PDF export
- [ ] WhatsApp Bot integration (send expense via WhatsApp message)
- [ ] Multi-currency support
- [ ] Family/shared accounts
- [ ] Spending alerts & notifications

---

## 📄 License

MIT © 2026 Spendly
