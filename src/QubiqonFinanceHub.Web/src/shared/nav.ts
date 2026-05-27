import type { NavSection, UserRole } from "../types";

/** Build nav sections for the sidebar (no count badges). */
export function buildNav(_cfg?: { advEnabled?: boolean }): NavSection[] {
  const allRoles: UserRole[] = ["employee", "approver", "finance", "admin"];
  return [
    {
      s: "Dashboard",
      i: "dashboard",
      path: "/",
      end: true,
      items: [{ path: "/", l: "Dashboard", i: "dashboard", r: allRoles, end: true }],
    },
    {
      s: "Expenses",
      i: "expenses",
      path: "/expenses",
      end: true,
      items: [
        { path: "/expenses", l: "Expenses", i: "expenses", r: allRoles, end: true, addPath: "/expenses/add", addRoles: allRoles },
      ],
    },
    {
      s: "Advance Requests",
      i: "advances",
      path: "/advances",
      end: true,
      items: [
        {
          path: "/advances",
          l: "Advance Requests",
          i: "advances",
          r: allRoles,
          end: true,
          addPath: "/advances/add",
          addRoles: allRoles,
        },
      ],
    },
    {
      s: "Vendors",
      i: "vendors",
      items: [
        { path: "/bills", l: "Bills", i: "", r: ["finance", "approver", "admin"] as UserRole[], end: true, addPath: "/bills/add", addRoles: ["finance", "admin"] as UserRole[] },
        { path: "/vendors", l: "Directory", i: "", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/vendors/add", addRoles: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Clients",
      i: "clients",
      items: [
        { path: "/invoices", l: "Invoices", i: "", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/invoices/add", addRoles: ["finance", "admin"] as UserRole[] },
        { path: "/clients", l: "Directory", i: "", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/clients/add", addRoles: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Employees",
      i: "employees",
      path: "/employees",
      end: true,
      items: [{ path: "/employees", l: "Employees", i: "employees", r: ["admin"] as UserRole[], end: true }],
    },
    {
      s: "Organization",
      i: "organization",
      items: [
        { path: "/admin/org", l: "Organization", i: "", r: ["admin"] as UserRole[], end: true },
        { path: "/admin", l: "Organization Settings", i: "", r: ["admin"] as UserRole[], end: true },
      ],
    },
    {
      s: "Settings",
      i: "workspace",
      items: [
        { path: "/admin/tax", l: "Tax Config", i: "", r: ["admin"] as UserRole[] },
        { path: "/admin/categories", l: "Categories", i: "", r: ["admin"] as UserRole[] },
        { path: "/admin/accounts", l: "Accounts", i: "", r: ["admin"] as UserRole[] },
        { path: "/admin/payment-terms", l: "Payment Terms", i: "", r: ["admin"] as UserRole[] },
        { path: "/admin/zoho-sign", l: "Zoho Sign", i: "", r: ["finance", "admin"] as UserRole[], end: true },
      ],
    },
  ];
}
