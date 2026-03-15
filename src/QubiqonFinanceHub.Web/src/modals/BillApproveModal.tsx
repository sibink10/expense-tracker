import { useState } from "react";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { approveBill } from "../shared/api/bill";
import type { Bill } from "../types";

export default function BillApproveModal() {
  const { mdl, setMdl } = useAppContext();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || mdl.t !== "bill-approve") return null;
  const b = mdl.d as Bill;
  const id = b.apiId ?? b.id;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveBill(id, comment);
      setMdl(null);
      window.dispatchEvent(new CustomEvent("bills-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Approve ${b.id}`}>
      <Inp
        label="Comment"
        type="textarea"
        value={comment}
        onChange={(ev) => setComment(ev.target.value)}
        ph="Add a comment (optional)"
      />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "6px" }}>
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
