import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn, Mdl, CLog, INVOICE_MODAL_Z_INDEX, Badge } from "../ui";
import { C } from "../../shared/theme";
import { useAppContext } from "../../context/AppContext";
import type { Invoice } from "../../types";
import { downloadInvoicePdf } from "../../shared/invoicePdf";
import { downloadFromSasUrl, buildDownloadFilename } from "../../shared/utils";
import {
  markInvoiceSent,
  getInvoiceZohoSignStatus,
  syncInvoiceSignedPdf,
  getInvoice,
  getInvoiceSignedPdfUrl,
} from "../../shared/api/invoice";
import { sendZohoDocument } from "../../shared/api/zoho";
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

export default function InvoiceDetailModal({ invoice: initialInv }: Props) {
  const { setMdl, activeOrg, is, t } = useAppContext();
  const navigate = useNavigate();
  const [inv, setInv] = useState(initialInv);
  const [downloading, setDownloading] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [zohoSignConfirmOpen, setZohoSignConfirmOpen] = useState(false);
  const [zohoSignLoading, setZohoSignLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [zohoStatusLabel, setZohoStatusLabel] = useState<string | null>(null);
  const [canSync, setCanSync] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [signedPdfViewUrl, setSignedPdfViewUrl] = useState<string | null>(null);
  const [signedPdfLoading, setSignedPdfLoading] = useState(false);

  const hasSignedPdf = !!inv.signedPdfUrl?.trim();
  const signedPdfViewerUrl = signedPdfViewUrl
    ? `${signedPdfViewUrl}#toolbar=0&navpanes=0&zoom=page-width`
    : null;

  const balanceDue = Math.max(inv.total - (inv.paidAmound ?? 0), 0);
  const canFinance = is("finance") || is("admin");
  const showMarkPaid = canFinance && balanceDue > 0.005 && inv.status === INV_S.SENT;
  const canMarkSent = canFinance && inv.status === INV_S.DRAFT && !!inv.apiId;
  const canEdit = inv.status === INV_S.DRAFT && !!inv.apiId;
  const canSendForSigning =
    canFinance &&
    !!inv.apiId &&
    (inv.status === INV_S.DRAFT || inv.status === INV_S.SIGNATURE_FAILED);

  const signingRelated =
    !!inv.zohoSignRequestId ||
    inv.status === INV_S.PENDING_SIGNATURE ||
    inv.status === INV_S.SIGNED ||
    inv.status === INV_S.SIGNATURE_FAILED;

  useEffect(() => {
    setInv(initialInv);
  }, [initialInv]);

  useEffect(() => {
    if (!inv.apiId || !signingRelated) return;
    let cancelled = false;

    void getInvoiceZohoSignStatus(inv.apiId, true)
      .then((s) => {
        if (cancelled) return;
        setZohoStatusLabel(s.zohoStatus ?? s.invoiceStatus);
        setCanSync(s.canSyncToStorage);
        setCanResend(s.canResend);
        if (s.invoiceStatus && s.invoiceStatus !== inv.status) {
          setInv((prev) => ({ ...prev, status: s.invoiceStatus }));
        }
      })
      .catch(() => {
        if (!cancelled) setZohoStatusLabel(inv.zohoSignStatus ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [inv.apiId, inv.status, inv.zohoSignRequestId, signingRelated]);

  useEffect(() => {
    if (!inv.apiId || !hasSignedPdf) {
      setSignedPdfViewUrl(null);
      return;
    }
    let cancelled = false;
    setSignedPdfLoading(true);
    void getInvoiceSignedPdfUrl(inv.apiId)
      .then((url) => {
        if (!cancelled) setSignedPdfViewUrl(url || null);
      })
      .catch(() => {
        if (!cancelled) setSignedPdfViewUrl(null);
      })
      .finally(() => {
        if (!cancelled) setSignedPdfLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inv.apiId, inv.signedPdfUrl, hasSignedPdf]);

  const refreshInvoice = async () => {
    if (!inv.apiId) return;
    const mapped = await getInvoice(inv.apiId);
    if (mapped) {
      setInv(mapped);
      setMdl({ t: "inv-detail", d: mapped });
    }
    window.dispatchEvent(new CustomEvent("invoices-refresh"));
  };

  const handleConfirmSend = async () => {
    if (!inv.apiId) return;
    setSendLoading(true);
    try {
      const updated = await markInvoiceSent(inv.apiId);
      t("Invoice sent to client");
      setSendConfirmOpen(false);
      setInv(updated);
      setMdl({ t: "inv-detail", d: updated });
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not mark invoice as sent", "error");
    } finally {
      setSendLoading(false);
    }
  };

  const handleConfirmZohoSign = async () => {
    if (!inv.apiId) return;
    setZohoSignLoading(true);
    try {
      const result = await sendZohoDocument({ type: "Invoice", sourceId: inv.apiId });
      t(result.requestId ? `Sent for signing (${result.requestId})` : "Sent for signing");
      setZohoSignConfirmOpen(false);
      await refreshInvoice();
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Send for signing failed", "error");
    } finally {
      setZohoSignLoading(false);
    }
  };

  const handleSyncSignedPdf = async () => {
    if (!inv.apiId) return;
    setSyncLoading(true);
    try {
      await syncInvoiceSignedPdf(inv.apiId);
      t("Signed PDF synced to storage");
      await refreshInvoice();
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (hasSignedPdf && inv.apiId) {
        const sasUrl = signedPdfViewUrl ?? (await getInvoiceSignedPdfUrl(inv.apiId));
        if (!sasUrl) {
          t("Could not download PDF", "error");
          return;
        }
        await downloadFromSasUrl(
          sasUrl,
          buildDownloadFilename(inv.id, "signed", ".pdf"),
          () => t("Could not download PDF", "error"),
        );
      } else {
        await downloadInvoicePdf(inv, activeOrg);
      }
    } catch {
      t("Could not download PDF", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={inv.id} w zIndex={INVOICE_MODAL_Z_INDEX}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {signingRelated && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: C.surface,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: C.muted }}>Zoho Sign:</span>
          <Badge s={inv.status} />
          {zohoStatusLabel && (
            <span style={{ fontSize: 11, color: C.muted }}>({zohoStatusLabel})</span>
          )}
          {activeOrg?.zohoSignEmail && (
            <span style={{ fontSize: 11, color: C.muted }}>→ {activeOrg.zohoSignEmail}</span>
          )}
        </div>
      )}
      <div style={{ marginBottom: "16px" }}>
        {hasSignedPdf ? (
          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: "10px",
              overflow: "hidden",
              background: "#fff",
              minHeight: 480,
            }}
          >
            {signedPdfLoading || !signedPdfViewerUrl ? (
              <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
                {signedPdfLoading ? "Loading signed PDF…" : "Could not load signed PDF"}
              </div>
            ) : (
              <iframe
                title="Signed invoice"
                src={signedPdfViewerUrl}
                style={{ width: "100%", height: "min(70vh, 640px)", border: "none", display: "block" }}
              />
            )}
          </div>
        ) : (
          <InvoiceDocument invoice={inv} organization={activeOrg} />
        )}
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
          {canSendForSigning && (
            <Btn v="secondary" onClick={() => setZohoSignConfirmOpen(true)} disabled={zohoSignLoading}>
              {canResend && inv.status === INV_S.SIGNATURE_FAILED ? "Resend for signing" : "Send for signing"}
            </Btn>
          )}
          {canSync && (
            <Btn v="invoice" onClick={() => void handleSyncSignedPdf()} disabled={syncLoading}>
              {syncLoading ? (
                <>
                  <LoaderSpinner /> Syncing…
                </>
              ) : (
                "Sync to storage"
              )}
            </Btn>
          )}
          {canMarkSent && (
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

      <Mdl
        open={zohoSignConfirmOpen}
        close={() => {
          if (!zohoSignLoading) setZohoSignConfirmOpen(false);
        }}
        title="Send invoice for signing?"
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 12px", lineHeight: 1.5 }}>
          Generates a PDF and emails it to <strong>{activeOrg?.zohoSignEmail ?? "the org Zoho Sign email"}</strong> for
          authorized signature.
        </p>
        {!activeOrg?.zohoSignEmail && (
          <p style={{ fontSize: 12, color: C.danger, margin: "0 0 12px" }}>
            Configure Zoho Sign email under Admin → Organization.
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setZohoSignConfirmOpen(false)} disabled={zohoSignLoading}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={() => void handleConfirmZohoSign()} disabled={zohoSignLoading || !activeOrg?.zohoSignEmail}>
            {zohoSignLoading ? "Sending…" : "Send for signing"}
          </Btn>
        </div>
      </Mdl>
    </Mdl>
  );
}
