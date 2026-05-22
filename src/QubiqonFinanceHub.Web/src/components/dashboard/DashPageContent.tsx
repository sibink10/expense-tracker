import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ClipboardList, FileText, HandCoins, ReceiptText, Search, WalletCards, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, R } from "../../shared/theme";
import { useAppContext } from "../../context/AppContext";

type DashboardSegment = {
  label: string;
  value: number | string;
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

const summaryStats = [
  { label: "Pending approvals", value: 0 },
  { label: "Bills to pay", value: 0 },
  { label: "Receivable", value: 0 },
];

const overviewCards: OverviewCard[] = [
  {
    title: "Expense overview",
    icon: ReceiptText,
    to: "/expenses",
    segments: [
      { label: "Pending", value: 0, color: ORANGE },
      { label: "Approved", value: 5, color: GREEN },
      { label: "Completed", value: 3, color: YELLOW },
    ],
  },
  {
    title: "Advances",
    icon: HandCoins,
    to: "/advances",
    segments: [
      { label: "Pending", value: 0, color: ORANGE },
      { label: "Disbursed", value: 0, color: GREEN },
    ],
  },
  {
    title: "Invoices overview",
    icon: ClipboardList,
    to: "/invoices",
    segments: [
      { label: "Sent", value: 0, color: ORANGE },
      { label: "Draft", value: 5, color: GREEN },
      { label: "Overdue", value: 0, color: YELLOW },
      { label: "Paid", value: 0, color: DARK },
    ],
  },
  {
    title: "Receivables",
    icon: WalletCards,
    to: "/invoices",
    segments: [
      { label: "Client 1", value: "60k", color: ORANGE },
      { label: "Client 2", value: "40k", color: GREEN },
    ],
  },
  {
    title: "Bills to pay",
    icon: FileText,
    to: "/bills",
    segments: [
      { label: "Internet", value: "", color: ORANGE },
      { label: "Salary and wages", value: "", color: GREEN },
      { label: "Other", value: "", color: YELLOW },
    ],
  },
];

function numericValue(value: number | string) {
  if (typeof value === "number") return value;
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function DonutChart({ segments }: { segments: DashboardSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + numericValue(segment.value), 0);
  let cursor = 0;
  const gradient =
    total > 0
      ? segments
          .filter((segment) => numericValue(segment.value) > 0)
          .map((segment) => {
            const start = cursor;
            const end = cursor + (numericValue(segment.value) / total) * 100;
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
        {segments.map((segment) => (
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
            {segment.value !== "" && <span style={{ color: C.primary, marginLeft: 4 }}>{segment.value}</span>}
          </div>
        ))}
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
    .dashboard-search {
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
  minHeight: "100%",
  boxSizing: "border-box",
};

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashPage() {
  const { user } = useAppContext();
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const firstName = useMemo(() => user.name?.split(" ")[0] || "Aishwariya", [user.name]);
  const greeting = getTimeGreeting(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
          marginBottom: 20,
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

        <div className="dashboard-search" style={{ position: "relative", width: "100%", maxWidth: 385 }}>
          <Search
            size={16}
            strokeWidth={1.8}
            color={C.muted}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees by name, email, dep..."
            aria-label="Search employees"
            style={{
              width: "100%",
              height: 36,
              border: "none",
              borderRadius: 999,
              background: "#fff",
              boxShadow: "0px 2px 3px 0px #253EA70A",
              color: C.primary,
              fontSize: 12,
              outline: "none",
              padding: "0 16px 0 42px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

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
