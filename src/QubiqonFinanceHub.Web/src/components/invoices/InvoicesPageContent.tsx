import { useMemo, useState, useEffect, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  HandCoins,
  IndianRupee,
  ReceiptText,
  RefreshCw,
  Send,
  Signature,
} from "lucide-react";
import type { Invoice } from "../../types";
import { C, R, workflowTableActionStyle, tableIconButtonSx } from "../../shared/theme";
import { EVENTS, INV_S, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur, daysOverdueFromDueYmd, nextListSort } from "../../shared/utils";
import {
  Btn,
  Badge,
  Tbl,
  Stat,
  Empty,
  Mdl,
  INVOICE_MODAL_Z_INDEX,
  Spinner,
  EditActionButton,
  CollapsibleSearch,
  ListPageHeader,
  ListPageAddButton,
  OverflowStatusTabs,
  useNavPageAdd,
  type TblCol,
} from "../ui";
import { useAppContext } from "../../context/AppContext";
import {
  getInvoiceCounts,
  getInvoices,
  markInvoiceSent,
  cancelInvoice,
  syncInvoiceSignedPdf,
  invoiceStatusForApi,
} from "../../shared/api/invoice";
import { downloadInvoicePdf } from "../../shared/invoicePdf";
import { sendZohoDocument } from "../../shared/api/zoho";

type InvoiceStatusFilterOption = { label: string; value: string };

const INVOICE_STATUS_FILTER_OPTIONS: InvoiceStatusFilterOption[] = [
  { label: "All invoices", value: "all" },
  { label: "Draft", value: INV_S.DRAFT },
  { label: "Sent", value: INV_S.SENT },
  { label: "Viewed", value: INV_S.VIEWED },
  { label: "Partially paid", value: INV_S.PARTIALLY_PAID },
  { label: "Paid", value: INV_S.PAID },
  { label: "Overdue", value: INV_S.OVERDUE },
  { label: "Pending signature", value: INV_S.PENDING_SIGNATURE },
  { label: "Signed", value: INV_S.SIGNED },
  { label: "Signature failed", value: INV_S.SIGNATURE_FAILED },
  { label: "Cancelled", value: INV_S.CANCELLED },
];

const INVOICE_TAB_PRIMARY_VALUES = ["all", INV_S.DRAFT, INV_S.SENT, INV_S.PAID];

