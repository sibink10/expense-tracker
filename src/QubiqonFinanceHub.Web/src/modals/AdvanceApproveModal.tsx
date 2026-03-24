import { useEffect, useState } from "react";
import { Btn, Mdl, Alert, Inp } from "../components/ui";
import { C } from "../shared/theme";
import { useAppContext } from "../context/AppContext";
import { approveAdvance, rejectAdvance } from "../shared/api/advance";
import { advanceRaisedByCurrentUser } from "../shared/expensePermissions";
import type { Advance } from "../types";

function isInsufficientBalanceError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("insufficient") && m.includes("balance");
}

export default function AdvanceApproveModal() {
  const { mdl, setMdl, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);

  if (!mdl?.d || mdl.t !== "adv-approve") return null;
  const a = mdl.d as Advance;
  const id = a.apiId ?? a.id;
  const selfRaised = advanceRaisedByCurrentUser(a, user);

  useEffect(() => {
    setError(null);
    setRejectReason("");
    setRejectReasonError(null);
  }, [id]);

  const handleRejectDueToBalance = async () => {
    if (!error) return;
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectReasonError("Reason for rejection is required.");
      return;
    }
    setRejectReasonError(null);
    setLoading(true);
    try {
      const comments = `${trimmed}\n\n[Approval blocked — ${error}]`;
      await rejectAdvance(id, comments);
      setMdl(null);
      window.dispatchEvent(new CustomEvent("advances-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selfRaised) return;
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

  const showRejectInstead = error != null && isInsufficientBalanceError(error);

  return (
    <Mdl open close={() => setMdl(null)} title={`Approve ${a.id}`}>
      <div style={{ marginBottom: "12px", fontSize: "12px" }}>
        Are you sure you want to approve this advance request?
      </div>
      {selfRaised && <Alert sx={{ marginBottom: "8px" }}>You cannot approve a request raised by yourself.</Alert>}
      {error && !showRejectInstead && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      {showRejectInstead && (
        <>
          <div
            style={{
              marginBottom: "12px",
              padding: "12px 14px",
              background: C.surface,
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: C.primary, marginBottom: "8px" }}>Why approval failed</div>
            <div style={{ color: C.primary }}>{error}</div>
            <div style={{ marginTop: "10px", fontSize: "11px", color: C.muted }}>
              You can reject this request below. The employee will see your reason; the system message above is recorded for context.
            </div>
          </div>
          <Inp
            label="Reason for rejection"
            type="textarea"
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              setRejectReasonError(null);
            }}
            req
            ph="Explain why this advance is being rejected…"
            style={{ marginBottom: rejectReasonError ? "6px" : "12px" }}
          />
          {rejectReasonError && (
            <Alert sx={{ marginBottom: "12px" }}>{rejectReasonError}</Alert>
          )}
        </>
      )}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        {showRejectInstead ? (
          <>
            <Btn
              v="danger"
              onClick={handleRejectDueToBalance}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? "Rejecting…" : "Reject"}
            </Btn>
            <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
              Close
            </Btn>
          </>
        ) : (
          <>
            <Btn v="success" onClick={handleSubmit} disabled={loading || selfRaised}>
              {loading ? "Approving..." : "Approve"}
            </Btn>
            <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
              Cancel
            </Btn>
          </>
        )}
      </div>
    </Mdl>
  );
}
