import type { NavSection, UserRole } from "../types";
import { ROLES } from "./constants";

/** Build nav sections for the sidebar (no count badges). */
export function buildNav(_cfg?: { advEnabled?: boolean }): NavSection[] {
  const allRoles: UserRole[] = [ROLES.EMPLOYEE, ROLES.APPROVER, ROLES.FINANCE, ROLES.ADMIN];
  const payableRoles: UserRole[] = [ROLES.APPROVER, ROLES.FINANCE, ROLES.ADMIN];

  return [
    {
      s: "Dashboard",
      i: "dashboard",
      path: "/",
      end: true,
      items: [{ path: "/", l: "Dashboard", i: "dashboard", r: allRoles, end: true }],
    },
    {
      s: "Requests",
      i: "requests",
      items: [
        {
          path: "/requests/forecasts",
          l: "Forecasts",
          i: "forecasts",
          r: allRoles,
          end: true,
          addPath: "/forecasts/add",
          addRoles: allRoles,
        },
        {
          path: "/requests/expenses",
          l: "Expenses",
          i: "expenses",
          r: allRoles,
          end: true,
          addPath: "/expenses/add",
          addRoles: allRoles,
        },
        {
          path: "/requests/advances",
          l: "Advances",
          i: "advances",
          r: allRoles,
          end: true,
          addPath: "/advances/add",
          addRoles: allRoles,
        },
      ],
    },
    {
      s: "Payable",
      i: "payable",
      items: [
        { path: "/forecasts", l: "Forecasts", i: "forecasts", r: payableRoles, end: true },
        { path: "/expenses", l: "Expenses", i: "expenses", r: payableRoles, end: true },
        { path: "/advances", l: "Advance Requests", i: "advances", r: payableRoles, end: true },
      { path: "/payable/approvals", l: "Approvals", i: "approvals", r: payableRoles, end: true },
      { path: "/bills", l: "Vendor Bills", i: "", r: [ROLES.FINANCE, ROLES.APPROVER, ROLES.ADMIN] as UserRole[], end: true, addPath: "/bills/add", addRoles: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[] },
      { path: "/vendors", l: "Vendors", i: "", r: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[], end: true, addPath: "/vendors/add", addRoles: [ROLES.ADMIN] as UserRole[] },
      ],
    },
    {
      s: "Receivable",
      i: "receivable",
      items: [
        { path: "/invoices", l: "Invoices", i: "", r: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[], end: true, addPath: "/invoices/add", addRoles: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[] },
        { path: "/clients", l: "Clients", i: "", r: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[], end: true, addPath: "/clients/add", addRoles: [ROLES.ADMIN] as UserRole[] },
      ],
    },
    {
      s: "Configuration",
      i: "settings",
      items: [
        { path: "/admin/tax", l: "Tax Config", i: "", r: [ROLES.ADMIN] as UserRole[] },
        { path: "/admin/categories", l: "Categories", i: "", r: [ROLES.ADMIN] as UserRole[] },
        { path: "/admin/accounts", l: "Accounts", i: "", r: [ROLES.ADMIN] as UserRole[] },
        { path: "/admin/payment-terms", l: "Payment Terms", i: "", r: [ROLES.ADMIN] as UserRole[] },
      ],
    },
    {
      s: "Settings",
      i: "settings",
      items: [
        { path: "/employees", l: "Employees", i: "employees", r: [ROLES.ADMIN] as UserRole[], end: true },
        { path: "/admin/org", l: "Organization", i: "", r: [ROLES.ADMIN] as UserRole[], end: true },
        { path: "/admin", l: "Organization Settings", i: "", r: [ROLES.ADMIN] as UserRole[], end: true },
        { path: "/admin/zoho-sign", l: "Zoho Sign", i: "", r: [ROLES.FINANCE, ROLES.ADMIN] as UserRole[], end: true },
      ],
    },
  ];
}
