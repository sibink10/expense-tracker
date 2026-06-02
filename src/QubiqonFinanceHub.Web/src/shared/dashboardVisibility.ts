import type { UserRole } from "../types";
import { ROLES } from "./constants";

export type DashboardSection =
  | "pendingApprovals"
  | "billsToPay"
  | "receivable"
  | "expenses"
  | "advances"
  | "invoices"
  | "receivablesChart"
  | "bills";

const ALL_SECTIONS: DashboardSection[] = [
  "pendingApprovals",
  "billsToPay",
  "receivable",
  "expenses",
  "advances",
  "invoices",
  "receivablesChart",
  "bills",
];

const ROLE_SECTIONS: Record<UserRole, readonly DashboardSection[]> = {
  [ROLES.ADMIN]: ALL_SECTIONS,
  [ROLES.FINANCE]: ALL_SECTIONS,
  [ROLES.APPROVER]: ["pendingApprovals", "billsToPay", "expenses", "advances", "bills"],
  [ROLES.EMPLOYEE]: ["pendingApprovals", "expenses", "advances"],
};

export function dashboardSectionsForRole(role: UserRole): Set<DashboardSection> {
  return new Set(ROLE_SECTIONS[role] ?? ROLE_SECTIONS[ROLES.EMPLOYEE]);
}

export function isDashboardSectionVisible(role: UserRole, section: DashboardSection): boolean {
  return dashboardSectionsForRole(role).has(section);
}

export function dashboardSubtitleForRole(role: UserRole): string {
  switch (role) {
    case ROLES.EMPLOYEE:
      return "Track your expense and advance requests at a glance.";
    case ROLES.APPROVER:
      return "Review pending approvals, expenses, advances, and vendor bills at a glance.";
    case ROLES.FINANCE:
    case ROLES.ADMIN:
      return "Track workload, approvals, invoices, receivables, and payments at a glance.";
    default:
      return "Track your current workload at a glance.";
  }
}
