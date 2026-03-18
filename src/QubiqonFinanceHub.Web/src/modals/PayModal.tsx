import { useState } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { payBill } from "../shared/api/bill";
import { payExpense } from "../shared/api/expense";
import type { Expense, Bill, Advance } from "../types";

export default function PayModal() {
  const { mdl, setMdl, pay } = useAppContext();
  const [r, setR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !mdl.it) return null;
  const d = mdl.d as Expense | Bill | Advance;

  const handlePay = async () => {
    if (!r) return;
    if (mdl.it === "bill") {
      const b = d as Bill;
      const id = b.apiId ?? b.id;
      setLoading(true);
      setError(null);
      try {
        await payBill(id, r);
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
        await payExpense(id, r);
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
            {fmtCur("pay" in d ? d.pay : d.amt)}
          </span>
        </div>
        <div style={{ fontWeight: 600, marginTop: "4px" }}>
          {"vName" in d ? d.vName : d.empName}
        </div>
      </div>
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
          disabled={!r || loading}
        >
          {loading ? "Processing..." : "Confirm payment"}
        </Btn>
      </div>
    </Mdl>
  );
}