const DownloadSpinner = () => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      border: `2px solid ${C.actionDownloadBg}`,
      borderTopColor: C.actionDownloadIcon,
      borderRadius: "50%",
      animation: "invSpin 0.7s linear infinite",
    }}
  />
);

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, is, setMdl, activeOrg, t } = useAppContext();
  const navAdd = useNavPageAdd();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<Invoice | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null);
  const [zohoSignConfirm, setZohoSignConfirm] = useState<Invoice | null>(null);
  const [zohoSignLoading, setZohoSignLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<Invoice | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
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
  const validStatusValues = new Set(INVOICE_STATUS_FILTER_OPTIONS.map((o) => o.value));
  const statusParam = searchParams.get("status") ?? "all";
  const normalizedStatus = validStatusValues.has(statusParam) ? statusParam : "all";

  const statusForApi =
    normalizedStatus !== "all" ? invoiceStatusForApi(normalizedStatus) : undefined;

  const setInvoiceStatusFilter = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "all") nextParams.delete("status");
    else nextParams.set("status", next);
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  const orderedInvoiceStatusTabs = useMemo(() => {
    const byValue = new Map(INVOICE_STATUS_FILTER_OPTIONS.map((o) => [o.value, o]));
    const primary = INVOICE_TAB_PRIMARY_VALUES.map((v) => byValue.get(v)).filter((t): t is InvoiceStatusFilterOption => !!t);
    const rest = INVOICE_STATUS_FILTER_OPTIONS.filter((t) => !INVOICE_TAB_PRIMARY_VALUES.includes(t.value));
    return [...primary, ...rest];
  }, []);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.INVOICES_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.INVOICES_REFRESH, handler);
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
      status: statusForApi,
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
  }, [page, pageSize, search, statusForApi, refreshKey, sortBy, sortDesc]);

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

  const canSendInvoice = is(ROLES.FINANCE) || is(ROLES.ADMIN);

  const hasSignedPdfUrl = (inv: Invoice) => !!inv.signedPdfUrl?.trim();

  const handleSyncSignedPdf = async (inv: Invoice, e: MouseEvent) => {
    e.stopPropagation();
    if (!inv.apiId) return;
    setSyncLoadingId(inv.id);
    try {
      await syncInvoiceSignedPdf(inv.apiId);
      t("Signed PDF synced to storage");
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent(EVENTS.INVOICES_REFRESH));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncLoadingId(null);
    }
  };

  const handleConfirmSend = async () => {
    const inv = sendConfirm;
    if (!inv?.apiId) return;
    setSendLoading(true);
    try {
      await markInvoiceSent(inv.apiId);
      t("Invoice sent to client");
      setSendConfirm(null);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent(EVENTS.INVOICES_REFRESH));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not mark invoice as sent", "error");
    } finally {
      setSendLoading(false);
    }
  };

  const openZohoSignModal = (inv: Invoice) => {
    setZohoSignConfirm(inv);
  };

  const canSendForSigning = (inv: Invoice) =>
    canSendInvoice &&
    !!inv.apiId &&
    (inv.status === INV_S.DRAFT || inv.status === INV_S.SIGNATURE_FAILED);

  const handleConfirmZohoSign = async () => {
    const inv = zohoSignConfirm;
    if (!inv?.apiId) return;
    setZohoSignLoading(true);
    try {
      const result = await sendZohoDocument({
        type: "Invoice",
        sourceId: inv.apiId,
      });
      t(result.requestId ? `Sent for signature (${result.requestId})` : "Sent for Zoho Sign");
      setZohoSignConfirm(null);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent(EVENTS.INVOICES_REFRESH));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Zoho Sign send failed", "error");
    } finally {
      setZohoSignLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    const inv = cancelConfirm;
    if (!inv?.apiId) return;
    setCancelLoading(true);
    try {
      await cancelInvoice(inv.apiId);
      t("Invoice cancelled");
      setCancelConfirm(null);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent(EVENTS.INVOICES_REFRESH));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not cancel invoice", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleListDownload = async (inv: Invoice, e: MouseEvent) => {
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
  const displayTotalPages = Math.max(totalPages, 1);

  const invoiceBalanceDue = (inv: Invoice) => Math.max(inv.total - (inv.paidAmound ?? 0), 0);

  const isPastDueUnpaid = (inv: Invoice) => {
    if (invoiceBalanceDue(inv) <= 0.005 || inv.status === INV_S.PAID || inv.status === INV_S.CANCELLED) return false;
    const days = daysOverdueFromDueYmd(inv.due);
    return days != null && days >= 1;
  };

  const showOverdueDangerBadge = (inv: Invoice) =>
    isPastDueUnpaid(inv) &&
    (inv.status === INV_S.DRAFT ||
      inv.status === INV_S.PENDING_SIGNATURE ||
      inv.status === INV_S.SIGNED);
  const showMarkPaidOnRow = (inv: Invoice) =>
    invoiceBalanceDue(inv) > 0.005 &&
    inv.status !== INV_S.DRAFT &&
    inv.status !== INV_S.CANCELLED &&
    inv.status !== INV_S.PENDING_SIGNATURE &&
    inv.status !== INV_S.SIGNATURE_FAILED &&
    inv.status !== INV_S.SIGNED;

  const canEditInvoice = (inv: Invoice) => inv.status === INV_S.DRAFT && !!inv.apiId;
  const canCancelInvoice = (inv: Invoice) => inv.status === INV_S.DRAFT && !!inv.apiId;

  const renderWorkflowAction = (inv: Invoice) => {
    if (!canSendInvoice) return null;

    if (canSendForSigning(inv)) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowTableActionStyle(C.invoiceActionSign, C.invoiceActionSignBg)}
          onClick={(e) => {
            e.stopPropagation();
            openZohoSignModal(inv);
          }}
        >
          <Signature size={13} strokeWidth={1.9} />
          Sign
        </Btn>
      );
    }

    if (inv.status === INV_S.PENDING_SIGNATURE) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowTableActionStyle(C.invoiceActionSign, C.invoiceActionSignBg)}
          disabled
        >
          <Signature size={13} strokeWidth={1.9} />
          Sign
        </Btn>
      );
    }

    if (inv.status === INV_S.SIGNED && inv.apiId) {
      if (!hasSignedPdfUrl(inv)) {
        const syncing = syncLoadingId === inv.id;
        return (
          <Btn
            sm
            v="ghost"
            sx={workflowTableActionStyle(C.invoiceActionSign, C.invoiceActionSignBg)}
            onClick={(e) => void handleSyncSignedPdf(inv, e)}
            disabled={syncing}
          >
            <RefreshCw size={13} strokeWidth={1.9} />
            {syncing ? "Syncing…" : "Sync to storage"}
          </Btn>
        );
      }
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowTableActionStyle(C.invoiceActionSent, C.invoiceActionSentBg)}
          onClick={(e) => {
            e.stopPropagation();
            setSendConfirm(inv);
          }}
        >
          <Send size={13} strokeWidth={1.9} />
          Mark sent
        </Btn>
      );
    }

    if (showMarkPaidOnRow(inv)) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowTableActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
          onClick={(e) => {
            e.stopPropagation();
            setMdl({ t: MODAL_T.INV_PAY, d: inv });
          }}
        >
          <IndianRupee size={13} strokeWidth={1.9} />
          Mark paid
        </Btn>
      );
    }

    if (inv.status === INV_S.PAID) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowTableActionStyle(C.muted, C.surface)}
          disabled
        >
          <IndianRupee size={13} strokeWidth={1.9} />
          Mark paid
        </Btn>
      );
    }

    return null;
  };

  const cols: TblCol[] = [
    { label: "Invoice #", sortKey: "InvoiceCode" },
    { label: "Client", sortKey: "ClientName" },
    { label: "Amount", sortKey: "Total" },
    { label: "Balance Due", sortKey: "BalanceDue" },
    { label: "Currency" },
    { label: "Due", sortKey: "DueDate" },
    { label: "Status" },
    "Action",
    "",
  ];

  const rows = invoices.map((inv) => ({
    invoice: inv,
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.invoice }}>{inv.id}</span> },
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{inv.cName || "NA"}</span> },
      { v: <span style={{ fontWeight: 700, color: C.primary }}>{fmtCur(inv.total, inv.currency)}</span> },
      {
        v: (
          <span style={{ fontWeight: 600, color: C.info }}>
            {fmtCur(invoiceBalanceDue(inv), inv.currency)}
          </span>
        ),
      },
      { v: inv.currency || "NA" },
      { v: <span style={{ color: C.muted }}>{inv.due || "NA"}</span> },
      {
        v: (
          <Badge
            s={inv.status}
            forceDanger={showOverdueDangerBadge(inv)}
            overdueDays={
              inv.status === INV_S.OVERDUE || showOverdueDangerBadge(inv)
                ? daysOverdueFromDueYmd(inv.due)
                : undefined
            }
          />
        ),
      },
      {
        v: (
          <span
            onClick={(ev) => ev.stopPropagation()}
            style={{
              minHeight: 36,
              display: "inline-flex",
              gap: "6px",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            {renderWorkflowAction(inv)}
          </span>
        ),
        sx: {
          textAlign: "center" as const,
          verticalAlign: "middle" as const,
        },
      },
      {
        v: (
          <span
            onClick={(ev) => ev.stopPropagation()}
            style={{
              minHeight: 36,
              display: "inline-flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            {inv.apiId && (
              <EditActionButton
                disabled={!canEditInvoice(inv)}
                sx={tableIconButtonSx(C.actionEditBg)}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/invoices/edit/${inv.apiId}`);
                }}
              />
            )}
            {canCancelInvoice(inv) && (
              <Btn
                sm
                v="ghost"
                sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                onClick={(e) => {
                  e.stopPropagation();
                  setCancelConfirm(inv);
                }}
              >
                <Ban size={13} strokeWidth={1.9} />
                Cancel
              </Btn>
            )}
            <button
              type="button"
              aria-label="Download invoice"
              title="Download invoice"
              onClick={(e) => handleListDownload(inv, e)}
              disabled={downloadingId === inv.id}
              style={{
                width: 30,
                height: 30,
                border: "none",
                borderRadius: R.control,
                background: C.actionDownloadBg,
                color: C.actionDownloadIcon,
                cursor: downloadingId === inv.id ? "not-allowed" : "pointer",
                opacity: downloadingId === inv.id ? 0.45 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              {downloadingId === inv.id ? <DownloadSpinner /> : <Download size={17} strokeWidth={1.9} />}
            </button>
          </span>
        ),
        sx: {
          textAlign: "center" as const,
          verticalAlign: "middle" as const,
        },
      },
    ],
  }));

  return (
      <ListPageHeader
        className="list-page-header"
        title="Client Invoices"
        icon={<HandCoins size={24} strokeWidth={1.8} color={C.primary} />}
        search={
          <CollapsibleSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search invoices..."
          />
        }
        addAction={
          (is(ROLES.FINANCE) || is(ROLES.ADMIN)) && navAdd ? (
            <ListPageAddButton addPath={navAdd.addPath} label="Create invoice" />
          ) : undefined
        }
      >
      <style>{`
        @media (max-width: 640px) {
          .invoices-table-card {
            margin-top: 20px;
          }
        }
      `}</style>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        {(
          [
            { label: "Draft", value: counts.draftInvoices, filter: INV_S.DRAFT },
            { label: "Sent", value: counts.sentInvoices, filter: INV_S.SENT },
            { label: "Paid", value: counts.paidInvoices, filter: INV_S.PAID },
            { label: "Partially paid", value: counts.partiallyPaidInvoices, filter: INV_S.PARTIALLY_PAID },
            { label: "Overdue", value: counts.overdueInvoices, filter: INV_S.OVERDUE },
          ] as const
        ).map(({ label, value, filter }) => {
          const active = normalizedStatus === filter;
          return (
            <div
              key={filter}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`Filter by ${label}`}
              onClick={() => setInvoiceStatusFilter(filter)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setInvoiceStatusFilter(filter);
                }
              }}
              style={{
                flex: "1",
                minWidth: "120px",
                cursor: "pointer",
                borderRadius: R.control,
                border: active ? `2px solid ${C.invoice}` : "2px solid transparent",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            >
              <Stat label={label} value={value} />
            </div>
          );
        })}
      </div>
      <div
        className="invoices-table-card"
        style={{
          background: C.white,
          borderRadius: R.control,
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <OverflowStatusTabs
          tabs={orderedInvoiceStatusTabs}
          value={normalizedStatus}
          onChange={setInvoiceStatusFilter}
          visibleCount={4}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh invoices"
        />
        <style>{`@keyframes invSpin { to { transform: rotate(360deg); } }`}</style>
        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.INV_DETAIL, d: (row as (typeof rows)[number]).invoice })}
          bodyFallback={
            loading ? (
              <div
                style={{
                  minHeight: "460px",
                  padding: "42px 16px",
                  textAlign: "center",
                  color: C.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <Spinner size={28} />
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: C.primary }}>
                  Loading invoices...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching invoice list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<ReceiptText size={38} strokeWidth={1.6} />}
                title={
                  search.trim()
                    ? "No invoices found"
                    : normalizedStatus !== "all"
                      ? "No invoices in this status"
                      : "No invoices"
                }
                sub={
                  search.trim()
                    ? "Try a different search term or status filter."
                    : normalizedStatus !== "all"
                      ? "Pick another status or clear the filter."
                      : "Create your first invoice to get started."
                }
              />
            ) : null
          }
          headerSx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
            verticalAlign: "middle",
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
            verticalAlign: "middle",
          }}
          sortBy={sortBy}
          sortDesc={sortDesc}
          onSortChange={handleSort}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
            Showing {totalCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCount}
          </span>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => {
                if (loading || page <= 1) return;
                setPage((p) => Math.max(1, p - 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: R.control,
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page <= 1 ? 0.45 : 1,
                cursor: loading || page <= 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              Prev
            </button>
            <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
              Page {page} of {displayTotalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= displayTotalPages}
              onClick={() => {
                if (loading || page >= displayTotalPages) return;
                setPage((p) => Math.min(displayTotalPages, p + 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: R.control,
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page >= displayTotalPages ? 0.45 : 1,
                cursor: loading || page >= displayTotalPages ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Next
              <ChevronRight size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>
      <Mdl
        open={!!sendConfirm}
        close={() => {
          if (!sendLoading) setSendConfirm(null);
        }}
        title="Mark invoice as sent?"
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 16px", lineHeight: 1.5 }}>
          This sets the invoice status to <strong>Sent</strong>. You can record payment afterward.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setSendConfirm(null)} disabled={sendLoading}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={handleConfirmSend} disabled={sendLoading}>
            {sendLoading ? "Updating…" : "Mark as sent"}
          </Btn>
        </div>
      </Mdl>
      <Mdl
        open={!!zohoSignConfirm}
        close={() => {
          if (!zohoSignLoading) setZohoSignConfirm(null);
        }}
        title="Send invoice for signing?"
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 12px", lineHeight: 1.5 }}>
          A PDF is generated from this invoice and sent to{" "}
          <strong>
            {activeOrg?.zohoSignSignerName
              ? `${activeOrg.zohoSignSignerName} (${activeOrg.zohoSignEmail ?? "no email"})`
              : "your organization's Zoho Sign recipient"}
          </strong>{" "}
          (configured under Admin → Organization). After signing, sync stores the signed PDF and marks the invoice as
          sent.
        </p>
        {(!activeOrg?.zohoSignEmail || !activeOrg?.zohoSignSignerName) && (
          <p style={{ fontSize: 12, color: C.danger, margin: "0 0 12px" }}>
            Set Zoho Sign email and signer name on the active organization before sending.
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setZohoSignConfirm(null)} disabled={zohoSignLoading}>
            Cancel
          </Btn>
          <Btn
            v="invoice"
            onClick={() => void handleConfirmZohoSign()}
            disabled={zohoSignLoading || !activeOrg?.zohoSignEmail || !activeOrg?.zohoSignSignerName}
          >
            {zohoSignLoading ? "Sending…" : "Send for signing"}
          </Btn>
        </div>
      </Mdl>
      <Mdl
        open={!!cancelConfirm}
        close={() => {
          if (!cancelLoading) setCancelConfirm(null);
        }}
        title={`Cancel invoice ${cancelConfirm?.id ?? ""}?`}
        zIndex={INVOICE_MODAL_Z_INDEX + 50}
      >
        <p style={{ fontSize: "13px", color: C.primary, margin: "0 0 16px", lineHeight: 1.5 }}>
          This marks the invoice as <strong>Cancelled</strong>. It cannot be edited, sent for signing, or sent to the
          client afterward.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setCancelConfirm(null)} disabled={cancelLoading}>
            Keep invoice
          </Btn>
          <Btn v="danger" onClick={() => void handleConfirmCancel()} disabled={cancelLoading}>
            {cancelLoading ? "Cancelling…" : "Yes, cancel invoice"}
          </Btn>
        </div>
      </Mdl>
    </ListPageHeader>
  );
}
