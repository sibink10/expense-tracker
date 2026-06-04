import { useEffect, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { C, R } from "../../shared/theme";
import { fmtCur } from "../../shared/utils";
import { Alert, Av, Btn, Inp, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { createAdvance } from "../../shared/api/advance";
import { EVENTS } from "../../shared/constants";

export default function RequestAdvanceModal() {
  const { cfg, user, setEmail, setMdl, t, refreshOrgSettings } = useAppContext();
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
      await createAdvance({ amount, purpose: pur.trim() });
      setEmail({ to: "Approvers", subj: `New advance request from ${user.name}` });
      t("Advance submitted");
      setConfirmOpen(false);
      setMdl(null);
      window.dispatchEvent(new CustomEvent(EVENTS.ADVANCES_REFRESH));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit advance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => !loading && setMdl(null)} title="Request advance">
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
              {user.dept} · Balance cap: {fmtCur(balanceCap)}
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
            <CirclePlus size={15} strokeWidth={1.8} />
            {loading ? "Submitting..." : "Submit"}
          </Btn>
        </div>
      </div>
      <Mdl open={confirmOpen} close={() => !loading && setConfirmOpen(false)} title="Submit advance request">
        <div style={{ fontSize: "13px", color: C.primary, lineHeight: 1.5 }}>
          Submit this advance request for approval?
        </div>
        <div style={{ display: "grid", gap: "8px", marginTop: "14px", padding: "12px", background: C.advanceBg, borderRadius: R.control, fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>Amount</span>
            <strong>{fmtCur(parseFloat(amt) || 0)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>Employee</span>
            <strong>{user.name}</strong>
          </div>
        </div>
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <Btn v="secondary" sm onClick={() => setConfirmOpen(false)} disabled={loading} sx={{ borderRadius: R.control }}>
            Cancel
          </Btn>
          <Btn v="primary" sm onClick={submit} disabled={loading} sx={{ borderRadius: R.control }}>
            <CirclePlus size={15} strokeWidth={1.8} />
            {loading ? "Submitting..." : "Confirm submit"}
          </Btn>
        </div>
      </Mdl>
    </Mdl>
  );
}
