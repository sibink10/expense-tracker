import type { NavSection, UserRole } from "../types";

/** Build nav sections for the sidebar (no count badges). */
export function buildNav(_cfg?: { advEnabled?: boolean }): NavSection[] {
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
        { path: "/expenses", l: "Expense requests", i: "☰", r: allRoles, end: true, addPath: "/expenses/add", addRoles: allRoles },
      ],
    },
    {
      s: "Advance payments",
      c: "#0E7490",
      items: [
        {
          path: "/advances",
          l: "Requests",
          i: "⤴",
          r: allRoles,
          end: true,
          addPath: "/advances/add",
          addRoles: allRoles,
        },
      ],
    },
    {
      s: "Vendor payments",
      c: "#6C3FA0",
      items: [
        { path: "/bills", l: "Vendor bills", i: "📋", r: ["finance", "approver", "admin"] as UserRole[], end: true, addPath: "/bills/add", addRoles: ["finance", "admin"] as UserRole[] },
        { path: "/vendors", l: "Vendors", i: "🏢", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/vendors/add", addRoles: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Invoicing",
      c: "#B45309",
      items: [
        { path: "/invoices", l: "Invoices", i: "📄", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/invoices/add", addRoles: ["finance", "admin"] as UserRole[] },
        { path: "/clients", l: "Clients", i: "👥", r: ["finance", "admin"] as UserRole[], end: true, addPath: "/clients/add", addRoles: ["admin"] as UserRole[] },
      ],
    },
    {
      s: "Employees",
      c: "#0F766E",
      items: [
        { path: "/employees", l: "Employee directory", i: "👥", r: ["admin"] as UserRole[], end: true },
      ],
    },
    {
      s: "Admin",
      c: "#6B7A94",
      items: [
        { path: "/admin", l: "Settings", i: "⚙", r: ["admin"] as UserRole[], end: true },
        { path: "/admin/org", l: "Organization", i: "🏢", r: ["admin"] as UserRole[] },
        { path: "/admin/tax", l: "Tax config", i: "📊", r: ["admin"] as UserRole[] },
        { path: "/admin/categories", l: "Categories", i: "🏷", r: ["admin"] as UserRole[] },
      ],
    },
  ];
}
