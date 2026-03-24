import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { PAY_TERMS, BILL_ACCOUNTS, BILL_PAYMENT_PRIORITY, BILL_PAYMENT_PRIORITY_OPTIONS } from "../shared/constants";
import { addDays, fmtCur, round2, aggregateLineGstRows, formatTdsOptionLabel, formatTdsSummarySnippet } from "../shared/utils";
import { Inp, Btn, MultiFileUp, Alert } from "../components/ui";
import DecimalLineInput from "../components/DecimalLineInput";
import { AsyncSelectInput } from "../components/AsyncSelectInput";
import { useAppContext } from "../context/AppContext";
import { createBill } from "../shared/api/bill";
import { getVendors } from "../shared/api/vendor";
import { getTaxConfigs } from "../shared/api/taxConfig";
import type { TaxConfig } from "../types";

const GRID_BREAKPOINT = 600;
const cellCompact = { marginBottom: 0 };

function Section({
  title,
  children,
  style,
}: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        marginBottom: "16px",
        background: "#fff",
        ...style,
      }}
    >
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: C.primary,
          margin: "0 0 12px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${C.border}`,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export interface BillItemRow {
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

export default function SubmitBillPage() {
  const navigate = useNavigate();
  const { cfg, setCfg, t } = useAppContext();
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [tdsOptions, setTdsOptions] = useState<TaxConfig[]>([]);
  const [gstOptions, setGstOptions] = useState<TaxConfig[]>([]);
  const [vId, setVId] = useState("");
  const [vendorBillNumber, setVendorBillNumber] = useState("");
  const [items, setItems] = useState<BillItemRow[]>([defaultItemRow()]);
  const [desc, setDesc] = useState("");
  const [bd, setBd] = useState("");
  const [trm, setTrm] = useState("net30");
  const [paymentPriority, setPaymentPriority] = useState<string>(BILL_PAYMENT_PRIORITY.IMMEDIATE);
  const [tds, setTds] = useState("none");
  const [discountPct, setDiscountPct] = useState("");
  const [rounding, setRounding] = useState("");
  const [tdsLoading, setTdsLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadVendorOptions = useCallback(async (query: string) => {
    try {
      const res = await getVendors(1, 50, query);
      return res.items.map((v) => ({
        value: v.id,
        label: v.gstin?.trim() ? `${v.name} (${v.gstin})` : v.name,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    getTaxConfigs()
      .then((configs) => {
        setTdsOptions(configs.filter((c) => c.type === "TDS" && c.isActive));
        setGstOptions(configs.filter((c) => c.type === "GST" && c.isActive));
      })
      .catch(() => { setTdsOptions([]); setGstOptions([]); })
      .finally(() => setTdsLoading(false));
  }, []);

  const addItemRow = () => setItems((prev) => [...prev, defaultItemRow()]);
  const removeItemRow = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const updateItemRow = (id: string, field: keyof BillItemRow, value: string | number) =>
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

  const subTotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
  const lineGstRows = aggregateLineGstRows(items, gstOptions);
  const itemTaxAmount = round2(lineGstRows.reduce((s, r) => s + r.amount, 0));
  const discountVal = (parseFloat(discountPct) || 0) / 100;
  const discountAmount = subTotal * discountVal;
  const roundingVal = parseFloat(rounding) || 0;
  const totalBeforeTds = subTotal + itemTaxAmount - discountAmount + roundingVal;
  const hasValidItems = items.some((it) => it.description.trim() && it.quantity > 0 && it.rate >= 0);

  const due = bd ? addDays(bd, PAY_TERMS.find((x) => x.v === trm)?.d || 30) : "";
  const tx = tdsOptions.find((x) => x.id === tds);
  const tdsRate = tx?.rate || 0;
  const tdsA = Math.round((totalBeforeTds * tdsRate) / 100);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };
  const fullWidth = { gridColumn: "1 / -1" as const };

  const accountOpts = [
    { v: "", l: "Select Account" },
    ...BILL_ACCOUNTS.map((a) => ({ v: a.v, l: a.l })),
  ];
  const gstOpts = [
    { v: "", l: "Select Tax" },
    ...gstOptions.map((g) => ({ v: g.id, l: `${g.name} [${g.rate}%]` })),
  ];

  const handleSubmit = async () => {
    if (!hasValidItems) {
      setError("Add at least one item with description, quantity and rate");
      return;
    }
    if (!vId || !vendorBillNumber.trim() || !bd || files.length === 0) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const billDate = new Date(bd).toISOString();
      const dueDate = new Date(due).toISOString();
      const validItems = items
        .filter((it) => it.description.trim() && it.quantity > 0 && it.rate >= 0)
        .map((it) => ({
          description: it.description.trim(),
          account: it.account || undefined,
          quantity: it.quantity,
          rate: it.rate,
          gstConfigId: it.gstConfigId || undefined,
        }));
      await createBill(
        {
          vendorId: vId,
          vendorBillNumber: vendorBillNumber.trim(),
          amount: totalBeforeTds,
          taxConfigId: tds === "none" ? "" : tds,
          description: desc.trim(),
          billDate,
          dueDate,
          paymentTerms: trm,
          paymentPriority,
          ccEmails: "",
          discountPercent: parseFloat(discountPct) || 0,
          rounding: roundingVal,
          items: validItems,
        },
        files
      );
      setCfg((c) => ({ ...c, billSeq: c.billSeq + 1 }));
      window.dispatchEvent(new CustomEvent("bills-refresh"));
      t("Bill submitted");
      navigate("/bills");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit bill");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    hasValidItems &&
    !!vId &&
    !!vendorBillNumber.trim() &&
    !!bd &&
    files.length > 0 &&
    !loading;

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>
        <span style={{ color: C.vendor }}>📋</span> Submit vendor bill
      </h1>

      <Section title="Vendor & Bill Info">
        <div style={gridStyle}>
          <div style={cellCompact}>
            <AsyncSelectInput
              label="Vendor"
              value={vId}
              onChange={setVId}
              loadOptions={loadVendorOptions}
              disabled={loading}
              placeholder="Search vendors..."
            />
          </div>
          <Inp
            label="Vendor bill number"
            value={vendorBillNumber}
            onChange={(e) => setVendorBillNumber(e.target.value)}
            req
            ph="Enter vendor bill number"
            style={cellCompact}
          />
          <Inp
            label="Bill date"
            type="date"
            value={bd}
            onChange={(e) => setBd(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            req
            style={cellCompact}
          />
          <Inp
            label="Payment terms"
            type="select"
            value={trm}
            onChange={(e) => setTrm(e.target.value)}
            opts={PAY_TERMS.map((x) => ({ v: x.v, l: x.l }))}
            style={cellCompact}
          />
          <Inp
            label="Payment priority"
            type="select"
            value={paymentPriority}
            onChange={(e) => setPaymentPriority(e.target.value)}
            opts={BILL_PAYMENT_PRIORITY_OPTIONS.map((x) => ({ v: x.v, l: x.l }))}
            hint="When finance should process payment"
            style={cellCompact}
          />
          {due && (
            <div style={{ ...fullWidth, fontSize: "12px", color: C.muted }}>
              📅 Due date: <strong>{due}</strong>
            </div>
          )}
        </div>
      </Section>

      <Section title="Items (required)">
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: C.primary,
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Add at least one item</span>
          <Btn sm v="vendor" onClick={addItemRow}>
            ＋ Add New Row
          </Btn>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "780px",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "70px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "44px" }} />
            </colgroup>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Item Details</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Account</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Qty</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Rate</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tax</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Amount</th>
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
                    <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateItemRow(row.id, "description", e.target.value)}
                        placeholder="Item name / description"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          boxSizing: "border-box",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                      <Inp
                        label=""
                        type="select"
                        value={row.account}
                        onChange={(e) => updateItemRow(row.id, "account", e.target.value)}
                        opts={accountOpts}
                        style={cellCompact}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top", textAlign: "center" }}>
                      <DecimalLineInput
                        value={row.quantity}
                        min={0.01}
                        emptyFallback={1}
                        textAlign="center"
                        onChange={(v) => updateItemRow(row.id, "quantity", v)}
                        style={{ lineHeight: 1 }}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top", textAlign: "right" }}>
                      <DecimalLineInput
                        value={row.rate}
                        min={0}
                        emptyFallback={0}
                        textAlign="right"
                        onChange={(v) => updateItemRow(row.id, "rate", v)}
                        style={{ lineHeight: 1 }}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                      <Inp
                        label=""
                        type="select"
                        value={row.gstConfigId}
                        onChange={(e) => updateItemRow(row.id, "gstConfigId", e.target.value)}
                        opts={gstOpts}
                        style={cellCompact}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right", fontWeight: 500 }}>
                      {fmtCur(rowTotal)}
                    </td>
                    <td style={{ padding: "10px 8px", verticalAlign: "middle", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => removeItemRow(row.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.danger,
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                          padding: 4,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Summary">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Inp
              label="Discount %"
              type="number"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              min="0"
              max="100"
              ph="0"
              style={cellCompact}
            />
            <Inp
              label="Rounding (₹)"
              type="number"
              value={rounding}
              onChange={(e) => setRounding(e.target.value)}
              ph="0"
              hint="Adjust total (e.g. -0.5 to round down)"
              style={cellCompact}
            />
            <Inp
              label="TDS"
              type="select"
              value={tds}
              onChange={(e) => setTds(e.target.value)}
              disabled={tdsLoading}
              opts={[
                { v: "none", l: tdsLoading ? "Loading..." : "No TDS" },
                ...tdsOptions.map((x) => ({
                  v: x.id,
                  l: formatTdsOptionLabel(x.name, x.rate, x.section),
                })),
              ]}
              style={cellCompact}
            />
          </div>
          <div
            style={{
              padding: "14px 16px",
              background: `${C.vendor}08`,
              borderRadius: "8px",
              fontSize: "12px",
              border: `1px solid ${C.vendor}20`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: C.muted }}>Sub Total</span>
              <span style={{ fontWeight: 600 }}>{fmtCur(subTotal)}</span>
            </div>
            {totalQty > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px", color: C.muted }}>
                <span>Total Quantity</span>
                <span>{totalQty}</span>
              </div>
            )}
            {discountPct && parseFloat(discountPct) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: C.muted }}>Discount ({discountPct}%)</span>
                <span style={{ color: C.success }}>-{fmtCur(discountAmount)}</span>
              </div>
            )}
            {lineGstRows.map((row) => (
              <div key={row.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: C.muted }}>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{fmtCur(row.amount)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: C.muted }}>Rounding</span>
              <span style={{ fontWeight: 600 }}>{roundingVal >= 0 ? "+" : ""}{fmtCur(roundingVal)}</span>
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.vendor}30`,
                paddingTop: "8px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 700, color: C.vendor }}>Total</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: C.vendor }}>{fmtCur(totalBeforeTds)}</span>
            </div>
            {tdsRate > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", marginBottom: "4px", color: C.danger }}>
                  <span>TDS ({formatTdsSummarySnippet(tx?.section, tdsRate)})</span>
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
        <div style={gridStyle}>
          <Inp
            label="Description / Notes (optional)"
            type="textarea"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            ph="Goods/services (optional)…"
            style={{ ...cellCompact, ...fullWidth }}
          />
          <div style={fullWidth}>
            <MultiFileUp files={files} onChange={setFiles} req />
          </div>
        </div>
      </Section>

      {error && <Alert sx={{ marginBottom: "16px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn v="vendor" onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? "Submitting..." : "Submit bill"}
        </Btn>
      </div>
    </div>
  );
}
