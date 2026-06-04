import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BarChart3, ClipboardList, FileText, HandCoins, ReceiptText, WalletCards, type LucideIcon } from "lucide-react";
import Select, { type StylesConfig } from "react-select";
import { C, R } from "../../shared/theme";
import { useAppContext } from "../../context/AppContext";
import { getDashboard, type DashboardData, type DashboardPeriod } from "../../shared/api/dashboard";
import {
  dashboardSectionsForRole,
  dashboardSubtitleForRole,
  isDashboardSectionVisible,
  type DashboardSection,
} from "../../shared/dashboardVisibility";
import type { UserRole } from "../../types";
import { Spinner } from "../ui";
import PageShell from "../PageShell";
import { ROLES } from "../../shared/constants";

type DashboardSegment = {
  label: string;
  numericValue: number;
  displayValue?: number | string;
  color: string;
};

type BarItem = {
  label: string;
  value: number;
  color?: string;
  valueLabel?: string;
};

type SummaryStat = {
  section: DashboardSection;
  label: string;
  value: number | string;
  badge?: { text: string; tone: "urgent" | "due" | "pending" | "unpaid" };
};

const CARD_SHADOW = C.cardShadow;
const CHART_EMPTY = "#E5E8F0";
const TEAL = "#61CDA6";
const ORANGE = "#FF914D";
const YELLOW = "#E4C54A";

const BADGE_STYLES = {
  urgent: { color: "#C62828", background: "#FCE8E8" },
  due: { color: "#C62828", background: "#FCE8E8" },
  pending: { color: "#2563EB", background: "#E8F0FE" },
  unpaid: { color: "#B45309", background: "#FEF3E2" },
} as const;

type CurrencyOption = { value: string; label: string };
type PeriodOption = { value: DashboardPeriod; label: string };

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "total", label: "Total" },
  { value: "month", label: "Month wise" },
];

const dashboardSelectStylesBase = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    minHeight: 36,
    height: 36,
    borderRadius: R.control,
    border: "none",
    boxShadow: "0px 2px 3px 0px #253EA70A",
    backgroundColor: "#fff",
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    cursor: "pointer",
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: "0 12px",
    height: 34,
  }),
  indicatorsContainer: (base: Record<string, unknown>) => ({
    ...base,
    height: 34,
    paddingRight: 8,
  }),
  dropdownIndicator: (base: Record<string, unknown>) => ({
    ...base,
    padding: 4,
    color: C.muted,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: C.primary,
    fontSize: 12,
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    borderRadius: R.control,
    boxShadow: C.cardShadow,
    overflow: "hidden",
    zIndex: 30,
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    background: state.isSelected ? C.successBg : state.isFocused ? C.surface : "#fff",
    color: state.isSelected ? C.success : C.primary,
  }),
};

const dashboardPeriodSelectStyles = dashboardSelectStylesBase as StylesConfig<PeriodOption, false>;
const dashboardCurrencySelectStyles = dashboardSelectStylesBase as StylesConfig<CurrencyOption, false>;

