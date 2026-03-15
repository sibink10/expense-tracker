import { C } from "../../shared/theme";
import { EXP_S } from "../../shared/constants";
import { fmtCur } from "../../shared/utils";
import { Btn, Badge, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Expense } from "../../types";

interface Props {
  expense: Expense;
}

export default function ExpenseDetailModal({ expense: e }: Props) {
  const { setMdl, is } = useAppContext();

  const isApproverOrAdmin = is("approver") || is("admin");

  return (
    <Mdl open close={() => setMdl(null)} title={e.id} w>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: C.muted }}>Employee</div>
          <div style={{ fontWeight: 600, fontSize: "13px" }}>{e.empName} · {e.dept}</div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: C.muted }}>Amount</div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{fmtCur(e.amt)}</div>
        </div>
        <div><Badge s={e.status} /></div>
      </div>
      <div style={{ padding: "10px 14px", background: C.surface, borderRadius: "8px", marginBottom: "12px", fontSize: "12px" }}>{e.purpose}</div>
      {e.file && (
        <div style={{ padding: "8px 12px", background: C.successBg, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>
          📎 {e.file.n} ({e.file.s})
        </div>
      )}
      <CLog comments={e.comments} />
      <div style={{ display: "flex", gap: "6px" }}>
        {isApproverOrAdmin && e.status === EXP_S.PENDING && (
          <>
            <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "exp-approve", d: e }), 50); }}>Approve</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: e, it: "expense" }), 50); }}>Reject</Btn>
          </>
        )}
        {(is("finance") || is("admin")) && e.status === EXP_S.APPROVED && (
          <Btn v="info" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "pay", d: e, it: "expense" }), 50); }}>Pay</Btn>
        )}
        <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
      </div>
    </Mdl>
  );
}
