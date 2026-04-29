import { useState } from "react";
import { EXAMPLE_PHRASES } from "../lib/constants";
import { formatCurrency, formatShortDate, getCategoryMeta, edgeFetch } from "../lib/utils";

export function AddTransactionScreen({ session, navigate, setTransactions }) {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [addStatus, setAddStatus] = useState("idle"); // idle | parsing | ready | saving | done
  const [addError, setAddError] = useState("");

  const handleParse = async () => {
    const text = inputText.trim();
    if (!text) { setAddError("Please describe your transaction."); return; }
    if (text.length > 200) { setAddError("Transaction description is too long (max 200 characters)."); return; }
    
    setAddStatus("parsing"); setAddError(""); setParsed(null);

    try {
      if (!session) throw new Error("Not logged in");
      
      const today = new Date().toISOString().slice(0, 10);
      const result = await edgeFetch("/parse", { 
        method: "POST", 
        body: { text, today }, 
        token: session.access_token 
      });
      
      setParsed(result);
      setAddStatus("ready");
    } catch (e) {
      setAddError(e.message || "Could not parse. Try rephrasing.");
      setAddStatus("idle");
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setAddStatus("saving"); setAddError("");

    try {
      if (!session) throw new Error("Not logged in");

      const today = new Date().toISOString().slice(0, 10);
      
      const payload = {
        raw_input:        inputText,
        type:             parsed.type,
        amount:           parsed.amount,
        category:         parsed.category,
        description:      parsed.description,
        transaction_date: parsed.date || today,
      };

      const saved = await edgeFetch("/transactions", {
        method: "POST",
        body: payload,
        token: session.access_token
      });

      setAddStatus("done");
      if (setTransactions) {
        setTransactions(prev => {
          const newList = [saved, ...prev];
          return newList.sort((a, b) => {
            const timeDiff = new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
            if (timeDiff !== 0) return timeDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }
      navigate("dashboard");
      reset();
    } catch (e) {
      setAddError("Save failed: " + e.message);
      setAddStatus("ready");
    }
  };

  const reset = () => {
    setInputText(""); setParsed(null); setAddStatus("idle"); setAddError("");
  };

  if (!session) {
    return (
      <div className="screen" style={{ alignItems: "center", paddingTop: 40 }}>
        <p>Please log in to add transactions.</p>
      </div>
    );
  }

  const catMeta = parsed ? getCategoryMeta(parsed.category) : null;
  const isIncome = parsed?.type === "income";

  return (
    <div className="screen">
      {/* ── Input card ──────────────────────────────────────────────────────── */}
      <div className="card">
        <p className="card-label">Describe your transaction</p>
        <textarea
          className="nlp-textarea"
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); setAddError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleParse(); } }}
          placeholder="e.g. 500 for netflix, 2500 pocket money received, paid 1200 electricity bill..."
        />

      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {addError && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
          padding: "10px 14px", fontSize: 13, color: "#991b1b",
        }}>
          ⚠ {addError}
        </div>
      )}

      {/* ── Parse button ─────────────────────────────────────────────────────── */}
      {!parsed && (
        <button
          onClick={handleParse}
          disabled={addStatus === "parsing"}
          style={{
            width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: "#2563eb", color: "#fff", fontFamily: "inherit",
            fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
            opacity: addStatus === "parsing" ? .7 : 1,
          }}
        >
          {addStatus === "parsing" ? "Parsing with AI…" : "Parse with AI →"}
        </button>
      )}

      {/* ── Parsed preview ───────────────────────────────────────────────────── */}
      {parsed && addStatus !== "parsing" && (
        <>
          <div className={`card ${isIncome ? 'preview-card-income' : 'preview-card-expense'}`}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className={`type-badge ${isIncome ? 'type-badge-income' : 'type-badge-expense'}`}>
                {isIncome ? "↑ Income" : "↓ Expense"}
              </span>
              <span style={{
                fontSize: 11, color: "var(--muted)", background: "var(--bg)",
                padding: "3px 8px", borderRadius: 999, border: "1px solid var(--border)",
              }}>
                AI parsed
              </span>
            </div>

            {/* Amount */}
            <div className="parsed-amount">
              {formatCurrency(parsed.amount)}
            </div>

            {/* Fields grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>CATEGORY</p>
                <span style={{
                  display: "inline-flex", padding: "4px 10px", borderRadius: 999,
                  fontSize: 13, fontWeight: 600, background: catMeta.chip, color: catMeta.color,
                }}>
                  {parsed.category}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>DATE</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{parsed.date ? formatShortDate(parsed.date) : "Today"}</p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>DESCRIPTION</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{parsed.description}</p>
              </div>
            </div>

            {/* Raw input */}
            <div className="raw-quote">
              "{inputText}"
            </div>
          </div>

          {/* Save button */}
          <button
            className={`btn-save ${isIncome ? 'btn-save-income' : 'btn-save-expense'}`}
            onClick={handleSave}
            disabled={addStatus === "saving"}
            style={{ opacity: addStatus === "saving" ? .7 : 1 }}
          >
            {addStatus === "saving" ? "Saving…" : `Save ${isIncome ? "Income" : "Expense"} →`}
          </button>

          {/* Clear */}
          <button onClick={reset} style={{
            width: "100%", padding: 10, borderRadius: 12,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", fontFamily: "inherit", fontSize: 14, cursor: "pointer",
          }}>
            Clear
          </button>
        </>
      )}
    </div>
  );
}
