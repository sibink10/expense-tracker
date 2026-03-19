import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Btn, Mdl, CLog, INVOICE_MODAL_Z_INDEX } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Invoice } from "../../types";
import { downloadInvoicePdf } from "../../shared/invoicePdf";
import InvoiceDocument from "../InvoiceDocument";
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
  const { setMdl, activeOrg } = useAppContext();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

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
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {inv.status === INV_S.DRAFT && inv.apiId && (
          <Btn v="secondary" onClick={() => { setMdl(null); navigate(`/invoices/edit/${inv.apiId}`); }}>
            Edit
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
