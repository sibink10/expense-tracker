import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BanknoteArrowUp,
  Ban,
  ChevronLeft,
  ChevronRight,
  Check,
  IndianRupee,
  X,
} from "lucide-react";
import type { Advance } from "../../types";
import { C, R, listSectionTableBodyMarginTop, listTableCardStyle, tableIconButtonSx, workflowTableActionStyle } from "../../shared/theme";
import { ADV_S, EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur, nextListSort } from "../../shared/utils";
import {
  Btn,
  Badge,
  Tbl,
  Empty,
  Spinner,
  CollapsibleSearch,
  ListPageHeader,
  ListPageAddButton,
  EditActionButton,
  OverflowStatusTabs,
  useNavPageAdd,
  type TblCol,
} from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getAdvancesMyMapped } from "../../shared/api/advance";
import { advanceRaisedByCurrentUser, canCancelAdvanceRequest, canEditAdvanceRequest } from "../../shared/expensePermissions";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: ADV_S.PENDING, value: "Pending" },
  { label: ADV_S.APPROVED, value: "Approved" },
  { label: ADV_S.DISBURSED, value: "Disbursed" },
  { label: ADV_S.PARTIALLY_DISBURSED, value: "PartiallyDisbursed" },
  { label: ADV_S.REJECTED, value: "Rejected" },
  { label: ADV_S.CANCELLED, value: "Cancelled" },
] as const;

type StatusOption = (typeof STATUS_TABS)[number];

