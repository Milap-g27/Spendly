import { categoryMeta, iconByCategory } from "./constants";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";

export async function edgeFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${supabaseUrl}/functions/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Error ${response.status}`);
  }
  return response.json();
}export function formatCurrency(value) {
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  });
  return currencyFormatter.format(Number(value || 0));
}

export function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getRouteFromHash() {
  const raw = window.location.hash.replace("#", "");
  const clean = raw.startsWith("/") ? raw.slice(1) : raw;
  if (clean.startsWith("transactions")) return "transactions";
  if (clean.startsWith("insights")) return "insights";
  if (clean.startsWith("profile")) return "profile";
  if (clean.startsWith("privacy")) return "privacy";
  if (clean.startsWith("terms")) return "terms";
  if (clean.startsWith("add")) return "add";
  return "dashboard";
}

export function buildDonutGradient(segments) {
  if (!segments.length) return "conic-gradient(#e5e7eb 0deg 360deg)";
  let start = 0;
  const stops = segments.map((seg) => {
    const end = start + seg.percent;
    const stop = `${seg.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function getCategoryMeta(category) {
  return categoryMeta[category] || categoryMeta.Other;
}

export function attachIcons(items) {
  return items.map((item) => ({
    ...item,
    icon: item.icon || iconByCategory[item.category] || "box",
    description: item.description || item.raw_input || "Expense",
  }));
}

export function getDateRangeLimits(filterType, customRange = { from: "", to: "" }) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  switch (filterType) {
    case "This Month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstDay.toISOString().split("T")[0], to: today };
    }
    case "Last 3 Months": {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      return { from: date.toISOString().split("T")[0], to: today };
    }
    case "Last 6 Months": {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      return { from: date.toISOString().split("T")[0], to: today };
    }
    case "Custom":
      return { from: customRange.from || null, to: customRange.to || null };
    case "All Time":
    default:
      return { from: null, to: null };
  }
}

export function exportToCSV(transactions) {
  if (!transactions || !transactions.length) return;
  const headers = ["Date", "Type", "Category", "Description", "Amount"];
  const rows = transactions.map(t => {
    const d = new Date(`${t.transaction_date}T00:00:00`);
    const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const amount = Number(t.amount).toFixed(2);
    const desc = (t.description || "").replace(/,/g, " "); // Basic esc
    return [dateStr, t.type, t.category, desc, amount];
  });
  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `spendly_report_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
