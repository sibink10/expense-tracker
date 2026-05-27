import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ClipboardList, FileText, HandCoins, ReceiptText, WalletCards, type LucideIcon } from "lucide-react";
import Select, { type StylesConfig } from "react-select";
import { useNavigate } from "react-router-dom";
import { C, R } from "../../shared/theme";
import { useAppContext } from "../../context/AppContext";
import { getDashboard, type DashboardData } from "../../shared/api/dashboard";
import { Spinner } from "../ui";

type DashboardSegment = {
  label: string;
  /** Used for donut slice proportions */
  numericValue: number;
  /** Shown in legend */
  displayValue?: number | string;
  color: string;
};

type OverviewCard = {
  title: string;
  icon: LucideIcon;
  to: string;
  segments: DashboardSegment[];
};

const CARD_SHADOW = "-5px -2px 108.5px 0px #00024914";
const CHART_EMPTY = "#E5E8F0";
const GREEN = "#61CDA6";
const ORANGE = "#FF914D";
const YELLOW = "#E4C54A";
const DARK = "#242424";
const BLUE = "#6366F1";
const SLICE_PALETTE = [ORANGE, GREEN, YELLOW, DARK, BLUE, "#A855F7", "#14B8A6", "#EC4899"];

type CurrencyOption = { value: string; label: string };

