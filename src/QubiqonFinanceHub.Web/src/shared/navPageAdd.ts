import type { NavSection, UserRole } from "../types";

export type NavPageAddAction = {
  addPath: string;
  label: string;
};

function pathMatches(pathname: string, itemPath: string, end?: boolean) {
  if (end) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Resolve add action for the current list route from sidebar nav config. */
export function findNavPageAddAction(
  pathname: string,
  sections: NavSection[],
  role: UserRole,
): NavPageAddAction | null {
  for (const sec of sections) {
    for (const item of sec.items) {
      if (!pathMatches(pathname, item.path, item.end)) continue;
      if (!item.addPath) continue;
      const roles = item.addRoles ?? item.r;
      if (!roles.includes(role)) continue;
      return { addPath: item.addPath, label: item.l };
    }
  }
  return null;
}
