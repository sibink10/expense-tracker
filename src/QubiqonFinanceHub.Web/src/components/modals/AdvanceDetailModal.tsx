import { C } from "../../shared/theme";
import { ADV_S } from "../../shared/constants";
import { fmtCur } from "../../shared/utils";
import { Btn, Badge, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Advance } from "../../types";

interface Props {
  advance: Advance;
  previousAdvances: Advance[];
}

export default function AdvanceDetailModal({ advance: a, previousAdvances: hist }: Props) {
  const { setMdl, is } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={a.id} w>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{a.empName} · {a.dept}</div>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: C.advance }}>{fmtCur(a.amt)}</div>
        <div style={{ display: "flex", alignItems: "center" }}><Badge s={a.status} /></div>
      </div>
      <div style={{ padding: "10px 14px", background: C.surface, borderRadius: "8px", marginBottom: "12px", fontSize: "12px" }}>{a.purpose}</div>
      <CLog comments={a.comments} />
      {(is("approver") || is("finance") || is("admin")) && hist.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>Previous advances</div>
          {hist.map((h) => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "6px 10px", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
              <span style={{ color: C.advance, fontWeight: 600 }}>{h.id}</span>
              <span>{fmtCur(h.amt)}</span>
              <Badge s={h.status} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {(is("approver") || is("admin")) && a.status === ADV_S.PENDING && (
          <>
            <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "adv-approve", d: a }), 50); }}>Approve</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: a, it: "advance" }), 50); }}>Reject</Btn>
          </>
        )}
        {is("finance") && a.status === ADV_S.APPROVED && (
          <Btn v="advance" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "adv-disburse", d: a }), 50); }}>Disburse</Btn>
        )}
        {!(((is("approver") || is("admin")) && a.status === ADV_S.PENDING) || (is("finance") && a.status === ADV_S.APPROVED)) && (
          <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
        )}
      </div>
    </Mdl>
  );
}
