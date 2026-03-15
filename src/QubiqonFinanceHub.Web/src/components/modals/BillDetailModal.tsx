import { C } from "../../shared/theme";
import { BILL_S } from "../../shared/constants";
import { fmtCur } from "../../shared/utils";
import { Av, Btn, Badge, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Bill } from "../../types";

interface Props {
  bill: Bill;
}

export default function BillDetailModal({ bill: b }: Props) {
  const { setMdl, approve, is, cfg, t } = useAppContext();
  const tx = cfg.taxes.find((x) => x.id === b.tds);

  return (
    <Mdl open close={() => setMdl(null)} title={b.id} w>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Av n={b.vName} sz={28} v />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{b.vName}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{b.vGst}</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: C.vendor }}>{fmtCur(b.pay)}</div>
        <Badge s={b.status} />
      </div>
      <div style={{ padding: "10px 14px", background: `${C.vendor}06`, borderRadius: "8px", marginBottom: "12px", fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Amount</span><span style={{ fontWeight: 600 }}>{fmtCur(b.amt)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", color: C.danger }}><span>TDS ({tx?.name || ""})</span><span style={{ fontWeight: 600 }}>-{fmtCur(b.tdsAmt)}</span></div>
        <div style={{ borderTop: `1px solid ${C.vendor}20`, paddingTop: "3px", display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, color: C.vendor }}>Payable</span><span style={{ fontWeight: 700, color: C.vendor }}>{fmtCur(b.pay)}</span></div>
      </div>
      <div style={{ padding: "8px 12px", background: C.surface, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>{b.desc}</div>
      {b.file && (
        <div style={{ padding: "6px 10px", background: C.vendorBg, borderRadius: "6px", marginBottom: "12px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
          📎 {b.file.n} <Btn sm v="vendor" onClick={() => t("Download started")}>↓</Btn>
        </div>
      )}
      {b.paidRef && (
        <div style={{ padding: "8px 12px", background: C.successBg, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>✓ Paid — Ref: <strong>{b.paidRef}</strong></div>
      )}
      <CLog comments={b.comments} />
      <div style={{ display: "flex", gap: "6px" }}>
        {is("approver") && b.status === BILL_S.SUBMITTED && (
          <>
            <Btn v="success" onClick={() => approve(b, "bill")}>Approve</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: b, it: "bill" }), 50); }}>Reject</Btn>
          </>
        )}
        {is("finance") && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE) && (
          <Btn v="vendor" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "pay", d: b, it: "bill" }), 50); }}>Pay</Btn>
        )}
        <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
      </div>
    </Mdl>
  );
}
