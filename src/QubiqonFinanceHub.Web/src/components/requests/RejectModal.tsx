import { useState } from "react";
import { Inp, Btn, Mdl, Alert } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { rejectExpense } from "../../shared/api/expense";
import { rejectAdvance } from "../../shared/api/advance";
import { rejectBill } from "../../shared/api/bill";
import { rejectForecast } from "../../shared/api/forecast";
import type { Expense, Bill, Advance, Forecast, ItemType } from "../../types";
import { EVENTS, ITEM_T } from "../../shared/constants";

export default function RejectModal() {
  const { mdl, setMdl, reject } = useAppContext();
  const [r, setR] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || !mdl.it) return null;
  const d = mdl.d as Expense | Bill | Advance | Forecast;
  const isExpense = mdl.it === ITEM_T.EXPENSE;
  const isAdvance = mdl.it === ITEM_T.ADVANCE;
  const isBill = mdl.it === ITEM_T.BILL;
  const isForecast = mdl.it === ITEM_T.FORECAST;

  const handleReject = async () => {
    if (isExpense) {
      const e = d as Expense;
      const id = e.apiId ?? e.id;
      setLoading(true);
      setError(null);
      try {
        await rejectExpense(id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent(EVENTS.EXPENSES_REFRESH));
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
        window.dispatchEvent(new CustomEvent(EVENTS.ADVANCES_REFRESH));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else if (isBill) {
      const b = d as import("../../types").Bill;
      const id = b.apiId ?? b.id;
      setLoading(true);
      setError(null);
      try {
        await rejectBill(id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent(EVENTS.BILLS_REFRESH));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else if (isForecast) {
      const f = d as Forecast;
      setLoading(true);
      setError(null);
      try {
        await rejectForecast(f.id, r);
        setMdl(null);
        window.dispatchEvent(new CustomEvent(EVENTS.FORECASTS_REFRESH));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reject");
      } finally {
        setLoading(false);
      }
    } else {
      reject(d as Expense | Bill | Advance, mdl.it as ItemType, r);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Reject ${mdl.it}`}>
      <Inp
        label="Comment"
        type="textarea"
        value={r}
        onChange={(e) => setR(e.target.value)}
        req
        ph="Add a comment..."
      />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
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
