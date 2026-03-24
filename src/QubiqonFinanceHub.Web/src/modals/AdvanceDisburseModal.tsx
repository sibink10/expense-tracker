import { useState, useEffect, useMemo } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { disburseAdvance, validateAdvanceDisburse, type AdvanceDisburseValidation } from "../shared/api/advance";
import type { Advance } from "../types";

const PAYMENT_METHODS = [
  { v: "NEFT", l: "NEFT" },
  { v: "IMPS", l: "IMPS" },
  { v: "UPI", l: "UPI" },
  { v: "RTGS", l: "RTGS" },
  { v: "Bank Transfer", l: "Bank Transfer" },
];

export default function AdvanceDisburseModal() {
  const { mdl, setMdl, refreshOrgSettings } = useAppContext();
  const [paymentReference, setPaymentReference] = useState("");
  const [paidAmt, setPaidAmt] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<AdvanceDisburseValidation | null>(null);
  const [validating, setValidating] = useState(false);

  if (!mdl?.d || mdl.t !== "adv-disburse") return null;
  const a = mdl.d as Advance;
  const id = a.apiId ?? a.id;

  const alreadyPaid = a.paidAmount ?? 0;
  const remaining = Math.max(0, a.amt - alreadyPaid);
  const defaultPaid = remaining > 0 ? remaining : a.amt;

  const parsedPaid = parseFloat(paidAmt) || 0;
  const paidError = useMemo(() => {
    if (paidAmt.trim() === "" && parsedPaid === 0) return "Paid amount is required";
    if (!Number.isFinite(parsedPaid) || parsedPaid < 0) return "Enter a valid paid amount";
    if (parsedPaid > remaining) return `Paid amount cannot exceed ${fmtCur(remaining)}`;
    return null;
  }, [paidAmt, parsedPaid, remaining]);

  useEffect(() => {
    setPaidAmt(String(defaultPaid));
  }, [defaultPaid, mdl?.d]);

  useEffect(() => {
    const paid = parseFloat(paidAmt);
    if (!Number.isFinite(paid) || paid <= 0 || !id) {
      setValidation(null);
      return;
    }
    const handle = setTimeout(() => {
      setValidating(true);
      void validateAdvanceDisburse(id, paid)
        .then(setValidation)
        .catch(() => setValidation(null))
        .finally(() => setValidating(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [paidAmt, id]);

  const handleDisburse = async () => {
    if (paidError) {
      setError(paidError);
      return;
    }
    if (validation && !validation.canDisburse) {
      setError(validation.message || "Cannot disburse this amount");
      return;
    }
    if (!paymentReference.trim()) {
      setError("Payment reference is required");
      return;
    }
    setLoading(true);
    setError(null);
    const paid = parseFloat(paidAmt) || defaultPaid;
    try {
      const refTrim = paymentReference.trim();
      await disburseAdvance(id, {
        paymentReference: refTrim.length > 0 ? refTrim : undefined,
        method,
        notes,
        paidAmount: paid,
      });
      setMdl(null);
      window.dispatchEvent(new CustomEvent("advances-refresh"));
      void refreshOrgSettings().catch(() => undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disburse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title="Disburse advance">
      <div
        style={{
          padding: "10px 14px",
          background: C.surface,
          borderRadius: "8px",
          marginBottom: "12px",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.muted }}>{a.id}</span>
          <span style={{ fontWeight: 700, color: C.advance }}>
            {fmtCur(a.amt)}
            {alreadyPaid > 0 && (
              <span style={{ fontSize: "11px", color: C.muted, marginLeft: "6px" }}>
                (Paid: {fmtCur(alreadyPaid)} · Remaining: {fmtCur(remaining)})
              </span>
            )}
          </span>
        </div>
        <div style={{ fontWeight: 600, marginTop: "4px" }}>{a.empName}</div>
        <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{a.purpose}</div>
      </div>
      <Inp
        label="Paid amount"
        type="number"
        value={paidAmt}
        onChange={(e) => setPaidAmt(e.target.value)}
        req
        ph={String(defaultPaid)}
        hint={remaining > 0 ? `Max: ${fmtCur(remaining)}` : undefined}
      />
      {validating && (
        <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px" }}>Checking balance cap…</div>
      )}
      {validation && !validating && (
        <div
          style={{
            fontSize: "11px",
            color: C.muted,
            marginBottom: "8px",
            padding: "8px 10px",
            background: C.surface,
            borderRadius: "8px",
            border: `1px solid ${C.border}`,
          }}
        >
          <div>
            Organization balance cap: <strong style={{ color: C.primary }}>{fmtCur(validation.balanceCap)}</strong>
          </div>
          {alreadyPaid > 0 && (
            <div style={{ marginTop: "4px" }}>
              Further disbursements must not exceed this balance cap (after partial payments, cap is updated when you disburse).
            </div>
          )}
          {validation.message && !validation.canDisburse && (
            <div style={{ marginTop: "6px", color: C.danger, fontWeight: 600 }}>{validation.message}</div>
          )}
        </div>
      )}
      {paidError && <Alert sx={{ marginBottom: "8px" }}>{paidError}</Alert>}
      <Inp
        label="Payment reference"
        value={paymentReference}
        onChange={(e) => setPaymentReference(e.target.value)}
        req
        ph="NEFT/IMPS/UPI reference..."
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
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn
          v="advance"
          onClick={handleDisburse}
          disabled={
            !paymentReference.trim() ||
            !!paidError ||
            loading ||
            validating ||
            (validation != null && !validation.canDisburse)
          }
        >
          {loading ? "Disbursing..." : "Confirm disburse"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
