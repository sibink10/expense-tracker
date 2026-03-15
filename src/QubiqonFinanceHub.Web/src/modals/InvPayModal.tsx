import { useState } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { markInvoicePaid } from "../shared/api/invoice";
import type { Invoice } from "../types";

const PAYMENT_METHODS = [
  { v: "NEFT", l: "NEFT" },
  { v: "IMPS", l: "IMPS" },
  { v: "RTGS", l: "RTGS" },
  { v: "UPI", l: "UPI" },
  { v: "Wire", l: "Wire" },
  { v: "Cheque", l: "Cheque" },
  { v: "Other", l: "Other" },
];

export default function InvPayModal() {
  const { mdl, setMdl, t } = useAppContext();
  const [paymentReference, setPaymentReference] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !("cName" in mdl.d)) return null;
  const inv = mdl.d as Invoice;

  const handleConfirm = async () => {
    if (!paymentReference.trim()) {
      setError("Payment reference is required");
      return;
    }
    const id = inv.apiId ?? inv.id;
    setLoading(true);
    setError(null);
    try {
      await markInvoicePaid(id, {
        paymentReference: paymentReference.trim(),
        method,
        notes: notes.trim(),
      });
      t("Invoice marked paid");
      setMdl(null);
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title="Mark invoice paid">
      <div
        style={{
          padding: "10px 14px",
          background: C.surface,
          borderRadius: "8px",
          marginBottom: "12px",
          fontSize: "12px",
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {inv.cName} · {inv.id}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: C.invoice,
            marginTop: "4px",
          }}
        >
          {fmtCur(inv.total, inv.currency)}
        </div>
      </div>
      <Inp
        label="Payment reference *"
        value={paymentReference}
        onChange={(e) => setPaymentReference(e.target.value)}
        req
        ph="e.g. NEFT20260325..."
      />
      <Inp
        label="Method"
        type="select"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        opts={PAYMENT_METHODS}
      />
      <Inp
        label="Notes"
        type="textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        ph="Optional notes..."
      />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <Btn v="success" onClick={handleConfirm} disabled={!paymentReference.trim() || loading}>
        {loading ? "Saving..." : "Confirm"}
      </Btn>
    </Mdl>
  );
}
