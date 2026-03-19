import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { BILL_ACCOUNTS, PAY_TERMS } from "../shared/constants";
import { addDays, fmtCur, downloadFromSasUrl, buildDownloadFilename } from "../shared/utils";
import { Inp, Btn, Alert, Mdl, MultiFileUp } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateBill, uploadVendorBill, removeBillDocument, getBillDocument } from "../shared/api/bill";
import { getTaxConfigs } from "../shared/api/taxConfig";
import type { Bill, BillLineItem, TaxConfig, UploadedDocument } from "../types";

const cellCompact = { marginBottom: 0 };

interface BillItemRow {
  id: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  gstConfigId: string;
}

const defaultItemRow = (): BillItemRow => ({
  id: crypto.randomUUID(),
  description: "",
  account: "",
  quantity: 1,
  rate: 0,
  gstConfigId: "",
});

function toItemRow(li: BillLineItem): BillItemRow {
  return {
    id: crypto.randomUUID(),
    description: li.description,
    account: li.account ?? "",
    quantity: li.quantity,
    rate: li.rate,
    gstConfigId: li.gstConfigId ?? "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 18px", border: `1px solid ${C.border}`, borderRadius: "10px", marginBottom: "16px", background: "#fff" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 600, color: C.primary, margin: "0 0 12px", paddingBottom: "8px", borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function BillEditModal() {
  const { mdl, setMdl, t } = useAppContext();
  const bill = mdl?.t === "bill-edit" && mdl.d && "vName" in mdl.d ? (mdl.d as Bill) : null;

  const [vendorBillNumber, setVendorBillNumber] = useState("");
  const [bd, setBd] = useState("");
  const [trm, setTrm] = useState("net30");
  const [tds, setTds] = useState("none");
  const [items, setItems] = useState<BillItemRow[]>([defaultItemRow()]);
  const [desc, setDesc] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [rounding, setRounding] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [gstOptions, setGstOptions] = useState<TaxConfig[]>([]);
  const [tdsOptions, setTdsOptions] = useState<TaxConfig[]>([]);
  const [tdsLoading, setTdsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTaxConfigs()
      .then((configs) => {
        setGstOptions(configs.filter((c) => c.type === "GST" && c.isActive));
        setTdsOptions(configs.filter((c) => c.type === "TDS" && c.isActive));
      })
      .catch(() => { setGstOptions([]); setTdsOptions([]); })
      .finally(() => setTdsLoading(false));
  }, []);

  useEffect(() => {
    if (bill) {
      setVendorBillNumber(bill.vendorBillNumber ?? "");
      setBd(bill.bDate ?? "");
      setTrm(bill.terms || "net30");
      setTds(bill.tds || "none");
      setDesc(bill.desc);
      setDiscountPct(String(bill.discountPercent ?? 0));
      setRounding(String(bill.rounding ?? 0));
      setDocuments(bill.documents ?? []);
      if (bill.lineItems && bill.lineItems.length > 0) {
        setItems(bill.lineItems.map(toItemRow));
      } else {
        setItems([defaultItemRow()]);
      }
    }
  }, [bill]);

  const addItemRow = () => setItems((prev) => [...prev, defaultItemRow()]);
  const removeItemRow = (id: string) => setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const updateItemRow = (id: string, field: keyof BillItemRow, value: string | number) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const subTotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
  const itemTaxAmount = items.reduce((sum, it) => {
    const lineAmt = it.quantity * it.rate;
    const gst = gstOptions.find((g) => g.id === it.gstConfigId);
    return sum + (lineAmt * (gst?.rate ?? 0)) / 100;
  }, 0);
  const discountVal = (parseFloat(discountPct) || 0) / 100;
  const discountAmount = subTotal * discountVal;
  const roundingVal = parseFloat(rounding) || 0;
  const totalBeforeTds = subTotal + itemTaxAmount - discountAmount + roundingVal;
  const hasValidItems = items.some((it) => it.description.trim() && it.quantity > 0 && it.rate >= 0);

  const due = bd ? addDays(bd, PAY_TERMS.find((x) => x.v === trm)?.d || 30) : "";
  const tx = tdsOptions.find((x) => x.id === tds);
  const tdsRate = tx?.rate || 0;
  const tdsA = Math.round((totalBeforeTds * tdsRate) / 100);

  const accountOpts = [{ v: "", l: "Select Account" }, ...BILL_ACCOUNTS.map((a) => ({ v: a.v, l: a.l }))];
  const gstOpts = [{ v: "", l: "Select Tax" }, ...gstOptions.map((g) => ({ v: g.id, l: `${g.name} [${g.rate}%]` }))];

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    if (!bill?.apiId) return;
    try {
      const sasUrl = await getBillDocument(bill.apiId, documentId);
      if (!sasUrl) {
        t("Failed to download attachment");
        return;
      }
      await downloadFromSasUrl(
        sasUrl,
        buildDownloadFilename(bill.vendorBillNumber || bill.id, fileName, ".pdf"),
        () => t("Failed to download attachment")
      );
    } catch {
      t("Failed to download attachment");
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!bill?.apiId || documents.length <= 1) return;
    setRemoveLoading(true);
    try {
      await removeBillDocument(bill.apiId, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      t("Document removed");
    } catch (err) {
      t(err instanceof Error ? err.message : "Failed to remove document");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bill?.apiId) return;
    if (!hasValidItems) {
      setError("Add at least one item with description, quantity and rate");
      return;
    }
    if (!vendorBillNumber.trim() || !desc.trim() || !bd) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const billDate = new Date(bd).toISOString();
      const dueDate = due ? new Date(due).toISOString() : billDate;
      const validItems = items
        .filter((it) => it.description.trim() && it.quantity > 0 && it.rate >= 0)
        .map((it) => ({
          description: it.description.trim(),
          account: it.account || undefined,
          quantity: it.quantity,
          rate: it.rate,
          gstConfigId: it.gstConfigId || undefined,
        }));
      await updateBill(bill.apiId, {
        vendorBillNumber: vendorBillNumber.trim(),
        billDate,
        dueDate,
        paymentTerms: trm,
        taxConfigId: tds === "none" ? null : tds,
        ccEmails: "",
        amount: totalBeforeTds,
        description: desc,
        discountPercent: parseFloat(discountPct) || 0,
        rounding: roundingVal,
        items: validItems,
      });
      if (uploadFiles.length > 0) {
        const formData = new FormData();
        uploadFiles.forEach((f) => formData.append("Attachments", f));
        await uploadVendorBill(bill.apiId, formData);
      }
      window.dispatchEvent(new CustomEvent("bills-refresh"));
      t("Bill updated");
      setMdl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update bill");
    } finally {
      setLoading(false);
    }
  };

  if (!bill) return null;

  return (
    <Mdl open close={() => setMdl(null)} title={`Edit bill — ${bill.vendorBillNumber || bill.id}`} w maxWidth="960px">
      <Section title="Vendor & Bill Info">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ gridColumn: "1 / -1", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
            <span style={{ color: C.muted }}>Vendor</span> <strong>{bill.vName}</strong> {bill.vGst && <span style={{ color: C.muted }}>· {bill.vGst}</span>}
          </div>
          <Inp label="Vendor bill number" value={vendorBillNumber} onChange={(e) => setVendorBillNumber(e.target.value)} req ph="Enter vendor bill number" style={cellCompact} />
          <Inp label="Bill date" type="date" value={bd} onChange={(e) => setBd(e.target.value)} max={new Date().toISOString().split("T")[0]} req style={cellCompact} />
          <Inp label="Payment terms" type="select" value={trm} onChange={(e) => setTrm(e.target.value)} opts={PAY_TERMS.map((x) => ({ v: x.v, l: x.l }))} style={cellCompact} />
          {due && (
            <div style={{ fontSize: "12px", color: C.muted, alignSelf: "center" }}>
              📅 Due date: <strong>{due}</strong>
            </div>
          )}
        </div>
      </Section>

      <Section title="Items (required)">
        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Add at least one item</span>
          <Btn sm v="vendor" onClick={addItemRow}>＋ Add New Row</Btn>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "780px", borderCollapse: "collapse", fontSize: "12px", border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted }}>Item Details</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted }}>Account</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, fontSize: "11px", color: C.muted }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px", color: C.muted }}>Rate</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted }}>Tax</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px", color: C.muted }}>Amount</th>
                <th style={{ padding: "10px 8px", width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const lineAmt = row.quantity * row.rate;
                const gst = gstOptions.find((g) => g.id === row.gstConfigId);
                const taxAmt = (lineAmt * (gst?.rate ?? 0)) / 100;
                const rowTotal = lineAmt + taxAmt;
                return (
                  <tr key={row.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px" }}>
                      <input type="text" value={row.description} onChange={(e) => updateItemRow(row.id, "description", e.target.value)} placeholder="Item name / description" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Inp label="" type="select" value={row.account} onChange={(e) => updateItemRow(row.id, "account", e.target.value)} opts={accountOpts} style={cellCompact} />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <input type="number" min="0" step="0.01" value={row.quantity || ""} onChange={(e) => updateItemRow(row.id, "quantity", parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", textAlign: "center", boxSizing: "border-box" }} />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <input type="number" min="0" step="0.01" value={row.rate ?? ""} onChange={(e) => updateItemRow(row.id, "rate", parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px", textAlign: "right", boxSizing: "border-box" }} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Inp label="" type="select" value={row.gstConfigId} onChange={(e) => updateItemRow(row.id, "gstConfigId", e.target.value)} opts={gstOpts} style={cellCompact} />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500 }}>{fmtCur(rowTotal)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      <button type="button" onClick={() => removeItemRow(row.id)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 4 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Summary">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Inp label="Discount %" type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} min="0" max="100" ph="0" style={cellCompact} />
            <Inp label="Rounding (₹)" type="number" value={rounding} onChange={(e) => setRounding(e.target.value)} ph="0" hint="Adjust total (e.g. -0.5 to round down)" style={cellCompact} />
            <Inp
              label="TDS"
              type="select"
              value={tds}
              onChange={(e) => setTds(e.target.value)}
              disabled={tdsLoading}
              opts={[{ v: "none", l: tdsLoading ? "Loading..." : "No TDS" }, ...tdsOptions.map((x) => ({ v: x.id, l: `${x.name} (${x.rate}%) — ${x.section}` }))]}
              style={cellCompact}
            />
          </div>
          <div style={{ padding: "14px 16px", background: `${C.vendor}08`, borderRadius: "8px", fontSize: "12px", border: `1px solid ${C.vendor}20` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: C.muted }}>Sub Total</span><span style={{ fontWeight: 600 }}>{fmtCur(subTotal)}</span></div>
            {totalQty > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px", color: C.muted }}><span>Total Quantity</span><span>{totalQty}</span></div>}
            {discountPct && parseFloat(discountPct) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: C.muted }}>Discount ({discountPct}%)</span><span style={{ color: C.success }}>-{fmtCur(discountAmount)}</span></div>}
            {itemTaxAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: C.muted }}>Tax</span><span style={{ fontWeight: 600 }}>{fmtCur(itemTaxAmount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: C.muted }}>Rounding</span><span style={{ fontWeight: 600 }}>{roundingVal >= 0 ? "+" : ""}{fmtCur(roundingVal)}</span></div>
            <div style={{ borderTop: `1px solid ${C.vendor}30`, paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: C.vendor }}>Total</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: C.vendor }}>{fmtCur(totalBeforeTds)}</span>
            </div>
            {tdsRate > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", marginBottom: "4px", color: C.danger }}>
                  <span>TDS ({tx?.section} @ {tdsRate}%)</span>
                  <span style={{ fontWeight: 600 }}>-{fmtCur(tdsA)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: C.vendor }}>
                  <span>Payable</span>
                  <span>{fmtCur(totalBeforeTds - tdsA)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Section>

      <Section title="Notes & Attachments">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Inp label="Description / Notes" type="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} req ph="Goods/services..." style={cellCompact} />
          {documents.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", color: C.muted, marginBottom: "6px", fontWeight: 600 }}>Current attachments</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {documents.map((document) => (
                  <div key={document.id} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "8px 10px", background: C.surface, borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>📎 {document.name}</span>
                    <span style={{ fontSize: "10px", color: C.muted }}>{document.sizeLabel}</span>
                    <span style={{ fontSize: "10px", color: C.muted }}>{document.uploadedAt}</span>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                      <Btn sm v="secondary" onClick={() => handleDocumentDownload(document.id, document.name)}>Download</Btn>
                      <button
                        type="button"
                        title={documents.length <= 1 ? "Keep at least one document" : "Remove"}
                        onClick={() => handleRemoveDocument(document.id)}
                        disabled={removeLoading || documents.length <= 1}
                        style={{ background: "none", border: "none", cursor: removeLoading || documents.length <= 1 ? "not-allowed" : "pointer", color: documents.length <= 1 ? C.muted : C.danger, fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: C.vendor, marginBottom: "8px" }}>Add more documents (PDF, optional)</div>
            <MultiFileUp files={uploadFiles} onChange={setUploadFiles} accept=".pdf" hint="PDF only" title="Documents" />
          </div>
        </div>
      </Section>

      {error && <Alert sx={{ marginBottom: "16px" }}>{error}</Alert>}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>Cancel</Btn>
        <Btn v="vendor" onClick={handleSave} disabled={!hasValidItems || !desc.trim() || !vendorBillNumber.trim() || !bd || loading}>
          {loading ? "Saving…" : "Save changes"}
        </Btn>
      </div>
    </Mdl>
  );
}
