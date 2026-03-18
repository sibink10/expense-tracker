import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Stat } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getDashboard } from "../shared/api/dashboard";

const ADMIN_LINKS = [
  { path: "/admin", label: "Settings", icon: "⚙" },
  { path: "/admin/org", label: "Organization", icon: "🏢" },
  { path: "/admin/tax", label: "Tax config", icon: "📊" },
  { path: "/admin/email", label: "Email templates", icon: "✉" },
];

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

  const renderStats = (stats: { label: string; value: number | string }[]) => (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {stats.map((s) => (
        <Stat key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );

  const employeeStats = [
    { label: "Pending expenses", value: data.pendingExpenses },
    { label: "Approved expenses", value: data.approvedExpenses },
    { label: "Completed expenses", value: data.completedExpenses },
    { label: "Pending advances", value: data.pendingAdvances },
  ];

  const approverStats = [
    { label: "Pending expenses", value: data.pendingExpenses },
    { label: "Pending bills", value: data.pendingBills },
    { label: "Pending advances", value: data.pendingAdvances },
  ];

  const financeStats = [
    { label: "Bills to pay", value: data.billsToPayCount },
    { label: "Bills amount", value: fmtCur(data.billsToPayAmount) },
    { label: "Draft invoices", value: data.draftInvoices },
    { label: "Sent invoices", value: data.sentInvoices },
    { label: "Paid invoices", value: data.paidInvoices },
    { label: "Overdue invoices", value: data.overdueInvoices },
    { label: "Total receivable", value: fmtCur(data.totalReceivable) },
  ];

  const adminStats = [
    { label: "Pending expenses", value: data.pendingExpenses },
    { label: "Approved expenses", value: data.approvedExpenses },
    { label: "Completed expenses", value: data.completedExpenses },
    { label: "Pending bills", value: data.pendingBills },
    { label: "Bills to pay", value: data.billsToPayCount },
    { label: "Pending advances", value: data.pendingAdvances },
    { label: "Draft invoices", value: data.draftInvoices },
    { label: "Sent invoices", value: data.sentInvoices },
    { label: "Paid invoices", value: data.paidInvoices },
    { label: "Overdue invoices", value: data.overdueInvoices },
    { label: "Total receivable", value: fmtCur(data.totalReceivable) },
  ];

  const showApproverBanner = isApprover && data.pendingExpenses + data.pendingBills + data.pendingAdvances > 0;

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 3px" }}>
        Welcome, {user.name.split(" ")[0]}
      </h1>
      <p style={{ color: C.muted, margin: "0 0 20px", fontSize: "12px" }}>
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {isAdmin && (
        <div
          style={{
            background: C.surface,
            borderRadius: "12px",
            padding: "20px",
            border: `1px solid ${C.border}`,
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 16px", color: C.primary }}>
            Admin
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {ADMIN_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: "#fff",
                  borderRadius: "8px",
                  border: `1px solid ${C.border}`,
                  textDecoration: "none",
                  color: C.primary,
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${C.primary}08`;
                  e.currentTarget.style.borderColor = C.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

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
