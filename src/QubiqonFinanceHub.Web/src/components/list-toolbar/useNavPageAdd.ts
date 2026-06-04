import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { buildNav } from "../../shared/nav";
import { findNavPageAddAction } from "../../shared/navPageAdd";
import { useAppContext } from "../../context/AppContext";
import type { UserRole } from "../../types";

export function useNavPageAdd(cfg?: { advEnabled?: boolean }) {
  const { pathname } = useLocation();
  const { user, cfg: appCfg } = useAppContext();
  const role = user?.role as UserRole | undefined;

  return useMemo(() => {
    if (!role) return null;
    return findNavPageAddAction(pathname, buildNav(cfg ?? appCfg), role);
  }, [pathname, role, cfg, appCfg]);
}
