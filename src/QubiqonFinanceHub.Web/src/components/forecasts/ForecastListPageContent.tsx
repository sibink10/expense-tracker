import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, Send, Target, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Btn,
  CollapsibleSearch,
  Empty,
  Filter,
  ListPageHeader,
  ListPageAddButton,
  Tbl,
  useNavPageAdd,
} from "../ui";
import { C } from "../../shared/theme";
import { approveForecast, cancelForecast, getForecastsMapped, rejectForecast, submitForecast } from "../../shared/api/forecast";
import type { Forecast } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { ROLES } from "../../shared/constants";

const STATUS_OPTIONS = ["all", "Draft", "Submitted", "Approved", "Rejected", "Cancelled"];

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const workflowActionStyle = (fg: string, bg: string) => ({
  borderRadius: "4px",
  background: bg,
  color: fg,
  padding: "6px 8px",
  minHeight: 26,
});

export default function ForecastListPageContent({ myOnly, isRequest, pendingOnly, hideHeader }: { myOnly?: boolean; isRequest?: boolean; pendingOnly?: boolean; hideHeader?: boolean }) {
  const navigate = useNavigate();
  const { t, is, user } = useAppContext();
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

  const canReview = is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN);

  const rows = useMemo(
    () =>
      data.map((forecast) => ({
        forecast,
        _cells: [
          { v: <span style={{ fontWeight: 600, color: C.primary }}>{forecast.title}</span> },
          { v: forecast.purpose },
          { v: formatMoney(forecast.expectedAmount), sx: { whiteSpace: "nowrap" as const } },
          { v: forecast.expectedExpenseDate, sx: { whiteSpace: "nowrap" as const } },
          { v: <Badge s={forecast.status} />, sx: { textAlign: "center" as const, verticalAlign: "middle" as const } },
          { v: forecast.createdBy },
          { v: forecast.createdAt, sx: { whiteSpace: "nowrap" as const } },
          { v: forecast.expensesRaised, sx: { textAlign: "center" as const, verticalAlign: "middle" as const } },
          {
            v: (
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "nowrap", minHeight: 36, alignItems: "center", overflowX: "auto" }}>
                {forecast.status === "Draft" && (
                  <Btn
                    sm
                    v="ghost"
                    sx={workflowActionStyle(C.success, C.successBg)}
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
                    sx={workflowActionStyle(C.danger, C.dangerBg)}
                    disabled={!!actionLoading}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActionLoading("cancel");
                      try {
                        await cancelForecast(forecast.id);
                        t("Forecast cancelled");
                        load();
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                  >
                    <X size={14} />
                    {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
                  </Btn>
                )}
                {canReview && forecast.status === "Submitted" && forecast.createdByEmployeeId !== user?.id && (
                  <>
                    <Btn
                      sm
                      v="ghost"
                      sx={workflowActionStyle(C.success, C.successBg)}
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
                      sx={workflowActionStyle(C.danger, C.dangerBg)}
                      disabled={!!actionLoading}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const reason = window.prompt("Rejection reason");
                        if (!reason?.trim()) return;
                        setActionLoading("reject");
                        try {
                          await rejectForecast(forecast.id, reason.trim());
                          t("Forecast rejected");
                          load();
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                    >
                      <X size={14} />
                      {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                    </Btn>
                  </>
                )}
              </div>
            ),
            sx: { textAlign: "right" as const },
          },
        ],
      })),
    [canReview, data, load, navigate, t, user],
  );

  const onSortChange = (nextSort: string) => {
    if (sortBy === nextSort) setDesc((v) => !v);
    else {
      setSortBy(nextSort);
      setDesc(true);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {!hideHeader && (
        <ListPageHeader
          title="Forecast management"
          icon={<Target size={22} color={C.text} strokeWidth={1.8} />}
          search={<CollapsibleSearch value={search} onChange={setSearch} placeholder="Search forecasts..." />}
          addAction={
            showAddAction && navAdd ? (
              <ListPageAddButton addPath={navAdd.addPath} label="Add forecast" />
            ) : undefined
          }
        />
      )}
      <div style={{ background: "#fff", borderRadius: "4px", padding: "16px", boxShadow: "-5px -2px 108.5px 0px #00024914" }}>
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
            { label: "Purpose", sortKey: "Purpose" },
            { label: "Expected amount", sortKey: "ExpectedAmount" },
            { label: "Expected date", sortKey: "ExpectedExpenseDate" },
            { label: "Status", sortKey: "Status", sx: { textAlign: "center" } },
            { label: "Created by", sortKey: "CreatedBy" },
            { label: "Created date", sortKey: "CreatedAt" },
            { label: "Expenses raised", sx: { textAlign: "center" } },
            { label: "Actions", sx: { textAlign: "right" } },
          ]}
          rows={rows}
          onRow={(row) => navigate(`/forecasts/${(row as (typeof rows)[number]).forecast.id}`)}
          sortBy={sortBy}
          sortDesc={desc}
          onSortChange={onSortChange}
          bodyFallback={<Empty icon={<Target />} title={loading ? "Loading forecasts..." : "No forecasts"} sub={search ? "Try a different search term." : "Create a forecast to get started."} />}
        />
      </div>
    </div>
  );
}
