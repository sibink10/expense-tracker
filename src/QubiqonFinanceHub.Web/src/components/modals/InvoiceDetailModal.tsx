import { C } from "../../shared/theme";
import { fmtCur } from "../../shared/utils";
import { Btn, Badge, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Invoice } from "../../types";

interface Props {
  invoice: Invoice;
}

export default function InvoiceDetailModal({ invoice: inv }: Props) {
  const { setMdl } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={inv.id} w>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{inv.cName}</div>
          <div style={{ fontSize: "10px", color: C.muted }}>{inv.currency} · {inv.due}</div>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: C.invoice }}>{fmtCur(inv.total, inv.currency)}</div>
        <Badge s={inv.status} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Line items</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr>
              {["#", "Description", "HSN", "Qty", "Rate", "GST", "Amount"].map((h) => (
                <th key={h} style={{ padding: "6px 8px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontSize: "10px", color: C.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i}>
                <td style={{ padding: "6px 8px" }}>{i + 1}</td>
                <td style={{ padding: "6px 8px" }}>{it.desc}</td>
                <td style={{ padding: "6px 8px" }}>{it.hsn}</td>
                <td style={{ padding: "6px 8px" }}>{it.qty}</td>
                <td style={{ padding: "6px 8px" }}>{fmtCur(it.rate)}</td>
                <td style={{ padding: "6px 8px" }}>{it.gst}%</td>
                <td style={{ padding: "6px 8px" }}>{fmtCur(it.qty * it.rate + it.gstAmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CLog comments={inv.comments} />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {inv.status !== "Paid" && (
          <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "inv-pay", d: inv }), 50); }}>Mark paid</Btn>
        )}
        {inv.status === "Paid" && (
          <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
        )}
      </div>
    </Mdl>
  );
}
