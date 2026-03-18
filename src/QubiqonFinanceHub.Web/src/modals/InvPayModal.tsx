import { useEffect, useMemo, useState } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl, Alert, INVOICE_MODAL_Z_INDEX } from "../components/ui";
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
  const [paidAmount, setPaidAmount] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !("cName" in mdl.d)) return null;
  const inv = mdl.d as Invoice;
  const alreadyPaid = inv.paidAmound ?? 0;
  const remainingAmount = Math.max(inv.total - alreadyPaid, 0);
  const parsedPaidAmount = Number(paidAmount);
  const amountError = useMemo(() => {
    if (paidAmount.trim() === "") return "Paid amount is required";
    if (!Number.isFinite(parsedPaidAmount)) return "Enter a valid paid amount";
    if (parsedPaidAmount < 0) return "Paid amount cannot be less than 0";
    if (parsedPaidAmount > remainingAmount) {
      return `Paid amount cannot be more than ${fmtCur(remainingAmount, inv.currency)}`;
    }
    return null;
  }, [inv.currency, paidAmount, parsedPaidAmount, remainingAmount]);

  useEffect(() => {
    setPaymentReference("");
    setPaidAmount(String(remainingAmount));
    setMethod("NEFT");
    setNotes("");
    setError(null);
  }, [inv.id, remainingAmount]);

  const handleConfirm = async () => {
    if (!paymentReference.trim()) {
      setError("Payment reference is required");
      return;
    }
    if (amountError) {
      setError(amountError);
      return;
    }
    const id = inv.apiId ?? inv.id;
    setLoading(true);
    setError(null);
    try {
      await markInvoicePaid(id, {
        paymentReference: paymentReference.trim(),
        paidAmound: parsedPaidAmount,
        method,
        notes: notes.trim(),
      });
      t(parsedPaidAmount >= remainingAmount ? "Invoice marked paid" : "Invoice marked partially paid");
      setMdl(null);
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title="Mark invoice paid" zIndex={INVOICE_MODAL_Z_INDEX}>
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
        {alreadyPaid > 0 && (
          <div style={{ marginTop: "6px", color: C.muted }}>
            Paid: <strong style={{ color: C.primary }}>{fmtCur(alreadyPaid, inv.currency)}</strong> · Remaining:{" "}
            <strong style={{ color: C.invoice }}>{fmtCur(remainingAmount, inv.currency)}</strong>
          </div>
        )}
      </div>
      <Inp
        label="Paid amount"
        type="number"
        value={paidAmount}
        onChange={(e) => setPaidAmount(e.target.value)}
        req
        min="0"
        max={String(remainingAmount)}
        ph={String(remainingAmount)}
        hint={`Enter an amount between 0 and ${fmtCur(remainingAmount, inv.currency)}`}
      />
      <Inp
        label="Payment reference"
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
      {amountError && <Alert sx={{ marginBottom: "8px" }}>{amountError}</Alert>}
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn v="success" onClick={handleConfirm} disabled={!paymentReference.trim() || !!amountError || loading}>
          {loading ? "Saving..." : "Confirm"}
        </Btn>
      </div>
    </Mdl>
  );
}
