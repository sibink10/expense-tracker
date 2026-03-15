import { apiClient } from "./client";
import type { AppUser } from "../../types";

export interface ApiAuthMe {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  dept?: string;
  employeeId?: string;
  [key: string]: unknown;
}

function toAppUserRole(r: string | undefined): AppUser["role"] {
  const v = (r ?? "").toLowerCase();
  if (v === "employee" || v === "approver" || v === "finance" || v === "admin") return v;
  return "employee";
}

export async function getAuthMe(): Promise<AppUser> {
  const { data } = await apiClient.get<ApiAuthMe>("/auth/me");
  const name = data.name ?? data.email?.split("@")[0] ?? "User";
  const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "?";
  return {
    id: data.id ?? 0,
    name,
    email: data.email ?? "",
    role: toAppUserRole(data.role),
    dept: data.department ?? data.dept ?? "General",
    av: initials,
    employeeId: data.employeeId,
  };
}
