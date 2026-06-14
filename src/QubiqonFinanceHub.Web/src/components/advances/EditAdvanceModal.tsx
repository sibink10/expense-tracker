import { useEffect, useState } from "react";
import { CirclePlus, Save, X } from "lucide-react";
import { C, R } from "../../shared/theme";
import { fmtCur } from "../../shared/utils";
import { Alert, Av, Btn, Inp, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { updateAdvance } from "../../shared/api/advance";
import { getApiErrorMessage } from "../../shared/api/client";
import { ADV_S, EVENTS, MODAL_T } from "../../shared/constants";
import type { Advance } from "../../types";

export default function EditAdvanceModal() {
  const { cfg, user, setMdl, t, refreshOrgSettings, mdl } = useAppContext();
  const advance = mdl?.d as Advance | undefined;
  const isRejected = advance?.status === ADV_S.REJECTED;

  const [amt, setAmt] = useState("");
  const [pur, setPur] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const balanceCap = cfg.balanceCap ?? 0;
  const parsedAmount = parseFloat(amt);
  const invalidAmount = amt.trim() !== "" && (isNaN(parsedAmount) || parsedAmount <= 0);
  const over = !invalidAmount && parsedAmount > balanceCap;

  useEffect(() => {
    void refreshOrgSettings().catch(() => undefined);
  }, [refreshOrgSettings]);

  useEffect(() => {
    if (advance) {
      setAmt(String(advance.amt));
      setPur(advance.purpose ?? "");
    }
  }, [advance]);

  if (!mdl?.d || mdl.t !== MODAL_T.ADV_EDIT || !advance) return null;

  const apiId = advance.apiId ?? advance.id;
  if (!apiId) return null;

  const validate = () => {
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be greater than 0");
      return null;
    }
    if (!pur.trim()) return null;
    return amount;
  };

  const openConfirm = () => {
    setError(null);
    const amount = validate();
    if (amount == null) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    const amount = validate();
    if (amount == null) return;

    setLoading(true);
    setError(null);
    try {
      await updateAdvance(apiId, { amount, purpose: pur.trim() });
      t(isRejected ? "Advance resubmitted" : "Advance updated");
      setConfirmOpen(false);
      setMdl(null);
      window.dispatchEvent(new CustomEvent(EVENTS.ADVANCES_REFRESH));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update advance"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => !loading && setMdl(null)} title="Edit advance request">
      <div
        style={{
          background: C.white,
          borderRadius: R.control,
          padding: "4px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: C.advanceBg,
            borderRadius: R.control,
            marginBottom: "14px",
          }}
        >
          <Av n={user.name} sz={32} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{user.name}</div>
            <div style={{ fontSize: "10px", color: C.muted }}>
              {advance.id} · Balance cap: {fmtCur(balanceCap)}
            </div>
          </div>
        </div>
        <Inp
          label="Amount (₹)"
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          req
          min="1"
          ph={`Max ${fmtCur(balanceCap)}`}
        />
        {over && (
          <div
            style={{
              fontSize: "11px",
              color: C.danger,
              marginTop: "-10px",
              marginBottom: "14px",
            }}
          >
            ⚠ Exceeds balance cap
          </div>
        )}
        <Inp
          label="Purpose"
          type="textarea"
          value={pur}
          onChange={(e) => setPur(e.target.value)}
          req
          ph="Why do you need this advance?"
        />
        {error && <Alert sx={{ marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <Btn
            v="secondary"
            sm
            onClick={() => setMdl(null)}
            disabled={loading}
            sx={{ borderRadius: R.control }}
          >
            <X size={15} strokeWidth={1.8} />
            Cancel
          </Btn>
          <Btn
            v="primary"
            sm
            onClick={openConfirm}
            disabled={!amt || !pur.trim() || invalidAmount || over || loading}
            sx={{ borderRadius: R.control, boxShadow: C.cardShadow }}
          >
            <Save size={15} strokeWidth={1.8} />
            {loading ? "Saving..." : isRejected ? "Resubmit" : "Save changes"}
          </Btn>
        </div>
      </div>
      <Mdl open={confirmOpen} close={() => !loading && setConfirmOpen(false)} title={isRejected ? "Resubmit advance request" : "Save advance changes"}>
        <div style={{ fontSize: "13px", color: C.primary, lineHeight: 1.5 }}>
          {isRejected
            ? "Resubmit this advance request for approval?"
            : "Save changes to this advance request?"}
        </div>
        <div style={{ display: "grid", gap: "8px", marginTop: "14px", padding: "12px", background: C.advanceBg, borderRadius: R.control, fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>Amount</span>
            <strong>{fmtCur(parseFloat(amt) || 0)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>ID</span>
            <strong>{advance.id}</strong>
          </div>
        </div>
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <Btn v="secondary" sm onClick={() => setConfirmOpen(false)} disabled={loading} sx={{ borderRadius: R.control }}>
            Cancel
          </Btn>
          <Btn v="primary" sm onClick={submit} disabled={loading} sx={{ borderRadius: R.control }}>
            <CirclePlus size={15} strokeWidth={1.8} />
            {loading ? "Saving..." : isRejected ? "Confirm resubmit" : "Confirm save"}
          </Btn>
        </div>
      </Mdl>
    </Mdl>
  );
}