function formatCurrencySummary(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatCompactCurrency(amount: number, currency = "INR"): string {
  const abs = Math.abs(amount);
  const sym =
    currency === "INR"
      ? "₹"
      : (() => {
          try {
            return (
              new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
                .formatToParts(0)
                .find((p) => p.type === "currency")?.value ?? currency
            );
          } catch {
            return currency;
          }
        })();

  if (currency === "INR") {
    if (abs >= 1e7) return `${sym}${(amount / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
    if (abs >= 1e5) return `${sym}${(amount / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
    if (abs >= 1e3) return `${sym}${(amount / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return formatCurrencySummary(amount, currency);
}

function sliceValue(slices: { label: string; value: number }[] | undefined, label: string): number {
  const match = slices?.find((s) => s.label.toLowerCase() === label.toLowerCase());
  return Number(match?.value ?? 0);
}

function sumSliceValues(slices: { label: string; value: number }[] | undefined, excludeLabels: string[] = []): number {
  const exclude = new Set(excludeLabels.map((l) => l.toLowerCase()));
  return (slices ?? []).reduce((sum, s) => {
    if (exclude.has(s.label.toLowerCase())) return sum;
    return sum + Number(s.value ?? 0);
  }, 0);
}

function barItemsFromSlices(
  slices: { label: string; value: number }[] | undefined,
  order: string[],
  highlightLabels: string[] = [],
): BarItem[] {
  const byLabel = new Map((slices ?? []).map((s) => [s.label.toLowerCase(), Number(s.value ?? 0)]));
  return order.map((label) => ({
    label,
    value: byLabel.get(label.toLowerCase()) ?? 0,
    color: highlightLabels.some((h) => h.toLowerCase() === label.toLowerCase()) ? ORANGE : TEAL,
  }));
}

function hasBarChartData(items: BarItem[]): boolean {
  return items.some((item) => item.value > 0);
}

function hasDonutChartData(segments: DashboardSegment[]): boolean {
  return segments.some((segment) => segment.numericValue > 0);
}

function clientRevenueBars(
  slices: { label: string; value: number }[] | undefined,
  currency: string,
): BarItem[] {
  const list = (slices ?? []).filter((s) => Number(s.value ?? 0) > 0);
  if (list.length === 0) return [];
  return list.map((s) => {
    const v = Number(s.value ?? 0);
    return {
      label: s.label,
      value: v,
      color: TEAL,
      valueLabel: formatCompactCurrency(v, currency),
    };
  });
}

function DonutChart({ segments }: { segments: DashboardSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.numericValue, 0);
  let cursor = 0;
  const gradient =
    total > 0
      ? segments
          .filter((segment) => segment.numericValue > 0)
          .map((segment) => {
            const start = cursor;
            const end = cursor + (segment.numericValue / total) * 100;
            cursor = end;
            return `${segment.color} ${start}% ${end}%`;
          })
          .join(", ")
      : `${CHART_EMPTY} 0% 100%`;

  return (
    <div
      style={{
        width: 146,
        height: 146,
        borderRadius: "50%",
        background: `conic-gradient(${gradient})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 94, height: 94, borderRadius: "50%", background: "#fff" }} />
    </div>
  );
}

function StatusBadge({ text, tone }: { text: string; tone: keyof typeof BADGE_STYLES }) {
  const style = BADGE_STYLES[tone];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        lineHeight: "14px",
        padding: "3px 8px",
        borderRadius: R.control,
        color: style.color,
        background: style.background,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function SummaryCard({ label, value, badge }: Omit<SummaryStat, "section">) {
  return (
    <div
      style={{
        background: "#fff",
        border: "none",
        borderRadius: R.control,
        boxShadow: CARD_SHADOW,
        padding: "16px 20px",
        minHeight: 88,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 20 }}>{badge && <StatusBadge {...badge} />}</div>
      <div>
        <div style={{ color: C.primary, fontSize: 22, fontWeight: 600, lineHeight: "30px" }}>{value}</div>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 400, lineHeight: "16px", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 200,
        padding: "24px 16px",
        color: C.muted,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#EEF1F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BarChart3 size={24} strokeWidth={1.6} color={C.muted} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>No data found</span>
      <span style={{ fontSize: 11, textAlign: "center", maxWidth: 220, lineHeight: "16px" }}>
        Nothing to show for the selected period.
      </span>
    </div>
  );
}

function ChartCardHeader({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: C.primary,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: "18px",
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
      {title}
    </div>
  );
}

function HorizontalBarChart({
  items,
  maxScale,
  showValueLabels = false,
}: {
  items: BarItem[];
  maxScale?: number;
  showValueLabels?: boolean;
}) {
  const max = Math.max(maxScale ?? 0, ...items.map((i) => i.value), 1);
  const labelCol = showValueLabels ? "100px 1fr auto" : "100px 1fr";

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
      {items.map((item) => {
        const widthPct = item.value > 0 ? Math.max((item.value / max) * 100, 4) : 0;
        return (
          <div
            key={item.label}
            style={{ display: "grid", gridTemplateColumns: labelCol, alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 11, color: C.muted, lineHeight: "14px" }}>{item.label}</span>
            <div style={{ height: 22, borderRadius: 4, background: "#EEF1F6", overflow: "hidden" }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: item.value > 0 ? (item.color ?? TEAL) : CHART_EMPTY,
                  transition: "width 0.25s ease",
                }}
              />
            </div>
            {showValueLabels && (
              <span style={{ fontSize: 10, color: C.primary, whiteSpace: "nowrap", minWidth: 48, textAlign: "right" }}>
                {item.valueLabel ?? ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
  minHeight = 280,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "none",
        borderRadius: R.control,
        boxShadow: CARD_SHADOW,
        minHeight,
        padding: "16px 18px 18px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChartCardHeader title={title} icon={icon} />
      {children}
    </div>
  );
}

function BillsDonutCard({ segments }: { segments: DashboardSegment[] }) {
  const hasData = hasDonutChartData(segments);

  return (
    <ChartCard title="Bills to pay" icon={FileText} minHeight={320}>
      {hasData ? (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24, flex: 1, alignItems: "center" }}>
            <DonutChart segments={segments} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px 20px",
              marginTop: 20,
            }}
          >
            {segments
              .filter((segment) => segment.numericValue > 0)
              .map((segment) => (
                <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: segment.color, flexShrink: 0 }} />
                  {segment.label}
                </div>
              ))}
          </div>
        </>
      ) : (
        <ChartEmptyState />
      )}
    </ChartCard>
  );
}

const EXPENSE_BAR_ORDER = [
  "Pending",
  "Approved",
  "Awaiting payment",
  "Partially paid",
  "Completed",
  "Cancelled",
  "Rejected",
];

const ADVANCE_BAR_ORDER = ["Pending", "Approved", "Disbursed", "Partially paid", "Rejected"];

const INVOICE_BAR_ORDER = ["Draft", "Sent", "Paid", "Partially paid", "Overdue"];

function billsPayableSegments(slices: { label: string; value: number }[] | undefined): DashboardSegment[] {
  const list = slices ?? [];
  if (list.length === 0 || list.every((s) => Number(s.value ?? 0) === 0)) {
    return [];
  }
  const colorByLabel: Record<string, string> = {
    approved: TEAL,
    "partially paid": YELLOW,
    overdue: ORANGE,
  };
  return list.map((s) => {
    const v = Number(s.value ?? 0);
    const key = s.label.toLowerCase();
    return {
      label: s.label,
      numericValue: v,
      color: colorByLabel[key] ?? TEAL,
    };
  });
}

const dashboardCss = `
  @media (max-width: 1100px) {
    .dashboard-header {
      align-items: flex-start !important;
      flex-direction: column !important;
    }
    .dashboard-header-controls {
      max-width: none !important;
      width: 100% !important;
      flex-wrap: wrap !important;
    }
    .dashboard-header-controls > div {
      flex: 1 1 140px !important;
      min-width: 140px !important;
    }
    .dashboard-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    .dashboard-charts-row {
      grid-template-columns: 1fr 1fr !important;
    }
    .dashboard-charts-row .dashboard-bills-card {
      grid-column: 1 / -1;
    }
    .dashboard-expense-row {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 620px) {
    .dashboard-summary-grid,
    .dashboard-charts-row {
      grid-template-columns: 1fr !important;
    }
  }
`;

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const emptyInvoiceCounts = { draft: 0, sent: 0, partiallyPaid: 0, paid: 0, overdue: 0 };

function buildSummaryStats(d: DashboardData, displayCurrency: string, role: UserRole): SummaryStat[] {
  const visible = dashboardSectionsForRole(role);
  const stats: SummaryStat[] = [];

  if (visible.has("pendingApprovals")) {
    const urgent = sliceValue(d.expenseSlices, "Pending");
    stats.push({
      section: "pendingApprovals",
      label: "Pending approvals",
      value: Number(d.pendingApprovals ?? 0),
      badge:
        urgent > 0
          ? { text: `${urgent} Urgent`, tone: "urgent" }
          : undefined,
    });
  }

  if (visible.has("billsToPay")) {
    const due = sliceValue(d.billsPayableSlices, "Overdue");
    stats.push({
      section: "billsToPay",
      label: "Bills to pay",
      value: formatCompactCurrency(Number(d.billsToPayAmount ?? 0), displayCurrency),
      badge: due > 0 ? { text: `${due} Due`, tone: "due" } : undefined,
    });
  }

  if (visible.has("advances")) {
    const activeAdvances = sumSliceValues(d.advanceSlices, ["Rejected"]);
    const pendingAdv = sliceValue(d.advanceSlices, "Pending");
    stats.push({
      section: "advances",
      label: "Active advances",
      value: activeAdvances,
      badge: pendingAdv > 0 ? { text: `${pendingAdv} pending`, tone: "pending" } : undefined,
    });
  }

  if (visible.has("receivable")) {
    const recv = Number(d.receivableOutstanding ?? d.totalReceivable ?? 0);
    const unpaidClients = (d.receivablesByClient ?? []).filter((c) => Number(c.value ?? 0) > 0).length;
    stats.push({
      section: "receivable",
      label: "Receivables",
      value: formatCompactCurrency(recv, displayCurrency),
      badge: unpaidClients > 0 ? { text: `${unpaidClients} Unpaid`, tone: "unpaid" } : undefined,
    });
  }

  return stats;
}

const DEFAULT_REPORT_CURRENCY = "INR";

export default function DashPage() {
  const { user } = useAppContext();
  const [reportCurrency, setReportCurrency] = useState(DEFAULT_REPORT_CURRENCY);
  const [chartPeriod, setChartPeriod] = useState<DashboardPeriod>("total");
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([DEFAULT_REPORT_CURRENCY]);
  const [now, setNow] = useState(() => new Date());
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsRefreshing, setChartsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = useMemo(() => user.name?.split(" ")[0] || "there", [user.name]);
  const greeting = getTimeGreeting(now);

  const myOnly = user.role === ROLES.EMPLOYEE;
  const showReceivableCurrency = isDashboardSectionVisible(user.role, "receivable");
  const subtitle = dashboardSubtitleForRole(user.role);
  const visible = dashboardSectionsForRole(user.role);

  const load = useCallback(
    (currency: string, period: DashboardPeriod, initialLoad = false) => {
      if (initialLoad) setLoading(true);
      else setChartsRefreshing(true);
      setError(null);
      void getDashboard({ myOnly, reportCurrency: currency, period })
        .then((data) => {
          setDash(data);
          const fromApi = data.availableReportCurrencies ?? [];
          if (fromApi.length > 0) {
            setCurrencyOptions(fromApi);
            if (!fromApi.includes(currency)) {
              const fallback = fromApi.includes(DEFAULT_REPORT_CURRENCY)
                ? DEFAULT_REPORT_CURRENCY
                : fromApi[0];
              setReportCurrency(fallback);
            }
          }
        })
        .catch(() => {
          setError("Could not load dashboard.");
          setDash(null);
        })
        .finally(() => {
          setLoading(false);
          setChartsRefreshing(false);
        });
    },
    [myOnly],
  );

  const isFirstLoad = useRef(true);

  useEffect(() => {
    const initial = isFirstLoad.current;
    if (initial) isFirstLoad.current = false;
    load(reportCurrency, chartPeriod, initial);
  }, [load, reportCurrency, chartPeriod]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const displayCurrency = dash?.displayCurrency?.trim() || reportCurrency || DEFAULT_REPORT_CURRENCY;

  const summaryStats = useMemo(
    () => (dash ? buildSummaryStats(dash, displayCurrency, user.role) : []),
    [dash, displayCurrency, user.role],
  );

  const chartMaxScale = 12;

  const invoiceBars = useMemo(() => {
    if (!dash) return [];
    const ic = dash.invoiceCounts ?? emptyInvoiceCounts;
    const byLabel: Record<string, number> = {
      draft: ic.draft,
      sent: ic.sent,
      paid: ic.paid,
      "partially paid": ic.partiallyPaid,
      overdue: ic.overdue,
    };
    return INVOICE_BAR_ORDER.map((label) => ({
      label,
      value: byLabel[label.toLowerCase()] ?? 0,
      color: label.toLowerCase() === "partially paid" ? ORANGE : TEAL,
    }));
  }, [dash]);

  const advanceBars = useMemo(
    () =>
      dash
        ? barItemsFromSlices(dash.advanceSlices, ADVANCE_BAR_ORDER, ["Pending"])
        : [],
    [dash],
  );

  const expenseBars = useMemo(
    () => (dash ? barItemsFromSlices(dash.expenseSlices, EXPENSE_BAR_ORDER) : []),
    [dash],
  );

  const clientRevenueBarItems = useMemo(
    () => (dash ? clientRevenueBars(dash.clientRevenueByClient, displayCurrency) : []),
    [dash, displayCurrency],
  );

  const billSegments = useMemo(
    () => (dash ? billsPayableSegments(dash.billsPayableSlices) : []),
    [dash],
  );

  const showChartsRow =
    visible.has("invoices") || visible.has("advances") || visible.has("bills");
  const showBottomRow = visible.has("expenses") || visible.has("receivablesChart");
  const bottomColumnCount =
    (visible.has("expenses") ? 1 : 0) + (visible.has("receivablesChart") ? 1 : 0);

  const summaryColumnCount = Math.min(Math.max(summaryStats.length, 1), 4);

  const currencySelectOptions = useMemo<CurrencyOption[]>(
    () => currencyOptions.map((code) => ({ value: code, label: code })),
    [currencyOptions],
  );

  const selectedCurrencyOption = useMemo(
    () =>
      currencySelectOptions.find((o) => o.value === reportCurrency) ?? {
        value: reportCurrency,
        label: reportCurrency,
      },
    [currencySelectOptions, reportCurrency],
  );

  const selectedPeriodOption = useMemo(
    () => PERIOD_OPTIONS.find((o) => o.value === chartPeriod) ?? PERIOD_OPTIONS[0],
    [chartPeriod],
  );

  const showHeaderChartControls = showChartsRow || showBottomRow;

  return (
    <PageShell
      surface
      header={
      <div
        className="dashboard-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          paddingBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 12px", color: C.primary, fontSize: 24, fontWeight: 600, lineHeight: "32px" }}>
            {greeting} {firstName}!
          </h1>
          <p style={{ margin: 0, color: C.primary, fontSize: 12, fontWeight: 400, lineHeight: "18px" }}>
            {subtitle}
          </p>
        </div>

        {showHeaderChartControls && (
          <div
            className="dashboard-header-controls"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ width: 150, minWidth: 140 }}>
              <Select<PeriodOption, false>
                inputId="dashboard-chart-period"
                aria-label="Chart period"
                value={selectedPeriodOption}
                onChange={(option) => {
                  if (option?.value) setChartPeriod(option.value);
                }}
                options={PERIOD_OPTIONS}
                isSearchable={false}
                isClearable={false}
                styles={dashboardPeriodSelectStyles}
                classNamePrefix="dashboard-period-select"
              />
            </div>
            {showReceivableCurrency && (
              <div style={{ width: 150, minWidth: 120 }}>
                <Select<CurrencyOption, false>
                  inputId="dashboard-report-currency"
                  aria-label="Report currency"
                  value={selectedCurrencyOption}
                  onChange={(option) => {
                    if (option?.value) setReportCurrency(option.value);
                  }}
                  options={currencySelectOptions}
                  isSearchable
                  isClearable={false}
                  styles={dashboardCurrencySelectStyles}
                  classNamePrefix="dashboard-currency-select"
                />
              </div>
            )}
          </div>
        )}
      </div>
      }
    >
      <style>{dashboardCss}</style>
      {loading && (
        <div
          style={{
            flex: 1,
            minHeight: "min(60vh, 520px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: C.muted,
          }}
        >
          <Spinner size={22} />
          <span style={{ fontSize: 13 }}>Loading dashboard…</span>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: R.control,
            background: "#fff",
            boxShadow: CARD_SHADOW,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: C.primary, fontSize: 13 }}>{error}</span>
          <button
            type="button"
            onClick={() => load(reportCurrency, chartPeriod, true)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: R.control,
              background: "#fff",
              color: C.accent,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && dash && (
        <>
          {summaryStats.length > 0 && (
            <div
              className="dashboard-summary-grid"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${summaryColumnCount}, minmax(0, 1fr))`,
                gap: 20,
                marginBottom: 22,
              }}
            >
              {summaryStats.map((stat) => (
                <SummaryCard key={stat.section} label={stat.label} value={stat.value} badge={stat.badge} />
              ))}
            </div>
          )}

          {(showChartsRow || showBottomRow) && (
            <div style={{ position: "relative", opacity: chartsRefreshing ? 0.55 : 1, transition: "opacity 0.2s ease" }}>
              {chartsRefreshing && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                >
                  <Spinner size={20} />
                </div>
              )}

              {showChartsRow && (
                <div
                  className="dashboard-charts-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 20,
                    marginBottom: 22,
                    alignItems: "stretch",
                  }}
                >
                  {visible.has("invoices") && (
                    <ChartCard title="Invoices" icon={ClipboardList}>
                      {hasBarChartData(invoiceBars) ? (
                        <HorizontalBarChart items={invoiceBars} maxScale={chartMaxScale} />
                      ) : (
                        <ChartEmptyState />
                      )}
                    </ChartCard>
                  )}
                  {visible.has("advances") && (
                    <ChartCard title="Advances" icon={HandCoins}>
                      {hasBarChartData(advanceBars) ? (
                        <HorizontalBarChart items={advanceBars} maxScale={chartMaxScale} />
                      ) : (
                        <ChartEmptyState />
                      )}
                    </ChartCard>
                  )}
                  {visible.has("bills") && (
                    <div className="dashboard-bills-card">
                      <BillsDonutCard segments={billSegments} />
                    </div>
                  )}
                </div>
              )}

              {showBottomRow && (
                <div
                  className="dashboard-expense-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(bottomColumnCount, 1)}, minmax(0, 1fr))`,
                    gap: 20,
                    alignItems: "stretch",
                  }}
                >
                  {visible.has("expenses") && (
                    <ChartCard title="Expense overview" icon={ReceiptText} minHeight={300}>
                      {hasBarChartData(expenseBars) ? (
                        <HorizontalBarChart items={expenseBars} maxScale={chartMaxScale} />
                      ) : (
                        <ChartEmptyState />
                      )}
                    </ChartCard>
                  )}
                  {visible.has("receivablesChart") && (
                    <ChartCard title="Client revenue" icon={WalletCards} minHeight={300}>
                      {hasBarChartData(clientRevenueBarItems) ? (
                        <HorizontalBarChart items={clientRevenueBarItems} showValueLabels />
                      ) : (
                        <ChartEmptyState />
                      )}
                    </ChartCard>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
