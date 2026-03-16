import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { PAY_TERMS, CURRENCIES } from "../shared/constants";
import { addDays, fmtCur } from "../shared/utils";
import { Inp, Btn, Toggle } from "../components/ui";
import { AsyncSelectInput } from "../components/AsyncSelectInput";
import { createInvoice } from "../shared/api/invoice";
import { getClients } from "../shared/api/clients";
import { getTaxConfigs } from "../shared/api/taxConfig";
import type { Client, TaxConfig } from "../types";
import type { CreateInvoiceLineItem } from "../shared/api/invoice";

const GRID_BREAKPOINT = 600;

const defaultLineItem: CreateInvoiceLineItem = {
  description: "",
  hsnCode: "998314",
  quantity: 1,
  rate: 0,
  gstConfigId: "",
};

export default function InvoiceAddPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [gstConfigs, setGstConfigs] = useState<TaxConfig[]>([]);
  const [tdsConfigs, setTdsConfigs] = useState<TaxConfig[]>([]);
  const [clientId, setClientId] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [lineItems, setLineItems] = useState<CreateInvoiceLineItem[]>([{ ...defaultLineItem }]);
  const [taxConfigId, setTaxConfigId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [notes, setNotes] = useState("");
  const [etc, setEtc] = useState("");
  const [sendImmediately, setSendImmediately] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [taxLoading, setTaxLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);

  const dueDate = addDays(invoiceDate, PAY_TERMS.find((x) => x.v === paymentTerms)?.d ?? 30);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadClientOptions = useCallback(async (query: string) => {
    try {
      const all = await getClients();
      const q = query.trim().toLowerCase();
      const filtered = q
        ? all.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.email && c.email.toLowerCase().includes(q)) ||
              (c.contact && c.contact.toLowerCase().includes(q))
          )
        : all;
      return filtered.slice(0, 50).map((c) => ({
        value: c.id,
        label: `${c.name} (${c.currency || "INR"})`,
      }));
    } catch {
      return [];
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, []);

  useEffect(() => {
    getTaxConfigs()
      .then((configs) => {
        setGstConfigs(configs.filter((c) => c.type === "GST" && c.isActive));
        setTdsConfigs(configs.filter((c) => c.type === "TDS" && c.isActive));
      })
      .catch(() => {
        setGstConfigs([]);
        setTdsConfigs([]);
      })
      .finally(() => setTaxLoading(false));
  }, []);

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...defaultLineItem }]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const updateLineItem = (idx: number, field: keyof CreateInvoiceLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const subTotal = lineItems.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  const selectedClient = clients.find((c) => c.id === clientId);
  const clientCurrency = selectedClient?.currency || currency;
  const selectedTds = tdsConfigs.find((t) => t.id === taxConfigId);
  const tdsRate = selectedTds?.rate ?? 0;
  const tdsAmount = Math.round((subTotal * tdsRate) / 100);
  const totalAfterTds = subTotal - tdsAmount;

  const validLineItems = lineItems.filter(
    (it) => it.description.trim() && it.gstConfigId && it.quantity > 0 && it.rate >= 0
  );
  const hasValidLineItems = validLineItems.length > 0;
  const canSubmit =
    !!clientId.trim() &&
    !!currency.trim() &&
    !!invoiceNumber.trim() &&
    !!taxConfigId.trim() &&
    !!invoiceDate &&
    !!purchaseOrder.trim() &&
    hasValidLineItems;

  const handleSubmit = async () => {
    setError(null);
    if (!clientId.trim()) {
      setError("Please select a client");
      return;
    }
    if (!currency.trim()) {
      setError("Currency is required");
      return;
    }
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required");
      return;
    }
    if (!taxConfigId.trim()) {
      setError("TDS is required");
      return;
    }
    if (!hasValidLineItems) {
      setError("Add at least one line item with description, Tax, quantity and rate");
      return;
    }
    if (!invoiceDate) {
      setError("Invoice date is required");
      return;
    }
    if (!purchaseOrder.trim()) {
      setError("Purchase order is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createInvoice({
        clientId,
        currency: clientCurrency,
        lineItems: validLineItems.map((it) => ({
          description: it.description.trim(),
          hsnCode: it.hsnCode.trim() || "998314",
          quantity: it.quantity,
          rate: it.rate,
          gstConfigId: it.gstConfigId,
        })),
        taxConfigId: taxConfigId.trim() || "",
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        paymentTerms,
        purchaseOrder: purchaseOrder.trim(),
        notes: notes.trim(),
        sendImmediately,
        invoiceNumber: invoiceNumber.trim(),
        etc: etc.trim() || undefined,
      });
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
      navigate("/invoices");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };
  const fullWidth = { gridColumn: "1 / -1" as const };
  const cellStyle = { marginBottom: 0 };

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>
        <span style={{ color: C.invoice }}>📄</span> Create invoice
      </h1>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={gridStyle}>
          <div style={cellStyle}>
            <AsyncSelectInput
              label="Client"
              value={clientId}
              onChange={(val) => {
                setClientId(val);
                const c = clients.find((x) => x.id === val);
                if (c?.currency) setCurrency(c.currency);
              }}
              loadOptions={loadClientOptions}
              disabled={clientsLoading || loading}
              placeholder="Search clients..."
            />
          </div>
          <Inp
            label="Currency"
            type="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            req
            showReqStar={false}
            opts={CURRENCIES.map((c) => ({ v: c.v, l: c.l }))}
            style={cellStyle}
          />
          <Inp
            label="Invoice number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            req
            showReqStar={false}
            ph="e.g. INV-001"
            style={cellStyle}
          />
          <Inp
            label="TDS"
            type="select"
            value={taxConfigId}
            onChange={(e) => setTaxConfigId(e.target.value)}
            req
            showReqStar={false}
            disabled={taxLoading}
            opts={[
              { v: "", l: taxLoading ? "Loading..." : "Select TDS..." },
              ...tdsConfigs.map((t) => ({ v: t.id, l: `${t.name} (${t.rate}%)` })),
            ]}
            style={cellStyle}
          />

          <div style={{ ...fullWidth, marginTop: "4px", marginBottom: "4px" }}>
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
              <span>Line items (at least one required)</span>
              <Btn sm v="invoice" onClick={addLineItem}>
                ＋ Add line
              </Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "640px",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "100px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "44px" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: C.surface }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle" }}>Description</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle" }}>HSN</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle" }}>Qty</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle" }}>Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle" }}>Tax</th>
                    <th style={{ padding: "10px 8px", verticalAlign: "middle" }} />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          placeholder="Description"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            lineHeight: "1.25",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => updateLineItem(idx, "hsnCode", e.target.value)}
                          placeholder="998314"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            lineHeight: "1.25",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "center" }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            lineHeight: "1.25",
                            textAlign: "center",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate || ""}
                          onChange={(e) => updateLineItem(idx, "rate", parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            lineHeight: "1.25",
                            textAlign: "right",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                        <select
                          value={item.gstConfigId}
                          onChange={(e) => updateLineItem(idx, "gstConfigId", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: `1px solid ${C.border}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            lineHeight: "1.25",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">Select Tax</option>
                          {gstConfigs.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.rate}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "10px 8px", verticalAlign: "middle", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.danger,
                            cursor: "pointer",
                            fontSize: "16px",
                            lineHeight: 1,
                            padding: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Inp
            label="Invoice date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            req
            showReqStar={false}
            style={cellStyle}
          />
          <Inp
            label="Payment terms"
            type="select"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            opts={PAY_TERMS.map((x) => ({ v: x.v, l: x.l }))}
            style={cellStyle}
          />
          {dueDate && (
            <div style={{ ...fullWidth, fontSize: "12px", color: C.muted }}>
              📅 Due date: <strong>{dueDate}</strong>
            </div>
          )}
          <Inp
            label="Purchase order"
            value={purchaseOrder}
            onChange={(e) => setPurchaseOrder(e.target.value)}
            req
            showReqStar={false}
            ph="PO reference"
            style={cellStyle}
          />
          <Inp
            label="Etc"
            value={etc}
            onChange={(e) => setEtc(e.target.value)}
            ph="Other / etc"
            style={cellStyle}
          />
          <Inp
            label="Notes"
            type="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            ph="Additional notes..."
            style={{ ...cellStyle, ...fullWidth }}
          />

          <div style={{ ...fullWidth, display: "flex", alignItems: "center", gap: "8px" }}>
            <Toggle checked={sendImmediately} onChange={setSendImmediately} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: C.primary,
              }}
            >
              Send immediately
            </span>
          </div>

          {subTotal > 0 && (
            <div
              style={{
                ...fullWidth,
                padding: "12px 14px",
                background: `${C.invoice}08`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: C.muted }}>Sub total</span>
                <span style={{ fontWeight: 600 }}>{fmtCur(subTotal, clientCurrency)}</span>
              </div>
              {tdsRate > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: C.danger }}>
                  <span>TDS ({selectedTds?.section ?? ""} @ {tdsRate}%)</span>
                  <span style={{ fontWeight: 600 }}>-{fmtCur(tdsAmount, clientCurrency)}</span>
                </div>
              )}
              <div
                style={{
                  borderTop: `1px solid ${C.invoice}20`,
                  paddingTop: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 700, color: C.invoice }}>Total</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: C.invoice }}>{fmtCur(totalAfterTds, clientCurrency)}</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ ...fullWidth, color: C.danger, fontSize: "12px" }}>{error}</div>
          )}

          <div style={{ ...fullWidth, display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Btn v="secondary" onClick={() => navigate("/invoices")} disabled={loading}>
              Cancel
            </Btn>
            <Btn v="invoice" onClick={handleSubmit} disabled={!canSubmit || loading}>
              {loading ? "Creating..." : "Create invoice"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
