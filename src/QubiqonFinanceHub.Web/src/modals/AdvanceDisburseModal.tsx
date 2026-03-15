import { useState } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { disburseAdvance } from "../shared/api/advance";
import type { Advance } from "../types";

const PAYMENT_METHODS = [
  { v: "NEFT", l: "NEFT" },
  { v: "IMPS", l: "IMPS" },
  { v: "UPI", l: "UPI" },
  { v: "RTGS", l: "RTGS" },
  { v: "Bank Transfer", l: "Bank Transfer" },
];

export default function AdvanceDisburseModal() {
  const { mdl, setMdl } = useAppContext();
  const [paymentReference, setPaymentReference] = useState("");
  const [method, setMethod] = useState("NEFT");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || mdl.t !== "adv-disburse") return null;
  const a = mdl.d as Advance;
  const id = a.apiId ?? a.id;

  const handleDisburse = async () => {
    setLoading(true);
    setError(null);
    try {
      await disburseAdvance(id, {
        paymentReference,
        method,
        notes,
      });
      setMdl(null);
      window.dispatchEvent(new CustomEvent("advances-refresh"));
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
          <span style={{ fontWeight: 700, color: C.advance }}>{fmtCur(a.amt)}</span>
        </div>
        <div style={{ fontWeight: 600, marginTop: "4px" }}>{a.empName}</div>
        <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{a.purpose}</div>
      </div>
      <Inp
        label="Payment reference *"
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
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn v="advance" onClick={handleDisburse} disabled={!paymentReference || loading}>
          {loading ? "Disbursing..." : "Confirm disburse"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