export default function AdvanceListPageContent({
  myOnly,
  isRequest,
  pendingOnly,
  hideHeader,
}: {
  myOnly?: boolean;
  isRequest?: boolean;
  pendingOnly?: boolean;
  hideHeader?: boolean;
}) {
  const useSectionTableSpacing = Boolean(isRequest || (!hideHeader && !pendingOnly));
  const [searchParams, setSearchParams] = useSearchParams();
  const { is, setMdl, user } = useAppContext();
  const myOnlyActual = myOnly ?? false;
  const showActionCol =
    is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN) || is(ROLES.EMPLOYEE);
  const showAddAction = Boolean(isRequest) && (is(ROLES.EMPLOYEE) || is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN));
  const navAdd = useNavPageAdd();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const validStatusValues = new Set<string>(STATUS_TABS.map((tab) => tab.value));
  const statusParam = pendingOnly ? "Pending" : searchParams.get("status") ?? "";
  const status = pendingOnly ? "Pending" : validStatusValues.has(statusParam) ? statusParam : "";
  const [data, setData] = useState<Advance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.ADVANCES_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.ADVANCES_REFRESH, handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdvancesMyMapped({
      page,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      myOnly: myOnlyActual,
      sortBy,
      desc: sortDesc,
    })
      .then((r) => {
        setData(r.items);
        setTotalCount(r.totalCount ?? 0);
        setTotalPages(r.totalPages ?? 0);
      })
      .catch(() => {
        setData([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, status, myOnlyActual, refreshKey, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  const setStatusFilter = (nextStatus: StatusOption["value"]) => {
    if (pendingOnly) return;
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) nextParams.set("status", nextStatus);
    else nextParams.delete("status");
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  const statusTabs: readonly StatusOption[] = pendingOnly
    ? [{ label: ADV_S.PENDING, value: "Pending" }]
    : STATUS_TABS;

  const ADVANCE_TAB_PRIMARY_VALUES = ["", "Pending", "Approved", "Disbursed"];
  const orderedStatusTabs = useMemo(() => {
    if (pendingOnly) return [...statusTabs];
    const byValue = new Map(statusTabs.map((tab) => [tab.value, tab]));
    const primary = ADVANCE_TAB_PRIMARY_VALUES.map((v) => byValue.get(v as StatusOption["value"])).filter(
      (t): t is StatusOption => !!t,
    );
    const rest = statusTabs.filter((t) => !(ADVANCE_TAB_PRIMARY_VALUES as readonly string[]).includes(t.value));
    return [...primary, ...rest];
  }, [pendingOnly, statusTabs]);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);
  const hasSearchOrFilter = Boolean(search.trim() || status);

  const cols: TblCol[] = [
    { label: "ID", sortKey: "AdvanceCode", sx: { textAlign: "left", verticalAlign: "middle" } },
    ...(!is(ROLES.EMPLOYEE)
      ? [{ label: "Employee", sortKey: "Employee", sx: { textAlign: "left", verticalAlign: "middle" } } as TblCol]
      : []),
    { label: "Amount", sortKey: "Amount" },
    { label: "Balance Due", sortKey: "BalanceDue" },
    { label: "Status" },
    ...(showActionCol ? (["Action"] as TblCol[]) : []),
  ];

  const rows = data.map((a) => {
    const canCancelAdvanceRow = canCancelAdvanceRequest(a, user);
    const canEditAdvanceRow = canEditAdvanceRequest(a, user);
    const canSelfApprove = advanceRaisedByCurrentUser(a, user);
    const balanceDue = a.amt - (a.paidAmount ?? 0);

    return {
      advance: a,
      _cells: [
        {
          v: <span style={{ fontWeight: 600, color: C.advance, whiteSpace: "nowrap" }}>{a.id}</span>,
          sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
        },
        ...(!is(ROLES.EMPLOYEE)
          ? [
              {
                v: <span style={{ fontWeight: 600, color: C.primary, whiteSpace: "nowrap" }}>{a.empName || "NA"}</span>,
                sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
              },
            ]
          : []),
        { v: <span style={{ fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>{fmtCur(a.amt)}</span> },
        {
          v: (
            <span style={{ fontWeight: 600, color: balanceDue > 0 ? C.advance : C.muted, whiteSpace: "nowrap" }}>
              {fmtCur(balanceDue)}
            </span>
          ),
        },
        { v: <Badge s={a.status} /> },
        ...(showActionCol
          ? [
              {
                v: (
                  <span
                    role="presentation"
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
                    {(is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                      !canSelfApprove &&
                      a.status !== ADV_S.CANCELLED &&
                      a.status === ADV_S.PENDING && (
                        <>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowTableActionStyle(C.success, C.successBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.ADV_APPROVE, d: a });
                            }}
                          >
                            <Check size={13} strokeWidth={1.9} />
                            Approve
                          </Btn>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE });
                            }}
                          >
                            <X size={13} strokeWidth={1.9} />
                            Reject
                          </Btn>
                        </>
                      )}
                    {(is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                      a.status !== ADV_S.CANCELLED &&
                      (a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED) && (
                        <Btn
                          sm
                          v="ghost"
                          sx={workflowTableActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMdl({ t: MODAL_T.ADV_DISBURSE, d: a });
                          }}
                        >
                          <IndianRupee size={13} strokeWidth={1.9} />
                          Disburse
                        </Btn>
                      )}
                    {canEditAdvanceRow && (
                      <EditActionButton
                        sx={tableIconButtonSx(C.actionEditBg)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMdl({ t: MODAL_T.ADV_EDIT, d: a });
                        }}
                      />
                    )}
                    {canCancelAdvanceRow && (
                      <Btn
                        sm
                        v="ghost"
                        sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMdl({ t: MODAL_T.ADV_CANCEL_CONFIRM, d: a });
                        }}
                      >
                        <Ban size={13} strokeWidth={1.9} />
                        Cancel
                      </Btn>
                    )}
                    {(is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                      a.status !== ADV_S.CANCELLED &&
                      (a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED) && (
                        <Btn
                          sm
                          v="ghost"
                          sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE });
                          }}
                        >
                          <X size={13} strokeWidth={1.9} />
                          Reject
                        </Btn>
                      )}
                  </span>
                ),
                sx: {
                  textAlign: "center" as const,
                  verticalAlign: "middle" as const,
                },
              },
            ]
          : []),
      ],
    };
  });

  return (
        <ListPageHeader
          hidden={hideHeader}
          tableBodyMarginTop={useSectionTableSpacing ? listSectionTableBodyMarginTop : undefined}
          title="Advance Requests"
          icon={<BanknoteArrowUp size={24} strokeWidth={1.8} color={C.primary} />}
          search={
            <CollapsibleSearch
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search advances..."
            />
          }
          addAction={
            showAddAction && navAdd ? (
              <ListPageAddButton addPath={navAdd.addPath} label="Request advance" />
            ) : undefined
          }
        >
      <div className="advances-table-card list-table-card" style={listTableCardStyle}>
        <OverflowStatusTabs
          tabs={orderedStatusTabs}
          value={status}
          onChange={(v) => setStatusFilter(v as StatusOption["value"])}
          visibleCount={4}
          hidden={pendingOnly}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh advances"
        />
        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.ADV_DETAIL, d: (row as (typeof rows)[number]).advance })}
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
                  Loading advances...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching advance requests.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<BanknoteArrowUp size={38} strokeWidth={1.6} />}
                title={hasSearchOrFilter ? "No advance requests found" : "No advance requests"}
                sub={hasSearchOrFilter ? "Try a different search or filter." : "Request your first advance to get started."}
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
    </ListPageHeader>
  );
}
