import { Btn, Mdl, CLog } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Invoice } from "../../types";
import { downloadInvoicePdf } from "../../shared/invoicePdf";
import InvoiceDocument from "../InvoiceDocument";

interface Props {
  invoice: Invoice;
}

export default function InvoiceDetailModal({ invoice: inv }: Props) {
  const { setMdl, activeOrg } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={inv.id} w>
      <div style={{ marginBottom: "16px" }}>
        <InvoiceDocument invoice={inv} organization={activeOrg} />
      </div>

      <CLog comments={inv.comments} />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Btn v="invoice" onClick={() => { downloadInvoicePdf(inv, activeOrg).catch(() => {}); }}>
          Download
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