const dashboardCurrencySelectStyles: StylesConfig<CurrencyOption, false> = {
  control: (base) => ({
    ...base,
    minHeight: 36,
    height: 36,
    borderRadius: 999,
    border: "none",
    boxShadow: "0px 2px 3px 0px #253EA70A",
    backgroundColor: "#fff",
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    cursor: "pointer",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 12px",
    height: 34,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: 34,
    paddingRight: 8,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: 4,
    color: C.muted,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  singleValue: (base) => ({
    ...base,
    color: C.primary,
    fontSize: 12,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: R.control,
    boxShadow: C.cardShadow,
    overflow: "hidden",
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    background: state.isSelected ? C.successBg : state.isFocused ? C.surface : "#fff",
    color: state.isSelected ? C.success : C.primary,
  }),
};

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

function segmentDisplay(seg: DashboardSegment): number | string {
  return seg.displayValue !== undefined ? seg.displayValue : seg.numericValue;
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
      <div
        style={{
          width: 94,
          height: 94,
          borderRadius: "50%",
          background: "#fff",
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "none",
        borderRadius: R.control,
        boxShadow: CARD_SHADOW,
        padding: "14px 20px",
        minHeight: 78,
        boxSizing: "border-box",
      }}
    >
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 400, lineHeight: "16px" }}>{label}</div>
      <div style={{ color: C.primary, fontSize: 20, fontWeight: 500, lineHeight: "28px", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function OverviewCard({ title, icon: Icon, segments, to }: OverviewCard) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#fff",
        border: "none",
        borderRadius: R.control,
        boxShadow: CARD_SHADOW,
        minHeight: 346,
        padding: "16px 18px 14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <Icon size={20} strokeWidth={1.8} />
        {title}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <DonutChart segments={segments} />
      </div>

      <div style={{ display: "grid", gap: 5, marginTop: "auto", paddingTop: 20 }}>
        {segments.map((segment) => {
          const shown = segmentDisplay(segment);
          const showLegendValue = typeof shown === "number" ? true : shown !== "";
          return (
            <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.muted }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: segment.color,
                  flexShrink: 0,
                }}
              />
              <span>{segment.label}</span>
              {showLegendValue && <span style={{ color: C.primary, marginLeft: 4 }}>{shown}</span>}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => navigate(to)}
        style={{
          alignSelf: "flex-end",
          marginTop: 14,
          border: "none",
          borderRadius: R.control,
          background: C.accent,
          color: "#fff",
          fontSize: 10,
          fontWeight: 600,
          lineHeight: "14px",
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        View All
      </button>
    </div>
  );
}

const dashboardCss = `
  @media (max-width: 920px) {
    .dashboard-header {
      align-items: flex-start !important;
      flex-direction: column !important;
    }
    .dashboard-currency {
      max-width: none !important;
      width: 100% !important;
    }
    .dashboard-summary-grid,
    .dashboard-overview-grid {
      grid-template-columns: 1fr 1fr !important;
    }
  }

  @media (max-width: 620px) {
    .dashboard-summary-grid,
    .dashboard-overview-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const pageStyle: CSSProperties = {
  background: C.surface,
  /** Match layout main height so flex children (loading) can fill space below the greeting */
  minHeight: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const emptyInvoiceCounts = { draft: 0, sent: 0, partiallyPaid: 0, paid: 0, overdue: 0 };

/** API dashboard slices carry row counts for expense / advances / vendor bills donuts. */
function slicesToCountSegments(slices: { label: string; value: number }[] | undefined, emptyLabel: string): DashboardSegment[] {
  const list = slices ?? [];
  if (list.length === 0) {
    return [{ label: emptyLabel, numericValue: 0, displayValue: "", color: CHART_EMPTY }];
  }
  return list.map((s, i) => {
    const v = Number(s.value ?? 0);
    return {
      label: s.label,
      numericValue: v,
      displayValue: v,
      color: SLICE_PALETTE[i % SLICE_PALETTE.length],
    };
  });
}

function buildOverviewCards(d: DashboardData, reportCurrency: string): OverviewCard[] {
  const ic = d.invoiceCounts ?? emptyInvoiceCounts;
  const displayCur = d.displayCurrency?.trim() || reportCurrency;

  const receivables = d.receivablesByClient ?? [];
  const receivableSegments: DashboardSegment[] =
    receivables.length === 0
      ? [{ label: "No outstanding", numericValue: 0, displayValue: "", color: CHART_EMPTY }]
      : receivables.map((s, i) => {
          const v = Number(s.value ?? 0);
          return {
            label: s.label,
            numericValue: v,
            displayValue: formatCurrencySummary(v, displayCur),
            color: SLICE_PALETTE[i % SLICE_PALETTE.length],
          };
        });

  const billSegments = slicesToCountSegments(d.billsPayableSlices, "No bills to pay");

  const expenseSegments = slicesToCountSegments(d.expenseSlices, "No expenses");
  const advanceSegments = slicesToCountSegments(d.advanceSlices, "No advances");

  return [
    {
      title: "Expense overview",
      icon: ReceiptText,
      to: "/expenses",
      segments: expenseSegments,
    },
    {
      title: "Advances",
      icon: HandCoins,
      to: "/advances",
      segments: advanceSegments,
    },
    {
      title: "Invoices overview",
      icon: ClipboardList,
      to: "/invoices",
      segments: [
        { label: "Draft", numericValue: ic.draft, color: GREEN },
        { label: "Sent", numericValue: ic.sent, color: ORANGE },
        { label: "Partially paid", numericValue: ic.partiallyPaid, color: BLUE },
        { label: "Overdue", numericValue: ic.overdue, color: YELLOW },
        { label: "Paid", numericValue: ic.paid, color: DARK },
      ],
    },
    {
      title: "Receivables",
      icon: WalletCards,
      to: "/invoices",
      segments: receivableSegments,
    },
    {
      title: "Bills to pay",
      icon: FileText,
      to: "/bills",
      segments: billSegments,
    },
  ];
}

const DEFAULT_REPORT_CURRENCY = "INR";

export default function DashPage() {
  const { user } = useAppContext();
  const [reportCurrency, setReportCurrency] = useState(DEFAULT_REPORT_CURRENCY);
  const [currencyOptions, setCurrencyOptions] = useState<string[]>([DEFAULT_REPORT_CURRENCY]);
  const [now, setNow] = useState(() => new Date());
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const firstName = useMemo(() => user.name?.split(" ")[0] || "there", [user.name]);
  const greeting = getTimeGreeting(now);

  const myOnly = user.role !== "finance" && user.role !== "admin";

  const load = useCallback(
    (currency: string) => {
      setLoading(true);
      setError(null);
      void getDashboard({ myOnly, reportCurrency: currency })
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
        .finally(() => setLoading(false));
    },
    [myOnly],
  );

  useEffect(() => {
    load(reportCurrency);
  }, [load, reportCurrency]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const displayCurrency =
    dash?.displayCurrency?.trim() || reportCurrency || DEFAULT_REPORT_CURRENCY;

  const summaryStats = useMemo(() => {
    if (!dash) return [];
    const recv = Number(dash.receivableOutstanding ?? dash.totalReceivable ?? 0);
    return [
      { label: "Pending approvals", value: Number(dash.pendingApprovals ?? 0) },
      { label: "Bills to pay", value: Number(dash.billsToPayCount ?? 0) },
      { label: "Receivable", value: formatCurrencySummary(recv, displayCurrency) },
    ];
  }, [dash, displayCurrency]);

  const overviewCards = useMemo(
    () => (dash ? buildOverviewCards(dash, displayCurrency) : []),
    [dash, displayCurrency],
  );

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

  return (
    <div style={pageStyle}>
      <style>{dashboardCss}</style>
      <div
        className="dashboard-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          paddingBottom: 20,
          marginBottom: 0,
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 12px", color: C.primary, fontSize: 24, fontWeight: 600, lineHeight: "32px" }}>
            {greeting} {firstName}!
          </h1>
          <p style={{ margin: 0, color: C.primary, fontSize: 12, fontWeight: 400, lineHeight: "18px" }}>
            Track your current workload, approvals, invoices and payments at a glance.
          </p>
        </div>

        <div className="dashboard-currency" style={{ width: "100%", maxWidth: 200 }}>
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
      </div>

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
            onClick={() => load(reportCurrency)}
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
          <div
            className="dashboard-summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 20,
              marginBottom: 22,
            }}
          >
            {summaryStats.map((stat) => (
              <SummaryCard key={stat.label} {...stat} />
            ))}
          </div>

          <div
            className="dashboard-overview-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            {overviewCards.map((card) => (
              <OverviewCard key={card.title} {...card} />
            ))}
          </div>
        </>
      )}

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          background: "#BFE4DA",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
