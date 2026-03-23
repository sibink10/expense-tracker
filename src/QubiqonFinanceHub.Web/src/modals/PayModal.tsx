import { useState, useEffect, useMemo } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { payBill } from "../shared/api/bill";
import { payExpense } from "../shared/api/expense";
import type { Expense, Bill, Advance } from "../types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function PayModal() {
  const { mdl, setMdl, pay } = useAppContext();
  const [r, setR] = useState("");
  const [paidAmt, setPaidAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !mdl.it) return null;
  const d = mdl.d as Expense | Bill | Advance;

  const total = "pay" in d ? d.pay : d.amt;
  const alreadyPaid = (d as Expense & Bill).paidAmount ?? 0;
  const remaining = round2(Math.max(0, total - alreadyPaid));
  const defaultPaid = round2(remaining > 0 ? remaining : total);

  const parsedPaid = parseFloat(paidAmt) || 0;
  const paidError = useMemo(() => {
    if (paidAmt.trim() === "" && parsedPaid === 0) return "Paid amount is required";
    if (!Number.isFinite(parsedPaid) || parsedPaid < 0) return "Enter a valid paid amount";
    if (round2(parsedPaid) > remaining) return `Paid amount cannot exceed ${fmtCur(remaining)}`;
    return null;
  }, [paidAmt, parsedPaid, remaining]);

  useEffect(() => {
    setPaidAmt(String(defaultPaid));
  }, [defaultPaid, mdl?.d]);

  const handlePay = async () => {
    if (!r) return;
    if (paidError) return;
    const paid = round2(parseFloat(paidAmt) || defaultPaid);
    if (mdl.it === "bill") {
      const b = d as Bill;
      const id = b.apiId ?? b.id;
      setLoading(true);
      setError(null);
      try {
        await payBill(id, { paymentReference: r, paidAmount: paid });
        setMdl(null);
        window.dispatchEvent(new CustomEvent("bills-refresh"));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to process payment");
      } finally {
        setLoading(false);
      }
    } else if (mdl.it === "expense") {
      const exp = d as Expense;
      const id = exp.apiId ?? exp.id;
      setLoading(true);
      setError(null);
      try {
        await payExpense(id, { paymentReference: r, paidAmount: paid });
        setMdl(null);
        window.dispatchEvent(new CustomEvent("expenses-refresh"));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to process payment");
      } finally {
        setLoading(false);
      }
    } else if (mdl.it === "advance") {
      pay(d, mdl.it, r);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title="Process payment">
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
          <span style={{ color: C.muted }}>{d.id}</span>
          <span style={{ fontWeight: 700 }}>
            {fmtCur(total)}
            {alreadyPaid > 0 && (
              <span style={{ fontSize: "11px", color: C.muted, marginLeft: "6px" }}>
                (Paid: {fmtCur(alreadyPaid)} · Remaining: {fmtCur(remaining)})
              </span>
            )}
          </span>
        </div>
        <div style={{ fontWeight: 600, marginTop: "4px" }}>
          {"vName" in d ? d.vName : d.empName}
        </div>
      </div>
      <Inp
        label="Paid amount"
        type="number"
        value={paidAmt}
        onChange={(e) => setPaidAmt(e.target.value)}
        req
        ph={remaining > 0 ? `Remaining: ${fmtCur(remaining)}` : String(defaultPaid)}
        hint={remaining > 0 ? `Remaining: ${fmtCur(remaining)}` : undefined}
      />
      {paidError && <Alert sx={{ marginBottom: "8px" }}>{paidError}</Alert>}
      <Inp
        label="Payment ref (NEFT/IMPS/UPI)"
        value={r}
        onChange={(e) => setR(e.target.value)}
        req
        ph="Reference..."
      />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn
          v={mdl.it === "bill" ? "vendor" : mdl.it === "advance" ? "advance" : "info"}
          onClick={handlePay}
          disabled={!r || !!paidError || loading}
        >
          {loading ? "Processing..." : "Confirm payment"}
        </Btn>
      </div>
    </Mdl>
  );
}
