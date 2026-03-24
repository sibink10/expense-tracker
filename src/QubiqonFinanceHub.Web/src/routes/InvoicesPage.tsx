import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Invoice } from "../types";
import { C } from "../shared/theme";
import { INV_S } from "../shared/constants";
import { fmtCur, daysOverdueFromDueYmd, nextListSort } from "../shared/utils";
import { Btn, Badge, Tbl, Filter, Stat, Empty, ListRefreshButton, Mdl, INVOICE_MODAL_Z_INDEX, type TblCol } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getInvoiceCounts, getInvoices, markInvoiceSent } from "../shared/api/invoice";
import { downloadInvoicePdf } from "../shared/invoicePdf";

const DownloadSpinner = () => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "invSpin 0.7s linear infinite",
    }}
  />
);

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, fil, is, setMdl, activeOrg, t } = useAppContext();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<Invoice | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);
  const [counts, setCounts] = useState({
    draftInvoices: 0,
    sentInvoices: 0,
    paidInvoices: 0,
    partiallyPaidInvoices: 0,
    overdueInvoices: 0,
  });
  const validStatusValues = new Set(["all", INV_S.DRAFT, INV_S.SENT, INV_S.PAID, INV_S.OVERDUE]);
  const statusParam = searchParams.get("status") ?? "all";
  const normalizedStatus = validStatusValues.has(statusParam) ? statusParam : "all";

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("invoices-refresh", handler);
    return () => window.removeEventListener("invoices-refresh", handler);
  }, []);

  useEffect(() => {
    if (sf !== normalizedStatus) {
      setSf(normalizedStatus);
      setPage(1);
    }
  }, [normalizedStatus, setSf, sf]);

  useEffect(() => {
    setLoading(true);
    getInvoices({
      page,
      pageSize,
      search: search || undefined,
      status: sf && sf !== "all" ? sf : undefined,
      sortBy,
      desc: sortDesc,
    })
      .then((res) => {
        setInvoices(res.items);
        setTotalCount(res.totalCount ?? res.items.length);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(() => {
        setInvoices([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, sf, refreshKey, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  useEffect(() => {
    getInvoiceCounts()
      .then((res) => {
        setCounts({
          draftInvoices: res.draft ?? 0,
          sentInvoices: res.sent ?? 0,
          paidInvoices: res.paid ?? 0,
          partiallyPaidInvoices: res.partiallyPaid ?? 0,
          overdueInvoices: res.overdue ?? 0,
        });
      })
      .catch(() => {
        setCounts({
          draftInvoices: 0,
          sentInvoices: 0,
          paidInvoices: 0,
          partiallyPaidInvoices: 0,
          overdueInvoices: 0,
        });
      });
  }, [refreshKey]);

  const f = fil(invoices);

  const canSendInvoice = is("finance") || is("admin");

  const handleConfirmSend = async () => {
    const inv = sendConfirm;
    if (!inv?.apiId) return;
    setSendLoading(true);
    try {
      await markInvoiceSent(inv.apiId);
      t("Invoice sent to client");
      setSendConfirm(null);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not send invoice", "error");
    } finally {
      setSendLoading(false);
    }
  };

  const handleListDownload = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdf(inv, activeOrg);
    } catch {
      // Silent fail
    } finally {
      setDownloadingId(null);
    }
  };

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const paged = f;

  const invoiceBalanceDue = (inv: Invoice) => Math.max(inv.total - (inv.paidAmound ?? 0), 0);
  const showMarkPaidOnRow = (inv: Invoice) =>
    invoiceBalanceDue(inv) > 0.005 && inv.status !== INV_S.DRAFT;

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
        {(is("finance") || is("admin")) && (
          <Btn v="invoice" onClick={() => navigate("/invoices/add")}>
            ＋ Create invoice
          </Btn>
        )}
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <Stat label="Draft" value={counts.draftInvoices} />
        <Stat label="Sent" value={counts.sentInvoices} />
        <Stat label="Paid" value={counts.paidInvoices} />
        <Stat label="Partially paid" value={counts.partiallyPaidInvoices} />
        <Stat label="Overdue" value={counts.overdueInvoices} />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Filter
          search={search}
          onSearch={setSearch}
          status={sf}
          onStatus={(nextStatus) => {
            setSf(nextStatus);
            const nextParams = new URLSearchParams(searchParams);
            if (nextStatus && nextStatus !== "all") nextParams.set("status", nextStatus);
            else nextParams.delete("status");
            setSearchParams(nextParams, { replace: true });
            setPage(1);
          }}
          opts={["all", INV_S.DRAFT, INV_S.SENT, INV_S.PAID, INV_S.OVERDUE]}
          trailing={
            <ListRefreshButton
              loading={loading}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          }
        />
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : f.length === 0 ? (
          <Empty icon="📄" title="No invoices" sub="" />
        ) : (
          <>
            <style>{`@keyframes invSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Tbl
                cols={
                  [
                    { label: "Invoice #", sortKey: "InvoiceCode" },
                    { label: "Client", sortKey: "ClientName" },
                    { label: "Amount", sortKey: "Total" },
                    { label: "Balance Due", sortKey: "BalanceDue" },
                    { label: "Currency" },
                    { label: "Due", sortKey: "DueDate" },
                    { label: "Status" },
                    "Action",
                  ] as TblCol[]
                }
                sortBy={sortBy}
                sortDesc={sortDesc}
                onSortChange={handleSort}
                rows={paged.map((inv) => ({
                  ...inv,
                  _cells: [
                    { v: <span style={{ fontWeight: 600, color: C.invoice, fontSize: "11px" }}>{inv.id}</span> },
                    { v: <span style={{ fontSize: "11px", fontWeight: 600 }}>{inv.cName}</span> },
                    { v: <span style={{ fontWeight: 700 }}>{fmtCur(inv.total, inv.currency)}</span> },
                    { v: <span style={{ fontWeight: 600, color: C.info }}>{fmtCur(inv.total - (inv.paidAmound ?? 0), inv.currency)}</span> },
                    { v: <span style={{ fontSize: "11px" }}>{inv.currency}</span> },
                    { v: <span style={{ fontSize: "11px", color: C.muted }}>{inv.due}</span> },
                    {
                      v: (
                        <Badge
                          s={inv.status}
                          overdueDays={
                            inv.status === INV_S.OVERDUE ? daysOverdueFromDueYmd(inv.due) : undefined
                          }
                        />
                      ),
                    },
                    {
                      v: (
                        <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px", flexWrap: "wrap", alignItems: "center" }}>
                          <Btn
                            sm
                            v="invoice"
                            onClick={ (e: any) => handleListDownload(inv, e)}
                            disabled={downloadingId === inv.id}
                          >
                            {downloadingId === inv.id ? (
                              <>
                                <DownloadSpinner />
                                …
                              </>
                            ) : (
                              "Download"
                            )}
                          </Btn>
                          {canSendInvoice && inv.status === INV_S.DRAFT && inv.apiId && (
                            <Btn
                              sm
                              v="info"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSendConfirm(inv);
                              }}
                            >
                              Send
                            </Btn>
                          )}
                          {canSendInvoice && showMarkPaidOnRow(inv) && (
                            <Btn
                              sm
                              v="success"
                              onClick={() => setMdl({ t: "inv-pay", d: inv })}
                            >
                              Mark paid
                            </Btn>
                          )}
                        </div>
                      ),
                    },
                  ],
                }))}
                onRow={(row) => setMdl({ t: "inv-detail", d: row as unknown as Invoice })}
              />
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                  paddingTop: "16px",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: "12px", color: C.muted }}>
                  Showing {startIndex + 1}–{endIndex} of {totalCount}
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Btn
                    sm
                    v="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </Btn>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>
                    Page {page} of {totalPages}
                  </span>
                  <Btn
                    sm
                    v="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Mdl
        open={!!sendConfirm}
        close={() => {
          if (!sendLoading) setSendConfirm(null);
        }}
        title="Send invoice to client?"
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 16px", lineHeight: 1.5 }}>
          Email this invoice to the client and mark it as <strong>Sent</strong>. You can record payment after it has been sent.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setSendConfirm(null)} disabled={sendLoading}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={handleConfirmSend} disabled={sendLoading}>
            {sendLoading ? "Sending…" : "Confirm send"}
          </Btn>
        </div>
      </Mdl>
    </div>
  );
}
