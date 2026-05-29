import { useState, useRef } from "react";
import { Icon } from "./Icons";
import { edgeFetch, formatCurrency, uploadReceiptImage } from "../lib/utils";
import { SCAN_MAX_FILE_SIZE, SCAN_ALLOWED_TYPES, SCAN_CONFIDENCE_COLORS } from "../lib/constants";

/* ── Allowed categories for the edit dropdown ────────────────── */
const EXPENSE_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Petrol", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Pocket Money", "Other"];

/* ── Main Component ──────────────────────────────────────────── */
export function ScanReceiptScreen({ session, navigate, setTransactions, addToast, onUndoTransaction }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | analyzing | preview | saving | done | error
  const [imagePreview, setImagePreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");

  // Editable fields (populated from AI result)
  const [editType, setEditType] = useState("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const defaultDateISO = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  /* ── File validation ────────────────────────────────────────── */
  const validateFile = (file) => {
    if (!file) return "No file selected";
    if (!SCAN_ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported format. Use JPG, PNG, or WebP.";
    }
    if (file.size > SCAN_MAX_FILE_SIZE) {
      return `File too large. Maximum size is 15 MB.`;
    }
    return null;
  };

  /* ── Handle image selected ──────────────────────────────────── */
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show image preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result);
    reader.readAsDataURL(file);

    setError("");
    setStatus("uploading");

    try {
      // Upload to Supabase Storage
      const storagePath = await uploadReceiptImage(file, session.user.id);

      setStatus("analyzing");

      // Call the scan-receipt edge function
      const result = await edgeFetch("/scan-receipt", {
        method: "POST",
        body: { storagePath },
        token: session?.access_token,
      });

      if (!result || result.error) {
        throw new Error(result?.error || "Failed to analyze the document");
      }

      setScanResult(result);

      // Populate editable fields from AI result
      const tx = result.suggested_transaction || {};
      setEditType(tx.type || "expense");
      setEditCategory(tx.category || "Other");
      setEditAmount(String(tx.amount || result.total_amount || ""));
      setEditDescription(tx.description || result.merchant_name || "");
      setEditDate(tx.date || result.date || defaultDateISO);

      setStatus("preview");
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  /* ── Save transaction ───────────────────────────────────────── */
  const handleSave = async () => {
    if (!editAmount || isNaN(editAmount) || Number(editAmount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const payload = {
        raw_input: `[Scanned] ${editDescription}`,
        type: editType,
        amount: Number(editAmount),
        category: editCategory,
        description: editDescription.trim() || "Scanned Document",
        transaction_date: editDate || defaultDateISO,
      };

      const saved = await edgeFetch("/transactions", {
        method: "POST",
        body: payload,
        token: session?.access_token,
      });

      setStatus("done");

      if (setTransactions) {
        setTransactions((prev) => {
          const newTransaction = {
            ...saved,
            settlements: [],
            totalSettled: 0,
            outstanding: Number(saved.amount || 0),
          };
          const newList = [newTransaction, ...prev];
          return newList.sort((a, b) => {
            const td = new Date(b.transaction_date) - new Date(a.transaction_date);
            return td !== 0 ? td : new Date(b.created_at) - new Date(a.created_at);
          });
        });
      }

      if (addToast) {
        addToast(
          `✓ ${editType === "income" ? "Income" : "Expense"} of ${formatCurrency(editAmount)} added from scan`,
          "success",
          5000,
          () => onUndoTransaction?.(saved.id)
        );
      }

      navigate("dashboard");
    } catch (err) {
      setError("Failed to save: " + err.message);
      setStatus("preview");
    }
  };

  /* ── Reset / Re-scan ────────────────────────────────────────── */
  const handleRescan = () => {
    setStatus("idle");
    setImagePreview(null);
    setScanResult(null);
    setError("");
    setEditType("expense");
    setEditCategory("");
    setEditAmount("");
    setEditDescription("");
    setEditDate("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const categories = editType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  /* ── RENDER: Auth guard ─────────────────────────────────────── */
  if (!session) {
    return (
      <div className="screen" style={{ alignItems: "center", paddingTop: 40 }}>
        <p>Please log in to scan documents.</p>
      </div>
    );
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="screen">
      <div className="page-title-row">
        <h2 className="page-title">Scan Document</h2>
      </div>

      {/* ── IDLE / ERROR: Upload Zone ────────────────────────── */}
      {(status === "idle" || status === "error") && (
        <div className="card scan-card">
          <div className="scan-upload-zone" onClick={() => galleryInputRef.current?.click()}>
            <div className="scan-upload-icon">
              <Icon name="scan" size={48} />
            </div>
            <p className="scan-upload-title">Scan a receipt or bill</p>
            <p className="scan-upload-sub">Take a photo or upload an image</p>
          </div>

          <div className="scan-btn-row">
            <button
              className="scan-action-btn scan-camera-btn"
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
            >
              <Icon name="camera" size={20} />
              <span>Camera</span>
            </button>
            <button
              className="scan-action-btn scan-gallery-btn"
              onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}
            >
              <Icon name="image-upload" size={20} />
              <span>Gallery</span>
            </button>
          </div>

          <p className="scan-format-hint">Supports: JPG, PNG, WebP · Max 15 MB</p>

          {error && (
            <div className="scan-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* ── UPLOADING / ANALYZING ────────────────────────────── */}
      {(status === "uploading" || status === "analyzing") && (
        <div className="card scan-card">
          {imagePreview && (
            <div className="scan-preview-container">
              <img src={imagePreview} alt="Receipt preview" className="scan-preview-img" />
              <div className="scan-preview-overlay" />
            </div>
          )}
          <div className="scan-progress-section">
            <div className="scan-progress-bar">
              <div className={`scan-progress-fill ${status === "analyzing" ? "analyzing" : ""}`} />
            </div>
            <p className="scan-progress-text">
              {status === "uploading" ? "Uploading image..." : "AI is analyzing your document..."}
            </p>
          </div>
        </div>
      )}

      {/* ── PREVIEW: Extracted Data ──────────────────────────── */}
      {status === "preview" && scanResult && (
        <div className="card scan-card">
          {/* Header with merchant + confidence */}
          <div className="scan-result-header">
            <div className="scan-result-info">
              <div className="scan-result-icon">
                <Icon name="file-text" size={24} />
              </div>
              <div>
                <p className="scan-merchant">{scanResult.merchant_name || "Document"}</p>
                <p className="scan-doc-type">
                  {scanResult.document_type === "salary_slip" ? "Salary Slip" :
                   scanResult.document_type === "receipt" ? "Receipt" :
                   scanResult.document_type === "invoice" ? "Invoice" :
                   scanResult.document_type === "bill" ? "Bill" : "Document"}
                </p>
              </div>
            </div>
            <div
              className="scan-confidence"
              style={{ color: SCAN_CONFIDENCE_COLORS[scanResult.confidence] || SCAN_CONFIDENCE_COLORS.medium }}
            >
              <span className="scan-confidence-dot" style={{ background: SCAN_CONFIDENCE_COLORS[scanResult.confidence] || SCAN_CONFIDENCE_COLORS.medium }} />
              {scanResult.confidence === "high" ? "High" : scanResult.confidence === "medium" ? "Medium" : "Low"} confidence
            </div>
          </div>

          {/* Items breakdown (if any) */}
          {scanResult.items && scanResult.items.length > 0 && (
            <div className="scan-items-section">
              <p className="scan-section-label">Items Detected</p>
              <div className="scan-items-list">
                {scanResult.items.map((item, i) => (
                  <div key={i} className="scan-item-row">
                    <span className="scan-item-name">
                      {item.name}
                      {item.quantity > 1 && <span className="scan-item-qty"> ×{item.quantity}</span>}
                    </span>
                    <span className="scan-item-price">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="scan-totals">
                {scanResult.subtotal != null && (
                  <div className="scan-total-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(scanResult.subtotal)}</span>
                  </div>
                )}
                {scanResult.tax != null && scanResult.tax > 0 && (
                  <div className="scan-total-row">
                    <span>Tax</span>
                    <span>{formatCurrency(scanResult.tax)}</span>
                  </div>
                )}
                <div className="scan-total-row scan-grand-total">
                  <span>Total</span>
                  <span>{formatCurrency(scanResult.total_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Salary details (if salary slip) */}
          {scanResult.salary_details && (
            <div className="scan-salary-section">
              <p className="scan-section-label">Salary Breakdown</p>
              <div className="scan-salary-grid">
                {scanResult.salary_details.employer_name && (
                  <div className="scan-salary-row full-width">
                    <span className="scan-salary-label">Employer</span>
                    <span className="scan-salary-value">{scanResult.salary_details.employer_name}</span>
                  </div>
                )}
                <div className="scan-salary-group">
                  <p className="scan-salary-group-title">Earnings</p>
                  {scanResult.salary_details.basic_salary != null && (
                    <div className="scan-salary-row"><span>Basic</span><span>{formatCurrency(scanResult.salary_details.basic_salary)}</span></div>
                  )}
                  {scanResult.salary_details.hra != null && (
                    <div className="scan-salary-row"><span>HRA</span><span>{formatCurrency(scanResult.salary_details.hra)}</span></div>
                  )}
                  {scanResult.salary_details.da != null && (
                    <div className="scan-salary-row"><span>DA</span><span>{formatCurrency(scanResult.salary_details.da)}</span></div>
                  )}
                  {scanResult.salary_details.other_allowances != null && (
                    <div className="scan-salary-row"><span>Other Allowances</span><span>{formatCurrency(scanResult.salary_details.other_allowances)}</span></div>
                  )}
                </div>
                <div className="scan-salary-group">
                  <p className="scan-salary-group-title">Deductions</p>
                  {scanResult.salary_details.pf_deduction != null && (
                    <div className="scan-salary-row"><span>PF</span><span className="deduction">−{formatCurrency(scanResult.salary_details.pf_deduction)}</span></div>
                  )}
                  {scanResult.salary_details.tax_deduction != null && (
                    <div className="scan-salary-row"><span>Tax</span><span className="deduction">−{formatCurrency(scanResult.salary_details.tax_deduction)}</span></div>
                  )}
                  {scanResult.salary_details.other_deductions != null && (
                    <div className="scan-salary-row"><span>Other</span><span className="deduction">−{formatCurrency(scanResult.salary_details.other_deductions)}</span></div>
                  )}
                </div>
                {scanResult.salary_details.net_salary != null && (
                  <div className="scan-salary-row scan-salary-net">
                    <span>Net Salary</span>
                    <span>{formatCurrency(scanResult.salary_details.net_salary)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editable transaction fields */}
          <div className="scan-edit-section">
            <p className="scan-section-label">Transaction Details</p>

            {error && (
              <div className="scan-error" style={{ marginBottom: 12 }}>
                <span>⚠</span> {error}
              </div>
            )}

            <div className="scan-edit-grid">
              {/* Type */}
              <div className="scan-edit-field">
                <label>Type</label>
                <select
                  value={editType}
                  onChange={(e) => { setEditType(e.target.value); setEditCategory(""); }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Category */}
              <div className="scan-edit-field">
                <label>Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="scan-edit-field">
                <label>Amount</label>
                <div className="scan-amount-input">
                  <span className="scan-currency-symbol">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="scan-edit-field">
                <label>Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              {/* Description (full width) */}
              <div className="scan-edit-field scan-edit-full">
                <label>Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="scan-actions">
            <button className="scan-rescan-btn" onClick={handleRescan}>
              <Icon name="refresh" size={16} />
              Re-scan
            </button>
            <button
              className={`scan-save-btn ${editType === "income" ? "income" : "expense"}`}
              onClick={handleSave}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving..." : `Save ${editType === "income" ? "Income" : "Expense"} →`}
            </button>
          </div>
        </div>
      )}

      {/* ── DONE ─────────────────────────────────────────────── */}
      {status === "done" && (
        <div className="card scan-card scan-done-card">
          <div className="scan-done-icon">
            <Icon name="check-circle" size={48} />
          </div>
          <p className="scan-done-title">Transaction Saved!</p>
          <p className="scan-done-sub">Your scanned transaction has been added.</p>
          <div className="scan-done-actions">
            <button className="scan-action-btn" onClick={handleRescan}>Scan Another</button>
            <button className="scan-action-btn scan-go-dashboard" onClick={() => navigate("dashboard")}>Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
