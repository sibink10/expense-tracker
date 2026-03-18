import { useState } from "react";
import { C } from "../../shared/theme";
import { BILL_S } from "../../shared/constants";
import { fmtCur, downloadFromSasUrl, buildDownloadFilename } from "../../shared/utils";
import { Av, Btn, Badge, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getBillAttachment } from "../../shared/api/bill";
import type { Bill } from "../../types";

interface Props {
  bill: Bill;
}

export default function BillDetailModal({ bill: b }: Props) {
  const { setMdl, approve, is, cfg, t } = useAppContext();
  const tx = cfg.taxes.find((x) => x.id === b.tds);
  const hasAttachment = !!(b.file || b.apiId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const viewerUrl = viewUrl ? `${viewUrl}#toolbar=0&navpanes=0&zoom=page-width` : null;

  const openView = async () => {
    const id = b.apiId ?? b.id;
    setViewLoading(true);
    setViewUrl(null);
    try {
      const url = await getBillAttachment(id);
      if (url) {
        setViewUrl(url);
        setSidebarOpen(true);
      } else {
        t("Failed to load attachment");
      }
    } catch {
      t("Failed to load attachment");
    } finally {
      setViewLoading(false);
    }
  };

  const closeSidebar = () => {
    setViewUrl(null);
    setSidebarOpen(false);
  };

  const handleDownload = async () => {
    const id = b.apiId ?? b.id;
    const sasUrl = await getBillAttachment(id);
    if (!sasUrl) {
      t("Failed to download attachment");
      return;
    }
    await downloadFromSasUrl(
      sasUrl,
      buildDownloadFilename(b.vendorBillNumber || b.id, b.file?.n, ".pdf"),
      () => t("Failed to download attachment")
    );
  };

  return (
    <Mdl open close={() => setMdl(null)} title={b.id} w>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
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
        <div style={{ marginLeft: "auto" }}>
          <Badge s={b.status} />
        </div>
      </div>
      <div style={{ padding: "10px 14px", background: `${C.vendor}06`, borderRadius: "8px", marginBottom: "12px", fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Amount</span><span style={{ fontWeight: 600 }}>{fmtCur(b.amt)}</span></div>
        {(b.tdsAmt > 0 || b.tds) && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", color: b.tdsAmt > 0 ? C.danger : C.muted }}>
            <span>TDS {tx ? `(${tx.section}${tx.name ? ` — ${tx.name}` : ""})` : ""}</span>
            <span style={{ fontWeight: 600 }}>{b.tdsAmt > 0 ? `-${fmtCur(b.tdsAmt)}` : "—"}</span>
          </div>
        )}
        <div style={{ borderTop: `1px solid ${C.vendor}20`, paddingTop: "3px", display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, color: C.vendor }}>Payable</span><span style={{ fontWeight: 700, color: C.vendor }}>{fmtCur(b.pay)}</span></div>
      </div>
      <div style={{ padding: "8px 12px", background: C.surface, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>{b.desc}</div>
      {hasAttachment && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>Attachment</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {b.file && (
              <span style={{ padding: "6px 10px", background: C.surface, borderRadius: "6px", fontSize: "11px" }}>
                📎 {b.file.n}
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <Btn sm v="secondary" onClick={openView} disabled={viewLoading}>{viewLoading ? "Loading…" : "View"}</Btn>
              <Btn sm v="secondary" onClick={handleDownload}>Download</Btn>
            </div>
          </div>
        </div>
      )}
      {b.paidRef && (
        <div style={{ padding: "8px 12px", background: C.successBg, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>✓ Paid — Ref: <strong>{b.paidRef}</strong></div>
      )}
      <CLog comments={b.comments} />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {(is("approver") || is("admin")) && b.status === BILL_S.SUBMITTED && (
          <>
            <Btn v="success" onClick={() => approve(b, "bill")}>Approve</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: b, it: "bill" }), 50); }}>Reject</Btn>
          </>
        )}
        {(is("finance") || is("admin")) && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE) && (
          <Btn v="vendor" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "pay", d: b, it: "bill" }), 50); }}>Pay</Btn>
        )}
        {!(((is("approver") || is("admin")) && b.status === BILL_S.SUBMITTED) || ((is("finance") || is("admin")) && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE))) && (
          <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
        )}
      </div>

      {sidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={closeSidebar}
            onKeyDown={(ev) => ev.key === "Escape" && closeSidebar()}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1100 }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(90vw, 560px)",
              background: "#fff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              zIndex: 1101,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Attachment</span>
              <button type="button" onClick={closeSidebar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, color: C.muted }}>×</button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              {viewerUrl ? (
                <iframe title="Bill attachment" src={viewerUrl} style={{ width: "100%", height: "100%", border: "none" }} />
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: C.muted }}>Loading…</div>
              )}
            </div>
          </div>
        </>
      )}
    </Mdl>
  );
}
