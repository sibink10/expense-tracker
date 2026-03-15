import type { NavSection, UserRole } from "../types";

/** Build nav sections. Pass pendExp, pendAdv, payableCount for badges. */
export function buildNav(
  cfg: { advEnabled: boolean },
  userRole: string,
  opts: { pendExp?: number; pendAdv?: number; payableExp?: number }
): NavSection[] {
  const { advEnabled } = cfg;
  const { pendExp = 0, pendAdv = 0, payableExp = 0 } = opts;
  const isApprover = userRole === "approver";

  const allRoles: UserRole[] = ["employee", "approver", "finance", "admin"];
  return [
    {
      s: "Overview",
      items: [
        { path: "/", l: "Dashboard", i: "◫", r: allRoles, end: true },
      ],
    },
    {
      s: "Employee expenses",
      c: "#E8593C",
      items: [
        { path: "/expenses", l: "Expense requests", i: "☰", r: allRoles, b: isApprover ? pendExp : 0, end: true },
        { path: "/expenses/add", l: "Add expense", i: "＋", r: ["employee", "finance", "admin"] as UserRole[] },
        { path: "/expenses/pay", l: "Payments", i: "₹", r: ["finance"] as UserRole[], b: payableExp },
      ],
    },
    ...(advEnabled
      ? [
          {
            s: "Advance payments",
            c: "#0E7490",
            items: [
              { path: "/advances", l: "Requests", i: "⤴", r: ["employee", "approver", "finance", "admin"] as UserRole[], b: isApprover ? pendAdv : 0, end: true },
              { path: "/advances/add", l: "Request advance", i: "＋", r: ["employee", "admin"] as UserRole[] },
            ],
          },
        ]
      : []),
    {
      s: "Vendor payments",
      c: "#6C3FA0",
      items: [
        { path: "/bills", l: "Vendor bills", i: "📋", r: ["finance", "approver", "admin"] as UserRole[], end: true },
        { path: "/bills/add", l: "Submit bill", i: "＋", r: ["finance", "admin"] as UserRole[] },
        { path: "/vendors", l: "Vendors", i: "🏢", r: ["finance", "admin"] as UserRole[], end: true },
        { path: "/vendors/add", l: "Add vendor", i: "＋", r: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Invoicing",
      c: "#B45309",
      items: [
        { path: "/invoices", l: "Invoices", i: "📄", r: ["finance", "admin"] as UserRole[], end: true },
        { path: "/invoices/add", l: "Create invoice", i: "＋", r: ["finance", "admin"] as UserRole[] },
        { path: "/clients", l: "Clients", i: "👥", r: ["finance", "admin"] as UserRole[], end: true },
        { path: "/clients/add", l: "Add client", i: "＋", r: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Admin",
      c: "#6B7A94",
      items: [
        { path: "/admin", l: "Settings", i: "⚙", r: ["admin"] as UserRole[], end: true },
        { path: "/admin/org", l: "Organization", i: "🏢", r: ["admin"] as UserRole[] },
        { path: "/admin/tax", l: "Tax config", i: "📊", r: ["admin"] as UserRole[] },
        { path: "/admin/gst", l: "GST config", i: "📊", r: ["admin"] as UserRole[] },
        { path: "/admin/email", l: "Email templates", i: "✉", r: ["admin"] as UserRole[] },
      ],
    },
  ];
}
