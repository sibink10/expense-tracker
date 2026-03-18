import { useState } from "react";
import { C } from "../../shared/theme";
import { EXP_S } from "../../shared/constants";
import { fmtCur, downloadFromSasUrl, buildDownloadFilename } from "../../shared/utils";
import { Btn, Badge, Mdl, CLog, Inp, FileUp, Alert } from "../ui";
import { EditIcon } from "../icons";
import { useAppContext } from "../../context/AppContext";
import { updateExpenseForm, uploadExpenseBill, getExpenseBill } from "../../shared/api/expense";
import type { Expense } from "../../types";

interface Props {
  expense: Expense;
}

export default function ExpenseDetailModal({ expense: e }: Props) {
  const { setMdl, is, t } = useAppContext();
  const isApprover = is("approver");
  const isAdmin = is("admin");
  const isFinance = is("finance");
  const hasBill = !!(e.file || e.attachmentUrl);
  const isPending = e.status === EXP_S.PENDING || e.status === EXP_S.PENDING_BILL_APPROVAL;
  const canApproveReject =
    (e.status === EXP_S.PENDING && (isApprover || isAdmin)) ||
    (e.status === EXP_S.PENDING_BILL_APPROVAL && (isFinance || isAdmin));
  const showBillUploadPanel = e.status === EXP_S.AWAITING_BILL && !e.file && !e.attachmentUrl;

  const [editing, setEditing] = useState(false);
  const [amt, setAmt] = useState(String(e.amt));
  const [pur, setPur] = useState(e.purpose);
  const [billDate, setBillDate] = useState(e.billDate ?? "");
  const [billFile, setBillFile] = useState<{ n: string; s: string } | null>(null);
  const [billFileRaw, setBillFileRaw] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billSidebarOpen, setBillSidebarOpen] = useState(false);
  const [billViewUrl, setBillViewUrl] = useState<string | null>(null);
  const [billViewLoading, setBillViewLoading] = useState(false);
  const billViewerUrl = billViewUrl ? `${billViewUrl}#toolbar=0&navpanes=0&zoom=page-width` : null;

  const openBillView = async () => {
    const id = e.apiId ?? e.id;
    setBillViewLoading(true);
    setBillViewUrl(null);
    try {
      const url = await getExpenseBill(id);
      if (url) {
        setBillViewUrl(url);
        setBillSidebarOpen(true);
      } else {
        t("Failed to load bill");
      }
    } catch {
      t("Failed to load bill");
    } finally {
      setBillViewLoading(false);
    }
  };

  const closeBillSidebar = () => {
    setBillViewUrl(null);
    setBillSidebarOpen(false);
  };

  const handleDownloadBill = async () => {
    const id = e.apiId ?? e.id;
    const sasUrl = await getExpenseBill(id);
    if (!sasUrl) {
      t("Failed to download bill");
      return;
    }
    await downloadFromSasUrl(
      sasUrl,
      buildDownloadFilename(e.billNumber || e.id, e.file?.n, ".pdf"),
      () => t("Failed to download bill")
    );
  };


  const handleUpdate = async () => {
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0 || !pur.trim() || !billDate) {
      setError("Please fill all fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = e.apiId ?? e.id;
      const formData = new FormData();
      formData.append("Amount", String(amount));
      formData.append("Purpose", pur.trim());
      formData.append("BillDate", billDate);
      if (billFileRaw) formData.append("BillImage", billFileRaw);
      await updateExpenseForm(id, formData);
      t("Expense updated");
      window.dispatchEvent(new CustomEvent("expenses-refresh"));
      setEditing(false);
      setMdl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBill = async () => {
    if (!billFileRaw) return;
    setLoading(true);
    setError(null);
    try {
      const id = e.apiId ?? e.id;
      const formData = new FormData();
      formData.append("BillImage", billFileRaw);
      await uploadExpenseBill(id, formData);
      t("Bill uploaded");
      window.dispatchEvent(new CustomEvent("expenses-refresh"));
      setMdl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload bill");
    } finally {
      setLoading(false);
    }
  };

  const canUpdate = amt.trim() !== "" && pur.trim() !== "" && billDate !== "";

  return (
    <Mdl open close={() => setMdl(null)} title={e.id} w>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: C.muted }}>Employee</div>
          <div style={{ fontWeight: 600, fontSize: "13px" }}>{e.empName} · {e.dept}</div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: C.muted }}>Amount</div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{fmtCur(e.amt)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}><Badge s={e.status} /></div>
      </div>

      {/* Bill # & Bill date: view or edit inline */}
      {(e.billNumber != null || e.billDate || isPending) && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px", fontSize: "12px", alignItems: "flex-start" }}>
          {!editing ? (
            <>
              {e.billNumber != null && (
                <div>
                  <span style={{ color: C.muted }}>Bill #</span> <span style={{ fontWeight: 600 }}>{e.billNumber}</span>
                </div>
              )}
              {e.billDate && (
                <div>
                  <span style={{ color: C.muted }}>Bill date</span> <span style={{ fontWeight: 600 }}>{e.billDate}</span>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {isPending && editing && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <Inp
              label="Amount"
              type="number"
              value={amt}
              onChange={(ev) => setAmt(ev.target.value)}
              min="1"
              req
              style={{ marginBottom: 0, flex: "1 1 160px" }}
            />
            <Inp
              label="Bill date"
              type="date"
              value={billDate}
              onChange={(ev) => setBillDate(ev.target.value)}
              max={new Date().toISOString().split("T")[0]}
              req
              style={{ marginBottom: 0, flex: "1 1 160px" }}
            />
          </div>
        </div>
      )}

      {/* Purpose: view or edit */}
      <div style={{ marginBottom: "12px" }}>
        {isPending && editing ? (
          <Inp label="Purpose" type="textarea" value={pur} onChange={(ev) => setPur(ev.target.value)} req style={{ marginBottom: 0 }} />
        ) : (
          <>
            <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>Purpose</div>
            <div style={{ padding: "10px 14px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>{e.purpose}</div>
          </>
        )}
      </div>

      {/* Edit: optional file upload */}
      {isPending && editing && (
        <div style={{ marginBottom: "12px" }}>
          <FileUp
            file={billFile}
            onChange={(f) => { setBillFile(f); if (!f) setBillFileRaw(null); }}
            onFileSelect={setBillFileRaw}
            accept=".pdf"
            hint="PDF only (optional)"
          />
        </div>
      )}

      {/* Bill attachment: View (sidebar) + Download */}
      {hasBill && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>Bill attachment</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {e.file && (
              <span style={{ padding: "6px 10px", background: C.surface, borderRadius: "6px", fontSize: "11px" }}>
                📎 {e.file.n} ({e.file.s})
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <Btn sm v="secondary" onClick={openBillView} disabled={billViewLoading}>
                {billViewLoading ? "Loading…" : "View"}
              </Btn>
              <Btn sm v="secondary" onClick={handleDownloadBill}>Download</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Bill view sidebar */}
      {billSidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={closeBillSidebar}
            onKeyDown={(ev) => ev.key === "Escape" && closeBillSidebar()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(90vw, 560px)",
              background: "#fff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              zIndex: 1101,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Bill</span>
              <button
                type="button"
                onClick={closeBillSidebar}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, color: C.muted }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {billViewerUrl ? (
                <iframe
                  title="Bill document"
                  src={billViewerUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: C.muted }}>Loading…</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Inline upload panel when Awaiting bill and no image */}
      {showBillUploadPanel && (
        <div style={{ padding: "14px", background: C.surface, borderRadius: "8px", marginBottom: "12px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: C.primary, marginBottom: "10px" }}>Upload bill (PDF)</div>
          <FileUp
            file={billFile}
            onChange={(f) => { setBillFile(f); if (!f) setBillFileRaw(null); }}
            onFileSelect={setBillFileRaw}
            accept=".pdf"
            hint="PDF only"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <Btn
              onClick={handleUploadBill}
              disabled={!billFileRaw || loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </Btn>
          </div>
        </div>
      )}

      {error && <Alert sx={{ marginBottom: "12px" }}>{error}</Alert>}

      <CLog comments={e.comments} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div>
          {isPending && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Edit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                padding: 0,
                border: "none",
                borderRadius: "8px",
                background: "rgba(37, 99, 235, 0.1)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <EditIcon size={20} color="#2563eb" />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {isPending && editing && (
            <>
              <Btn onClick={handleUpdate} disabled={!canUpdate || loading}>
                {loading ? "Saving..." : "Save"}
              </Btn>
              <Btn v="secondary" onClick={() => { setEditing(false); setError(null); setAmt(String(e.amt)); setPur(e.purpose); setBillDate(e.billDate ?? ""); }}>Cancel</Btn>
            </>
          )}
          {canApproveReject && !editing && (
            <>
              <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "exp-approve", d: e }), 50); }}>Approve</Btn>
              <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: e, it: "expense" }), 50); }}>Reject</Btn>
            </>
          )}
          {(is("finance") || is("admin")) && e.status === EXP_S.APPROVED && (
            <Btn v="info" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "pay", d: e, it: "expense" }), 50); }}>Pay</Btn>
          )}
          {!(isPending || canApproveReject || ((isFinance || isAdmin) && e.status === EXP_S.APPROVED)) && (
            <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
          )}
        </div>
      </div>
    </Mdl>
  );
}
