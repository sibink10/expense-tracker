import { useState } from "react";
import { Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { cancelExpense } from "../shared/api/expense";
import { cancelAdvance } from "../shared/api/advance";
import { getApiErrorMessage } from "../shared/api/client";
import { canCancelAdvanceRequest, canCancelExpenseRequest } from "../shared/expensePermissions";
import type { Expense, Advance } from "../types";

export default function CancelRequestConfirmModal() {
  const { mdl, setMdl, t, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d) return null;
  if (mdl.t !== "exp-cancel-confirm" && mdl.t !== "adv-cancel-confirm") return null;

  const isExpense = mdl.t === "exp-cancel-confirm";
  const item = mdl.d as Expense | Advance;
  const allowed = isExpense
    ? canCancelExpenseRequest(item as Expense, user)
    : canCancelAdvanceRequest(item as Advance, user);
  const title = isExpense ? `Cancel expense ${item.id}?` : `Cancel advance ${item.id}?`;
  const detail = isExpense
    ? "This will mark the expense as cancelled. It cannot be edited, approved, rejected, or paid after that."
    : "This will mark the advance as cancelled. It cannot be approved, rejected, or disbursed after that.";

  const handleConfirm = async () => {
    if (!allowed) return;
    const id = item.apiId ?? item.id;
    setLoading(true);
    setError(null);
    try {
      if (isExpense) await cancelExpense(id);
      else await cancelAdvance(id);
      t(isExpense ? "Expense request cancelled" : "Advance request cancelled");
      setMdl(null);
      window.dispatchEvent(new CustomEvent(isExpense ? "expenses-refresh" : "advances-refresh"));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not cancel"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => !loading && setMdl(null)} title={title}>
      {error && <Alert sx={{ marginBottom: "12px" }}>{error}</Alert>}
      {!allowed && (
        <Alert sx={{ marginBottom: "12px" }}>
          {isExpense
            ? "Only the person who raised this expense can cancel it, and only while it is pending approval."
            : "Only the person who raised this advance can cancel it, and only while it is pending."}
        </Alert>
      )}
      <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#495057", margin: 0 }}>{detail}</p>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Keep request
        </Btn>
        <Btn v="danger" onClick={handleConfirm} disabled={loading || !allowed}>
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Btn>
      </div>
    </Mdl>
  );
}
