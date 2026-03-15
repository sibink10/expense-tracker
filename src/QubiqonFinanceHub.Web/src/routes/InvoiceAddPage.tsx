import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { PAY_TERMS, CURRENCIES } from "../shared/constants";
import { addDays, fmtCur } from "../shared/utils";
import { Inp, Btn } from "../components/ui";
import { createInvoice } from "../shared/api/invoice";
import { getClients } from "../shared/api/clients";
import { getTaxConfigs } from "../shared/api/taxConfig";
import type { Client, TaxConfig } from "../types";
import type { CreateInvoiceLineItem } from "../shared/api/invoice";

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
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [notes, setNotes] = useState("");
  const [sendImmediately, setSendImmediately] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [taxLoading, setTaxLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dueDate = addDays(invoiceDate, PAY_TERMS.find((x) => x.v === paymentTerms)?.d ?? 30);

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

  const handleSubmit = async () => {
    if (!clientId.trim()) {
      setError("Please select a client");
      return;
    }
    const validItems = lineItems.filter(
      (it) => it.description.trim() && it.gstConfigId && it.quantity > 0 && it.rate >= 0
    );
    if (validItems.length === 0) {
      setError("Add at least one line item with description, GST, quantity and rate");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createInvoice({
        clientId,
        currency: clientCurrency,
        lineItems: validItems.map((it) => ({
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
      });
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
      navigate("/invoices");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>
        <span style={{ color: C.invoice }}>📄</span> Create invoice
      </h1>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <Inp
          label="Client *"
          type="select"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            const c = clients.find((x) => x.id === e.target.value);
            if (c?.currency) setCurrency(c.currency);
          }}
          req
          opts={[
            { v: "", l: clientsLoading ? "Loading..." : "Select client..." },
            ...clients.map((c) => ({ v: c.id, l: `${c.name} (${c.currency})` })),
          ]}
        />

        <Inp
          label="Currency"
          type="select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          opts={CURRENCIES.map((c) => ({ v: c.v, l: c.l }))}
        />

        <div style={{ marginBottom: "14px" }}>
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
            <span>Line items *</span>
            <Btn sm v="invoice" onClick={addLineItem}>
              ＋ Add line
            </Btn>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: C.surface }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>Description</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>HSN</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600 }}>GST</th>
                  <th style={{ padding: "8px 10px", width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                        placeholder="Description"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        type="text"
                        value={item.hsnCode}
                        onChange={(e) => updateLineItem(idx, "hsnCode", e.target.value)}
                        placeholder="998314"
                        style={{
                          width: "70px",
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)}
                        style={{
                          width: "60px",
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate || ""}
                        onChange={(e) => updateLineItem(idx, "rate", parseFloat(e.target.value) || 0)}
                        style={{
                          width: "90px",
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <select
                        value={item.gstConfigId}
                        onChange={(e) => updateLineItem(idx, "gstConfigId", e.target.value)}
                        style={{
                          padding: "6px 8px",
                          border: `1px solid ${C.border}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          minWidth: "120px",
                        }}
                      >
                        <option value="">Select GST</option>
                        {gstConfigs.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.rate}%)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.danger,
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: 4,
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
          label="TDS (optional)"
          type="select"
          value={taxConfigId}
          onChange={(e) => setTaxConfigId(e.target.value)}
          opts={[
            { v: "", l: "No TDS" },
            ...tdsConfigs.map((t) => ({ v: t.id, l: `${t.name} (${t.rate}%)` })),
          ]}
        />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Inp
            label="Invoice date *"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            req
            style={{ flex: 1 }}
          />
          <Inp
            label="Payment terms"
            type="select"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            opts={PAY_TERMS.map((x) => ({ v: x.v, l: x.l }))}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ fontSize: "11px", color: C.muted, marginBottom: "14px" }}>
          📅 Due date: <strong>{dueDate}</strong>
        </div>

        <Inp
          label="Purchase order"
          value={purchaseOrder}
          onChange={(e) => setPurchaseOrder(e.target.value)}
          ph="PO reference"
        />

        <Inp
          label="Notes"
          type="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          ph="Additional notes..."
        />

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: C.primary,
            }}
          >
            <input
              type="checkbox"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Send immediately
          </label>
        </div>

        {subTotal > 0 && (
          <div
            style={{
              padding: "12px 14px",
              background: `${C.invoice}08`,
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Sub total</span>
              <span>{fmtCur(subTotal, currency)}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: C.danger, fontSize: "12px", marginBottom: "12px" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <Btn v="invoice" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create invoice"}
          </Btn>
          <Btn v="secondary" onClick={() => navigate("/invoices")} disabled={loading}>
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  );
}
