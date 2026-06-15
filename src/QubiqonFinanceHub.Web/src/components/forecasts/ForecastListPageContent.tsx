import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Check, Send, Target, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Btn,
  CollapsibleSearch,
  EditActionButton,
  Empty,
  Filter,
  ListPageHeader,
  ListPageAddButton,
  Tbl,
  useNavPageAdd,
} from "../ui";
import { C, listSectionTableBodyMarginTop, listTableCardStyle, tableIconButtonSx, workflowTableActionStyle } from "../../shared/theme";
import { approveForecast, getForecastsMapped, submitForecast } from "../../shared/api/forecast";
import type { Forecast } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { canEditForecastRequest } from "../../shared/expensePermissions";

const STATUS_OPTIONS = ["all", "Submitted", "Approved", "Rejected", "Cancelled"];

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function ForecastListPageContent({
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
  const navigate = useNavigate();
  const { t, is, user, setMdl } = useAppContext();
  const [data, setData] = useState<Forecast[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(pendingOnly ? "Submitted" : "all");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [desc, setDesc] = useState(true);
  const myOnlyActual = myOnly ?? false;
  const showAddAction = Boolean(isRequest) && (is(ROLES.EMPLOYEE) || is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN));
  const navAdd = useNavPageAdd();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statusOptions = pendingOnly ? ["Submitted"] : STATUS_OPTIONS;
  const statusForApi = pendingOnly ? "Submitted" : status === "all" ? undefined : status;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getForecastsMapped({
        page: 1,
        pageSize: 100,
        search: search || undefined,
        status: statusForApi,
        myOnly: myOnlyActual,
        sortBy,
        desc,
      });
      setData(res.items);
    } finally {
      setLoading(false);
    }
  }, [desc, myOnlyActual, search, sortBy, statusForApi]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener(EVENTS.FORECASTS_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.FORECASTS_REFRESH, handler);
  }, [load]);

  const canReview = is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN);

  const rows = useMemo(
    () =>
      data.map((forecast) => ({
        forecast,
        _cells: [
          { v: <span style={{ fontWeight: 600, color: C.primary }}>{forecast.title}</span> },
          { v: formatMoney(forecast.expectedAmount), sx: { whiteSpace: "nowrap" as const } },
          { v: forecast.expectedExpenseDate, sx: { whiteSpace: "nowrap" as const } },
          { v: <Badge s={forecast.status} />, sx: { textAlign: "center" as const, verticalAlign: "middle" as const } },
          { v: forecast.createdBy },
          { v: forecast.createdAt, sx: { whiteSpace: "nowrap" as const } },
          { v: forecast.expensesRaised, sx: { textAlign: "center" as const, verticalAlign: "middle" as const } },
          {
            v: (
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "nowrap", minHeight: 36, alignItems: "center", overflowX: "auto", width: "100%" }}>
                {canEditForecastRequest(forecast, user) && (
                  <EditActionButton
                    sx={tableIconButtonSx(C.actionEditBg)}
                    disabled={!!actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/forecasts/${forecast.id}/edit`);
                    }}
                  />
                )}
                {forecast.status === "Draft" && (
                  <Btn
                    sm
                    v="ghost"
                    sx={workflowTableActionStyle(C.success, C.successBg)}
                    disabled={!!actionLoading}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActionLoading("submit");
                      try {
                        await submitForecast(forecast.id);
                        t("Forecast submitted");
                        load();
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                  >
                    <Send size={14} />
                    {actionLoading === "submit" ? "Submitting..." : "Submit"}
                  </Btn>
                )}
                {forecast.status === "Submitted" && forecast.createdByEmployeeId === user?.id && (
                  <Btn
                    sm
                    v="ghost"
                    sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                    disabled={!!actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMdl({ t: MODAL_T.FORECAST_CANCEL_CONFIRM, d: forecast });
                    }}
                  >
                    <Ban size={14} />
                    Cancel
                  </Btn>
                )}
                {canReview && forecast.status === "Submitted" && forecast.createdByEmployeeId !== user?.id && (
                  <>
                    <Btn
                      sm
                      v="ghost"
                      sx={workflowTableActionStyle(C.success, C.successBg)}
                      disabled={!!actionLoading}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActionLoading("approve");
                        try {
                          await approveForecast(forecast.id);
                          t("Forecast approved");
                          load();
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                    >
                      <Check size={14} />
                      {actionLoading === "approve" ? "Approving..." : "Approve"}
                    </Btn>
                    <Btn
                      sm
                      v="ghost"
                      sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                      disabled={!!actionLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMdl({ t: MODAL_T.REJECT, d: forecast, it: ITEM_T.FORECAST });
                      }}
                    >
                      <X size={14} />
                      Reject
                    </Btn>
                  </>
                )}
              </div>
            ),
            sx: { textAlign: "center" as const, verticalAlign: "middle" as const },
          },
        ],
      })),
    [actionLoading, canReview, data, navigate, setMdl, t, user],
  );

  const onSortChange = (nextSort: string) => {
    if (sortBy === nextSort) setDesc((v) => !v);
    else {
      setSortBy(nextSort);
      setDesc(true);
    }
  };

  return (
        <ListPageHeader
          hidden={hideHeader}
          tableBodyMarginTop={useSectionTableSpacing ? listSectionTableBodyMarginTop : undefined}
          title="Forecast Management"
          icon={<Target size={24} strokeWidth={1.8} color={C.primary} />}
          search={<CollapsibleSearch value={search} onChange={setSearch} placeholder="Search forecasts..." />}
          addAction={
            showAddAction && navAdd ? (
              <ListPageAddButton addPath={navAdd.addPath} label="Add forecast" />
            ) : undefined
          }
        >
      <div className="forecasts-table-card list-table-card" style={listTableCardStyle}>
        <Filter
          status={status}
          onStatus={pendingOnly ? () => undefined : setStatus}
          opts={statusOptions}
          onRefresh={load}
          refreshDisabled={loading}
          hidden={pendingOnly}
        />
        <Tbl
          cols={[
            { label: "Forecast title", sortKey: "Title" },
            { label: "Expected amount", sortKey: "ExpectedAmount" },
            { label: "Expected date", sortKey: "ExpectedExpenseDate" },
            { label: "Status", sortKey: "Status", sx: { textAlign: "center" } },
            { label: "Created by", sortKey: "CreatedBy" },
            { label: "Created date", sortKey: "CreatedAt" },
            { label: "Expenses raised", sx: { textAlign: "center" } },
            { label: "Actions", sx: { textAlign: "center" } },
          ]}
          rows={rows}
          onRow={(row) => navigate(`/forecasts/${(row as (typeof rows)[number]).forecast.id}`)}
          sortBy={sortBy}
          sortDesc={desc}
          onSortChange={onSortChange}
          bodyFallback={<Empty icon={<Target />} title={loading ? "Loading forecasts..." : "No forecasts"} sub={search ? "Try a different search term." : "Create a forecast to get started."} />}
        />
      </div>
    </ListPageHeader>
  );
}
