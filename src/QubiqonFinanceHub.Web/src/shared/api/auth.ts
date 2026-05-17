import { apiClient } from "./client";
import type { AppUser } from "../../types";

export interface ApiAuthMe {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  department?: string;
  dept?: string;
  organizationId?: string;
  organizationName?: string;
  homeOrganizationId?: string;
  activeOrganizationId?: string | null;
  effectiveOrganizationId?: string;
  [key: string]: unknown;
}

function toAppUserRole(r: string | undefined): AppUser["role"] {
  const v = (r ?? "").toLowerCase();
  if (v === "employee" || v === "approver" || v === "finance" || v === "admin") return v;
  return "employee";
}

function pickString(data: ApiAuthMe, ...keys: string[]): string | undefined {
  const raw = data as Record<string, unknown>;
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

export async function getAuthMe(): Promise<AppUser> {
  const { data } = await apiClient.get<ApiAuthMe>("/auth/me");

  const name =
    data.name ??
    (typeof data.fullName === "string" ? data.fullName : undefined) ??
    data.email?.split("@")[0] ??
    "User";
  const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "?";

  const effectiveOrganizationId =
    pickString(data, "effectiveOrganizationId", "EffectiveOrganizationId", "organizationId", "OrganizationId") ??
    "";

  return {
    id: data.id || "",
    name,
    email: data.email ?? "",
    role: toAppUserRole(data.role),
    dept: data.department ?? data.dept ?? "General",
    av: initials,
    homeOrganizationId:
      pickString(data, "homeOrganizationId", "HomeOrganizationId") ?? effectiveOrganizationId,
    activeOrganizationId:
      pickString(data, "activeOrganizationId", "ActiveOrganizationId") ?? null,
    effectiveOrganizationId,
  };
}
