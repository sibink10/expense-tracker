import { useState } from "react";
import { Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { approveAdvance } from "../shared/api/advance";
import type { Advance } from "../types";

export default function AdvanceApproveModal() {
  const { mdl, setMdl } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d || mdl.t !== "adv-approve") return null;
  const a = mdl.d as Advance;
  const id = a.apiId ?? a.id;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveAdvance(id);
      setMdl(null);
      window.dispatchEvent(new CustomEvent("advances-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Approve ${a.id}`}>
      <div style={{ marginBottom: "12px", fontSize: "12px" }}>
        Are you sure you want to approve this advance request?
      </div>
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
