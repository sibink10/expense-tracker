import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { useAppContext } from "../context/AppContext";
import { getDashboard } from "../shared/api/dashboard";

type StatTone = "primary" | "success" | "warning" | "danger" | "info" | "vendor" | "advance" | "invoice";

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  tone: StatTone;
}

const TONE_STYLES: Record<StatTone, { color: string; bg: string }> = {
  primary: { color: C.primary, bg: `${C.primary}10` },
  success: { color: C.success, bg: C.successBg },
  warning: { color: C.warning, bg: C.warningBg },
  danger: { color: C.danger, bg: C.dangerBg },
  info: { color: C.info, bg: C.infoBg },
  vendor: { color: C.vendor, bg: C.vendorBg },
  advance: { color: C.advance, bg: C.advanceBg },
  invoice: { color: C.invoice, bg: C.invoiceBg },
};

function StatCard({ label, value, icon, tone }: StatItem) {
  const palette = TONE_STYLES[tone];
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "14px 16px",
        border: `1px solid ${C.border}`,
        minHeight: "96px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          background: palette.bg,
          color: palette.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          flexShrink: 0,
          alignSelf: "flex-start",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: C.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign: "left",
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: C.primary, lineHeight: 1.1, marginTop: "8px" }}>{value}</div>
      </div>
    </div>
  );
}

