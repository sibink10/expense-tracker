import { useState } from "react";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { rejectExpense } from "../shared/api/expense";
import { rejectAdvance } from "../shared/api/advance";
import { rejectBill } from "../shared/api/bill";
import type { Expense, Bill, Advance } from "../types";

export default function RejectModal() {
  const { mdl, setMdl, reject } = useAppContext();
  const [r, setR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !mdl.it) return null;
  const d = mdl.d as Expense | Bill | Advance;
  const isExpense = mdl.it === "expense";
  const isAdvance = mdl.it === "advance";
  const isBill = mdl.it === "bill";

  const handleReject = async () => {
    if (isExpense) {
      const e = d as Expense;
      const id = e.apiId ?? e.id;
      setLoading(true);
      setError(null);
      try {
        await rejectExpense(id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent("expenses-refresh"));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else if (isAdvance) {
      const a = d as Advance;
      const id = a.apiId ?? a.id;
      setLoading(true);
      setError(null);
      try {
        await rejectAdvance(id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent("advances-refresh"));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else if (isBill) {
      const b = d as import("../types").Bill;
      const id = b.apiId ?? b.id;
      setLoading(true);
      setError(null);
      try {
        await rejectBill(id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent("bills-refresh"));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else {
      reject(d, mdl.it as "expense" | "bill" | "advance", r);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Reject ${mdl.it}`}>
      <Inp
        label="Comment *"
        type="textarea"
        value={r}
        onChange={(e) => setR(e.target.value)}
        req
        ph="Add a comment..."
      />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn v="danger" onClick={handleReject} disabled={!r || loading}>
          {loading ? "Rejecting..." : "Reject"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
