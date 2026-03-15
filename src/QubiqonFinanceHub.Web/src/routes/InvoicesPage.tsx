import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Invoice } from "../types";
import { C } from "../shared/theme";
import { INV_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Btn, Badge, Tbl, Filter, Stat, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getInvoices } from "../shared/api/invoice";
import { downloadInvoicePdf } from "../shared/invoicePdf";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { search, setSearch, sf, setSf, fil, is, setMdl } = useAppContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("invoices-refresh", handler);
    return () => window.removeEventListener("invoices-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getInvoices()
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const f = fil(invoices);

  const handleDownloadPdf = (inv: Invoice) => {
    downloadInvoicePdf(inv).catch(() => {});
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.invoice }}>📄</span> Client invoices
        </h1>
        {is("finance") && (
          <Btn v="invoice" onClick={() => navigate("/invoices/add")}>
            ＋ Create invoice
          </Btn>
        )}
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <Stat label="Draft" value={invoices.filter((i) => i.status === INV_S.DRAFT).length} />
        <Stat label="Sent" value={invoices.filter((i) => i.status === INV_S.SENT).length} />
        <Stat label="Paid" value={invoices.filter((i) => i.status === INV_S.PAID).length} />
        <Stat label="Overdue" value={invoices.filter((i) => i.status === INV_S.OVERDUE).length} />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
        }}
      >
        <Filter
          search={search}
          onSearch={setSearch}
          status={sf}
          onStatus={setSf}
          opts={["all", INV_S.DRAFT, INV_S.SENT, INV_S.PAID, INV_S.OVERDUE]}
        />
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : f.length === 0 ? (
          <Empty icon="📄" title="No invoices" sub="" />
        ) : (
          <Tbl
            cols={["Invoice #", "Client", "Amount", "Currency", "Due", "Status", "Action"]}
            rows={f.map((inv) => ({
              ...inv,
              _cells: [
                { v: <span style={{ fontWeight: 600, color: C.invoice, fontSize: "11px" }}>{inv.id}</span> },
                { v: <span style={{ fontSize: "11px", fontWeight: 600 }}>{inv.cName}</span> },
                { v: <span style={{ fontWeight: 700 }}>{fmtCur(inv.total, inv.currency)}</span> },
                { v: <span style={{ fontSize: "11px" }}>{inv.currency}</span> },
                { v: <span style={{ fontSize: "11px", color: C.muted }}>{inv.due}</span> },
                { v: <Badge s={inv.status} /> },
                {
                  v: (
                    <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px" }}>
                      {inv.status === INV_S.SENT && (
                        <Btn
                          sm
                          v="success"
                          onClick={() => setMdl({ t: "inv-pay", d: inv })}
                        >
                          Mark paid
                        </Btn>
                      )}
                      {(inv.status === INV_S.SENT || inv.status === INV_S.PAID) && (
                        <Btn sm v="invoice" onClick={() => handleDownloadPdf(inv)}>
                          ↓
                        </Btn>
                      )}
                    </div>
                  ),
                },
              ],
            }))}
            onRow={(row) => setMdl({ t: "inv-detail", d: row as unknown as Invoice })}
          />
        )}
      </div>
    </div>
  );
}