export default function DashPage() {
  const { user, is } = useAppContext();
  const [data, setData] = useState<{
    pendingExpenses: number;
    approvedExpenses: number;
    completedExpenses: number;
    pendingBills: number;
    billsToPayCount: number;
    billsToPayAmount: number;
    pendingAdvances: number;
    draftInvoices: number;
    sentInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalReceivable: number;
  }>({
    pendingExpenses: 0,
    approvedExpenses: 0,
    completedExpenses: 0,
    pendingBills: 0,
    billsToPayCount: 0,
    billsToPayAmount: 0,
    pendingAdvances: 0,
    draftInvoices: 0,
    sentInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalReceivable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statCols, setStatCols] = useState(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
  });
  const isAdmin = is("admin");
  const isEmployee = is("employee");
  const isApprover = is("approver");
  const isFinance = is("finance");
  const myOnly = isEmployee;

  useEffect(() => {
    getDashboard(myOnly)
      .then((res) => {
        setData({
          pendingExpenses: res.pendingExpenses ?? 0,
          approvedExpenses: res.approvedExpenses ?? 0,
          completedExpenses: res.completedExpenses ?? 0,
          pendingBills: res.pendingBills ?? 0,
          billsToPayCount: res.billsToPayCount ?? 0,
          billsToPayAmount: res.billsToPayAmount ?? 0,
          pendingAdvances: res.pendingAdvances ?? 0,
          draftInvoices: res.draftInvoices ?? 0,
          sentInvoices: res.sentInvoices ?? 0,
          paidInvoices: res.paidInvoices ?? 0,
          overdueInvoices: res.overdueInvoices ?? 0,
          totalReceivable: res.totalReceivable ?? 0,
        });
      })
      .catch(() => setData((d) => d))
      .finally(() => setLoading(false));
  }, [myOnly]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 640) setStatCols(1);
      else if (window.innerWidth < 1024) setStatCols(2);
      else setStatCols(4);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const renderStats = (stats: StatItem[]) => (
    <div style={{ marginTop: "24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            statCols === 1 ? "1fr" : statCols === 2 ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );

  const employeeStats: StatItem[] = [
    { label: "Pending expenses", value: data.pendingExpenses, icon: "🧾", tone: "warning" },
    { label: "Approved expenses", value: data.approvedExpenses, icon: "✅", tone: "success" },
    { label: "Completed expenses", value: data.completedExpenses, icon: "✔", tone: "info" },
    { label: "Pending advances", value: data.pendingAdvances, icon: "💸", tone: "advance" },
  ];

  const approverStats: StatItem[] = [
    { label: "Pending expenses", value: data.pendingExpenses, icon: "🧾", tone: "warning" },
    { label: "Pending bills", value: data.pendingBills, icon: "📋", tone: "vendor" },
    { label: "Pending advances", value: data.pendingAdvances, icon: "💸", tone: "advance" },
  ];

  const financeStats: StatItem[] = [
    { label: "Bills to pay", value: data.billsToPayCount, icon: "📋", tone: "vendor" },
    { label: "Bills amount", value: fmtCur(data.billsToPayAmount), icon: "₹", tone: "danger" },
    { label: "Draft invoices", value: data.draftInvoices, icon: "📝", tone: "invoice" },
    { label: "Sent invoices", value: data.sentInvoices, icon: "📤", tone: "info" },
    { label: "Paid invoices", value: data.paidInvoices, icon: "💰", tone: "success" },
    { label: "Overdue invoices", value: data.overdueInvoices, icon: "⏰", tone: "danger" },
    { label: "Total receivable", value: fmtCur(data.totalReceivable), icon: "🏦", tone: "primary" },
  ];

  const adminStats: StatItem[] = [
    { label: "Pending expenses", value: data.pendingExpenses, icon: "🧾", tone: "warning" },
    { label: "Approved expenses", value: data.approvedExpenses, icon: "✅", tone: "success" },
    { label: "Completed expenses", value: data.completedExpenses, icon: "✔", tone: "info" },
    { label: "Pending bills", value: data.pendingBills, icon: "📋", tone: "vendor" },
    { label: "Bills to pay", value: data.billsToPayCount, icon: "₹", tone: "danger" },
    { label: "Pending advances", value: data.pendingAdvances, icon: "💸", tone: "advance" },
    { label: "Draft invoices", value: data.draftInvoices, icon: "📝", tone: "invoice" },
    { label: "Sent invoices", value: data.sentInvoices, icon: "📤", tone: "info" },
    { label: "Paid invoices", value: data.paidInvoices, icon: "💰", tone: "success" },
    { label: "Overdue invoices", value: data.overdueInvoices, icon: "⏰", tone: "danger" },
    { label: "Total receivable", value: fmtCur(data.totalReceivable), icon: "🏦", tone: "primary" },
  ];

  const heroHighlights = isAdmin
    ? [
        { label: "Pending approvals", value: data.pendingExpenses + data.pendingBills + data.pendingAdvances },
        { label: "Bills to pay", value: data.billsToPayCount },
        { label: "Receivable", value: fmtCur(data.totalReceivable) },
      ]
    : isFinance
      ? [
          { label: "Bills to pay", value: data.billsToPayCount },
          { label: "Overdue invoices", value: data.overdueInvoices },
          { label: "Receivable", value: fmtCur(data.totalReceivable) },
        ]
      : isApprover
        ? [
            { label: "Expenses", value: data.pendingExpenses },
            { label: "Bills", value: data.pendingBills },
            { label: "Advances", value: data.pendingAdvances },
          ]
        : [
            { label: "Pending expenses", value: data.pendingExpenses },
            { label: "Approved expenses", value: data.approvedExpenses },
            { label: "Pending advances", value: data.pendingAdvances },
          ];

  const showApproverBanner = isApprover && data.pendingExpenses + data.pendingBills + data.pendingAdvances > 0;

  return (
    <div>
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "22px",
          color: C.primary,
          marginBottom: "24px",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: C.surface,
                color: C.muted,
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "12px",
              }}
            >
              {user.role}
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 6px", color: C.primary }}>
              Welcome, {user.name.split(" ")[0]}
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: C.muted, maxWidth: "560px" }}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Track your current workload, approvals, invoices and payments at a glance.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          {heroHighlights.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "4px", color: C.primary }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
      ) : (
        <>
          {isEmployee && renderStats(employeeStats)}
          {isApprover && renderStats(approverStats)}
          {isFinance && renderStats(financeStats)}
          {isAdmin && renderStats(adminStats)}

          {showApproverBanner && (
            <div
              style={{
                background: C.warningBg,
                borderRadius: "10px",
                padding: "12px 16px",
                marginTop: "16px",
                fontSize: "12px",
              }}
            >
              <strong style={{ color: C.warning }}>Awaiting your approval:</strong>{" "}
              {data.pendingExpenses > 0 && `${data.pendingExpenses} expense(s) `}
              {data.pendingBills > 0 && `${data.pendingBills} bill(s) `}
              {data.pendingAdvances > 0 && `${data.pendingAdvances} advance(s)`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
