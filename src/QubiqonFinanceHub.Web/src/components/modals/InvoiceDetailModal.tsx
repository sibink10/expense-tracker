import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn, Mdl, CLog, INVOICE_MODAL_Z_INDEX } from "../ui";
import { C } from "../../shared/theme";
import { useAppContext } from "../../context/AppContext";
import type { Invoice } from "../../types";
import { downloadInvoicePdf } from "../../shared/invoicePdf";
import { markInvoiceSent } from "../../shared/api/invoice";
import InvoiceDocument from "../InvoiceDocument";
import { EditIcon } from "../icons";
import { INV_S } from "../../shared/constants";

interface Props {
  invoice: Invoice;
}

const LoaderSpinner = () => (
  <span
    style={{
      display: "inline-block",
      width: 12,
      height: 12,
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }}
  />
);

export default function InvoiceDetailModal({ invoice: inv }: Props) {
  const { setMdl, activeOrg, is, t } = useAppContext();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const balanceDue = Math.max(inv.total - (inv.paidAmound ?? 0), 0);
  const canFinance = is("finance") || is("admin");
  const showMarkPaid = canFinance && balanceDue > 0.005 && inv.status === INV_S.SENT;

  const canSendInvoice = canFinance && inv.status === INV_S.DRAFT && !!inv.apiId;
  const canEdit = inv.status === INV_S.DRAFT && !!inv.apiId;

  const handleConfirmSend = async () => {
    if (!inv.apiId) return;
    setSendLoading(true);
    try {
      const updated = await markInvoiceSent(inv.apiId);
      t("Invoice sent to client");
      setSendConfirmOpen(false);
      setMdl({ t: "inv-detail", d: updated });
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not mark invoice as sent", "error");
    } finally {
      setSendLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(inv, activeOrg);
    } catch {
      // Silent fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={inv.id} w zIndex={INVOICE_MODAL_Z_INDEX}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginBottom: "16px" }}>
        <InvoiceDocument invoice={inv} organization={activeOrg} />
      </div>

      <CLog comments={inv.comments} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setMdl(null);
                navigate(`/invoices/edit/${inv.apiId}`);
              }}
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
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {canSendInvoice && (
            <Btn v="info" onClick={() => setSendConfirmOpen(true)} disabled={sendLoading}>
              Mark as sent
            </Btn>
          )}
          <Btn v="invoice" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <>
                <LoaderSpinner />
                Downloading…
              </>
            ) : (
              "Download"
            )}
          </Btn>
          {showMarkPaid && (
            <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "inv-pay", d: inv }), 50); }}>Mark paid</Btn>
          )}
          {!showMarkPaid && inv.status === INV_S.PAID && (
            <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
          )}
        </div>
      </div>

      <Mdl
        open={sendConfirmOpen}
        close={() => {
          if (!sendLoading) setSendConfirmOpen(false);
        }}
        title="Mark invoice as sent?"
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 16px", lineHeight: 1.5 }}>
          This sets the invoice status to <strong>Sent</strong>. You can record payment afterward.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setSendConfirmOpen(false)} disabled={sendLoading}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={handleConfirmSend} disabled={sendLoading}>
            {sendLoading ? "Updating…" : "Mark as sent"}
          </Btn>
        </div>
      </Mdl>
    </Mdl>
  );
}
