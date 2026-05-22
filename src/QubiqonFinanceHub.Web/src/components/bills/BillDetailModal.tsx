import { useState } from "react";
import { C } from "../../shared/theme";
import { BILL_S } from "../../shared/constants";
import { fmtCur, fmtQty, formatTdsDetailParen, downloadFromSasUrl, buildDownloadFilename, daysOverdueFromDueYmd } from "../../shared/utils";
import { Av, Btn, Badge, Mdl, CLog, MODAL_Z_INDEX } from "../ui";
import { EditIcon } from "../icons";
import { useAppContext } from "../../context/AppContext";
import { getBillAttachment, getBillDocument, removeBillDocument, approveBill } from "../../shared/api/bill";
import type { Bill } from "../../types";

interface Props {
  bill: Bill;
}

export default function BillDetailModal({ bill: b }: Props) {
  const { setMdl, is, cfg, t, user } = useAppContext();
  const tx = cfg.taxes.find((x) => x.id === b.tds);
  const hasAttachment = b.documents.length > 0 || !!b.file;
  const canRemoveDoc = b.status === BILL_S.SUBMITTED && b.documents.length > 0 && (is("admin") || is("finance") || user?.name === b.byName);
  const disableRemoveDoc = b.documents.length <= 1;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewTitle, setViewTitle] = useState("Attachment");
  const [viewLoading, setViewLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const viewerUrl = viewUrl ? `${viewUrl}#toolbar=0&navpanes=0&zoom=page-width` : null;

  const handleApprove = async () => {
    const id = b.apiId ?? b.id;
    setApproveLoading(true);
    try {
      await approveBill(id);
      t("Approved");
      setMdl(null);
      window.dispatchEvent(new CustomEvent("bills-refresh"));
    } catch (err) {
      t(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApproveLoading(false);
    }
  };

  const openView = async (documentId?: string, fileName?: string) => {
    const id = b.apiId ?? b.id;
    setViewLoading(true);
    setViewUrl(null);
    setViewTitle(fileName || "Attachment");
    try {
      const url = documentId ? await getBillDocument(id, documentId) : await getBillAttachment(id);
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
    const latestDocument = b.documents[b.documents.length - 1];
    const sasUrl = latestDocument
      ? await getBillDocument(id, latestDocument.id)
      : await getBillAttachment(id);
    if (!sasUrl) {
      t("Failed to download attachment");
      return;
    }
    await downloadFromSasUrl(
      sasUrl,
      buildDownloadFilename(b.vendorBillNumber || b.id, latestDocument?.name ?? b.file?.n, ".pdf"),
      () => t("Failed to download attachment")
    );
  };

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    const id = b.apiId ?? b.id;
    const sasUrl = await getBillDocument(id, documentId);
    if (!sasUrl) {
      t("Failed to download attachment");
      return;
    }
    await downloadFromSasUrl(
      sasUrl,
      buildDownloadFilename(b.vendorBillNumber || b.id, fileName, ".pdf"),
      () => t("Failed to download attachment")
    );
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!canRemoveDoc) return;
    setRemoveLoading(true);
    try {
      const id = b.apiId ?? b.id;
      await removeBillDocument(id, documentId);
      t("Document removed");
      window.dispatchEvent(new CustomEvent("bills-refresh"));
      setMdl(null);
    } catch (err) {
      t(err instanceof Error ? err.message : "Failed to remove document");
    } finally {
      setRemoveLoading(false);
    }
  };

  const canEdit =
    b.status !== BILL_S.PAID && (is("admin") || is("finance") || user?.name === b.byName);

  // Derive summary values from line items (matching create form)
  const hasLineItems = b.lineItems && b.lineItems.length > 0;
  const subTotal = hasLineItems
    ? b.lineItems!.reduce((sum, li) => sum + li.quantity * li.rate, 0)
    : b.amt;
  const totalQty = hasLineItems ? b.lineItems!.reduce((sum, li) => sum + li.quantity, 0) : 0;
  const itemTaxAmount = hasLineItems
    ? b.lineItems!.reduce((sum, li) => sum + li.amount, 0) - subTotal
    : 0;
  const discountAmount = subTotal * ((b.discountPercent ?? 0) / 100);
  const roundingVal = b.rounding ?? 0;

  return (
    <Mdl open close={() => setMdl(null)} title={b.vendorBillNumber || b.id} w maxWidth="960px">
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "2px" }}>Vendor</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Av n={b.vName} sz={28} v />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{b.vName}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{b.vGst}</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: C.muted }}>Payable</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: C.vendor }}>{fmtCur(b.pay)}</div>
        </div>
        {(b.paidAmount ?? 0) > 0 && (
          <div>
            <div style={{ fontSize: "10px", color: C.muted }}>Paid</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: C.vendor }}>{fmtCur(b.paidAmount ?? 0)}</div>
          </div>
        )}
        <div style={{ marginLeft: "auto" }}>
          <Badge
            s={b.status}
            overdueDays={b.status === BILL_S.OVERDUE ? daysOverdueFromDueYmd(b.due) : undefined}
          />
        </div>
      </div>
      {(b.bDate || b.due || b.terms || b.paymentPriority) && (
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px", fontSize: "12px", alignItems: "flex-start" }}>
          {b.bDate && (
            <div>
              <span style={{ color: C.muted }}>Bill date</span> <span style={{ fontWeight: 600 }}>{b.bDate}</span>
            </div>
          )}
          {b.due && (
            <div>
              <span style={{ color: C.muted }}>Due date</span> <span style={{ fontWeight: 600 }}>{b.due}</span>
            </div>
          )}
          {b.terms && (
            <div>
              <span style={{ color: C.muted }}>Payment terms</span> <span style={{ fontWeight: 600 }}>{b.terms}</span>
            </div>
          )}
          {b.paymentPriority && (
            <div>
              <span style={{ color: C.muted }}>Payment priority</span> <span style={{ fontWeight: 600 }}>{b.paymentPriority}</span>
            </div>
          )}
        </div>
      )}
      {b.lineItems && b.lineItems.length > 0 && (
        <div style={{ marginBottom: "12px", overflowX: "auto" }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px", fontWeight: 600 }}>Items</div>
          <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "11px", border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "10px", color: C.muted }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "10px", color: C.muted }}>Description</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "10px", color: C.muted }}>Account</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 600, fontSize: "10px", color: C.muted }}>Qty</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, fontSize: "10px", color: C.muted }}>Rate</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "10px", color: C.muted }}>Tax</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, fontSize: "10px", color: C.muted }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {b.lineItems.map((li) => (
                <tr key={li.lineNumber} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "8px 10px" }}>{li.lineNumber}</td>
                  <td style={{ padding: "8px 10px" }}>{li.description}</td>
                  <td style={{ padding: "8px 10px", color: C.muted }}>{li.account || "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{fmtQty(li.quantity)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmtCur(li.rate)}</td>
                  <td style={{ padding: "8px 10px", color: C.muted }}>{li.gstName ? `${li.gstName}${li.gstRate != null ? ` [${li.gstRate}%]` : ""}` : "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{fmtCur(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>Description / Notes</div>
        <div style={{ padding: "8px 12px", background: C.surface, borderRadius: "6px", fontSize: "11px" }}>{b.desc?.trim() ? b.desc : "—"}</div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px", fontWeight: 600 }}>Summary</div>
        <div
          style={{
            padding: "14px 16px",
            background: `${C.vendor}08`,
            borderRadius: "8px",
            fontSize: "12px",
            border: `1px solid ${C.vendor}20`,
          }}
        >
        {hasLineItems ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: C.muted }}>Sub Total</span>
              <span style={{ fontWeight: 600 }}>{fmtCur(subTotal)}</span>
            </div>
            {totalQty > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px", color: C.muted }}>
                <span>Total Quantity</span>
                <span>{totalQty}</span>
              </div>
            )}
            {(b.discountPercent != null && b.discountPercent > 0) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: C.muted }}>Discount ({b.discountPercent}%)</span>
                <span style={{ color: C.success }}>-{fmtCur(discountAmount)}</span>
              </div>
            )}
            {itemTaxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: C.muted }}>Tax</span>
                <span style={{ fontWeight: 600 }}>{fmtCur(itemTaxAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: C.muted }}>Rounding</span>
              <span style={{ fontWeight: 600 }}>{roundingVal >= 0 ? "+" : ""}{fmtCur(roundingVal)}</span>
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.vendor}30`,
                paddingTop: "8px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 700, color: C.vendor }}>Total</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: C.vendor }}>{fmtCur(b.amt)}</span>
            </div>
            {(b.tdsAmt > 0 || b.tds) && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", marginBottom: "4px", color: b.tdsAmt > 0 ? C.danger : C.muted }}>
                  <span>TDS {tx ? formatTdsDetailParen(tx.section, tx.name) : ""}</span>
                  <span style={{ fontWeight: 600 }}>{b.tdsAmt > 0 ? `-${fmtCur(b.tdsAmt)}` : "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: C.vendor }}>
                  <span>Payable</span>
                  <span>{fmtCur(b.pay)}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Amount</span><span style={{ fontWeight: 600 }}>{fmtCur(b.amt)}</span></div>
            {(b.discountPercent != null && b.discountPercent > 0) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Discount</span><span>{b.discountPercent}%</span></div>
            )}
            {(b.rounding != null && b.rounding !== 0) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Rounding</span><span>{b.rounding >= 0 ? "+" : ""}{fmtCur(b.rounding)}</span></div>
            )}
            {(b.tdsAmt > 0 || b.tds) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", color: b.tdsAmt > 0 ? C.danger : C.muted }}>
                <span>TDS {tx ? formatTdsDetailParen(tx.section, tx.name) : ""}</span>
                <span style={{ fontWeight: 600 }}>{b.tdsAmt > 0 ? `-${fmtCur(b.tdsAmt)}` : "—"}</span>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.vendor}20`, paddingTop: "3px", display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, color: C.vendor }}>Payable</span><span style={{ fontWeight: 700, color: C.vendor }}>{fmtCur(b.pay)}</span></div>
          </>
        )}
        </div>
      </div>
      {hasAttachment && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>Attachments</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {b.documents.length > 0 ? (
              b.documents.map((document) => (
                <div key={document.id} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "8px 10px", background: C.surface, borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>📎 {document.name}</span>
                  <span style={{ fontSize: "10px", color: C.muted }}>{document.sizeLabel}</span>
                  <span style={{ fontSize: "10px", color: C.muted }}>{document.uploadedAt}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                    <Btn sm v="secondary" onClick={() => openView(document.id, document.name)} disabled={viewLoading}>{viewLoading ? "Loading…" : "View"}</Btn>
                    <Btn sm v="secondary" onClick={() => handleDocumentDownload(document.id, document.name)}>Download</Btn>
                    {canRemoveDoc && (
                      <button
                        type="button"
                        title={disableRemoveDoc ? "Keep at least one document" : "Remove"}
                        onClick={() => handleRemoveDocument(document.id)}
                        disabled={removeLoading || disableRemoveDoc}
                        style={{ background: "none", border: "none", cursor: removeLoading || disableRemoveDoc ? "not-allowed" : "pointer", color: disableRemoveDoc ? C.muted : C.danger, fontSize: "16px", lineHeight: 1, padding: "0 4px" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {b.file && (
                  <span style={{ padding: "6px 10px", background: C.surface, borderRadius: "6px", fontSize: "11px" }}>
                    📎 {b.file.n}
                  </span>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                  <Btn sm v="secondary" onClick={() => openView()} disabled={viewLoading}>{viewLoading ? "Loading…" : "View"}</Btn>
                  <Btn sm v="secondary" onClick={handleDownload}>Download</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {b.paidRef && (
        <div style={{ padding: "8px 12px", background: C.successBg, borderRadius: "6px", marginBottom: "12px", fontSize: "11px" }}>✓ Paid — Ref: <strong>{b.paidRef}</strong></div>
      )}
      <CLog comments={b.comments} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div>
          {canEdit && (
            <button
              type="button"
              onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "bill-edit", d: b }), 50); }}
              title="Edit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                padding: 0,
                border: "none",
                borderRadius: "8px",
                background: "rgba(37, 99, 235, 0.1)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <EditIcon size={20} color="#2563eb" />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(is("approver") || is("admin")) && b.status === BILL_S.SUBMITTED && (
          <>
            <Btn v="success" onClick={handleApprove} disabled={approveLoading}>{approveLoading ? "Approving…" : "Approve"}</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "reject", d: b, it: "bill" }), 50); }}>Reject</Btn>
          </>
        )}
        {(is("finance") || is("admin")) && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE || b.status === BILL_S.PARTIALLY_PAID) && (
          <Btn v="vendor" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "pay", d: b, it: "bill" }), 50); }}>Pay</Btn>
        )}
        <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
        </div>
      </div>

      {sidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={closeSidebar}
            onKeyDown={(ev) => ev.key === "Escape" && closeSidebar()}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: MODAL_Z_INDEX }}
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
              zIndex: MODAL_Z_INDEX,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{viewTitle}</span>
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
