import { useState, useEffect, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import type { StylesConfig } from "react-select";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Download,
  HandCoins,
  IndianRupee,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Signature,
} from "lucide-react";
import type { Invoice } from "../../types";
import { C } from "../../shared/theme";
import { INV_S } from "../../shared/constants";
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
  type TblCol,
} from "../ui";
import { useAppContext } from "../../context/AppContext";
import {
  getInvoiceCounts,
  getInvoices,
  markInvoiceSent,
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
];

const invoiceFilterSelectStyles: StylesConfig<InvoiceStatusFilterOption, false> = {
  control: (base) => ({
    ...base,
    minHeight: "34px",
    borderRadius: 8,
    backgroundColor: C.white,
    borderColor: C.border,
    boxShadow: "none",
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: C.primary,
    fontWeight: 500,
  }),
  input: (base) => ({
    ...base,
    color: C.primary,
  }),
  placeholder: (base) => ({
    ...base,
    color: C.muted,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 10px",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: C.muted,
    opacity: state.isDisabled ? 0.35 : 1,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    boxShadow: C.cardShadow,
    overflow: "hidden",
    zIndex: 20,
    backgroundColor: C.white,
    border: `1px solid ${C.border}`,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: C.white,
    paddingTop: 4,
    paddingBottom: 4,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    color: C.invoice,
    fontWeight: state.isSelected ? 600 : 400,
    backgroundColor: state.isSelected ? C.successBg : state.isFocused ? C.surface : "transparent",
    cursor: "pointer",
  }),
};

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

const workflowActionStyle = (fg: string, bg: string) => ({
  borderRadius: "4px",
  background: bg,
  color: fg,
  padding: "6px 8px",
  minHeight: 26,
});

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, is, setMdl, activeOrg, t } = useAppContext();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<Invoice | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [zohoSignConfirm, setZohoSignConfirm] = useState<Invoice | null>(null);
  const [zohoSignLoading, setZohoSignLoading] = useState(false);
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

  const selectedInvoiceStatusFilter =
    INVOICE_STATUS_FILTER_OPTIONS.find((o) => o.value === normalizedStatus) ?? INVOICE_STATUS_FILTER_OPTIONS[0];

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
      window.dispatchEvent(new CustomEvent("invoices-refresh"));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Zoho Sign send failed", "error");
    } finally {
      setZohoSignLoading(false);
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
  const showMarkPaidOnRow = (inv: Invoice) =>
    invoiceBalanceDue(inv) > 0.005 &&
    inv.status !== INV_S.DRAFT &&
    inv.status !== INV_S.PENDING_SIGNATURE &&
    inv.status !== INV_S.SIGNATURE_FAILED &&
    inv.status !== INV_S.SIGNED;

  const renderWorkflowAction = (inv: Invoice) => {
    if (!canSendInvoice) return null;

    if (canSendForSigning(inv)) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowActionStyle(C.invoiceActionSign, C.invoiceActionSignBg)}
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
          sx={workflowActionStyle(C.invoiceActionSign, C.invoiceActionSignBg)}
          disabled
        >
          <Signature size={13} strokeWidth={1.9} />
          Sign
        </Btn>
      );
    }

    if ((inv.status === INV_S.SIGNED || inv.status === INV_S.DRAFT) && inv.apiId) {
      return (
        <Btn
          sm
          v="ghost"
          sx={workflowActionStyle(C.invoiceActionSent, C.invoiceActionSentBg)}
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
          sx={workflowActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
          onClick={(e) => {
            e.stopPropagation();
            setMdl({ t: "inv-pay", d: inv });
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
          sx={workflowActionStyle(C.muted, C.surface)}
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
            overdueDays={inv.status === INV_S.OVERDUE ? daysOverdueFromDueYmd(inv.due) : undefined}
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
                sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/invoices/edit/${inv.apiId}`);
                }}
              />
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
                borderRadius: "4px",
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
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .invoices-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .invoices-add-label {
            display: none;
          }

          .invoices-table-card {
            margin-top: 20px;
          }

          .invoices-table-controls {
            justify-content: center;
            flex-wrap: wrap;
          }

          .invoices-table-search {
            flex: 1 1 145px !important;
            min-width: 0;
            max-width: 100% !important;
          }

          .invoices-table-filter {
            flex: 1 0 100% !important;
            min-width: 100% !important;
            order: 3;
          }

          .invoices-table-refresh {
            order: 2;
          }
        }
      `}</style>
      <div
        className="invoices-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.primary,
            fontFamily: "'Manrope', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "-0.02em",
          }}
        >
          <HandCoins size={24} strokeWidth={1.8} color={C.primary} />
          Client invoices
        </h1>
        {(is("finance") || is("admin")) && (
          <Btn
            v="primary"
            onClick={() => navigate("/invoices/add")}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            <span className="invoices-add-label">Create invoice</span>
          </Btn>
        )}
      </div>
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
                borderRadius: "4px",
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
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="invoices-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="invoices-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoices..."
              style={{
                width: "100%",
                padding: "7px 12px 7px 34px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Search size={16} strokeWidth={2} />
            </span>
          </div>
          <div className="invoices-table-filter" style={{ flex: "0 1 240px", minWidth: "180px" }}>
            <Select<InvoiceStatusFilterOption, false>
              aria-label="Filter invoices by status"
              value={selectedInvoiceStatusFilter}
              onChange={(option) => setInvoiceStatusFilter((option ?? INVOICE_STATUS_FILTER_OPTIONS[0]).value)}
              options={INVOICE_STATUS_FILTER_OPTIONS}
              isSearchable={false}
              styles={invoiceFilterSelectStyles}
            />
          </div>
          <button
            className="invoices-table-refresh"
            type="button"
            aria-label="Refresh invoices"
            title="Refresh invoices"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: "4px",
              background: "transparent",
              color: C.primary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <RefreshCw size={20} strokeWidth={1.9} />
          </button>
        </div>
        <style>{`@keyframes invSpin { to { transform: rotate(360deg); } }`}</style>
        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: "inv-detail", d: (row as (typeof rows)[number]).invoice })}
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
                borderRadius: "4px",
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
                borderRadius: "4px",
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
          A PDF is generated from this invoice and sent to your organization&apos;s{" "}
          <strong>Zoho Sign email</strong> (configured under Admin → Organization). After signing, sync stores the
          signed PDF and marks the invoice as sent.
        </p>
        {!activeOrg?.zohoSignEmail && (
          <p style={{ fontSize: 12, color: C.danger, margin: "0 0 12px" }}>
            Set Zoho Sign email on the active organization before sending.
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setZohoSignConfirm(null)} disabled={zohoSignLoading}>
            Cancel
          </Btn>
          <Btn
            v="invoice"
            onClick={() => void handleConfirmZohoSign()}
            disabled={zohoSignLoading || !activeOrg?.zohoSignEmail}
          >
            {zohoSignLoading ? "Sending…" : "Send for signing"}
          </Btn>
        </div>
      </Mdl>
    </div>
  );
}
