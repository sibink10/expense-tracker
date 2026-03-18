import { useState } from "react";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { approveExpense } from "../shared/api/expense";
import type { Expense } from "../types";

export default function ExpenseApproveModal() {
  const { mdl, setMdl } = useAppContext();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || mdl.t !== "exp-approve") return null;
  const e = mdl.d as Expense;
  const id = e.apiId ?? e.id;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveExpense(id, comment);
      setMdl(null);
      window.dispatchEvent(new CustomEvent("expenses-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Approve ${e.id}`}>
      <Inp
        label="Comment"
        type="textarea"
        value={comment}
        onChange={(ev) => setComment(ev.target.value)}
        ph="Add a comment (optional)"
      />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn v="success" onClick={handleSubmit} disabled={loading}>
          {loading ? "Approving..." : "Approve"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
