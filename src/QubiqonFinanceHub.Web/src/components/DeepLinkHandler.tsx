import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getExpenseById } from "../shared/api/expense";
import { getAdvanceById } from "../shared/api/advance";
import { getBillById } from "../shared/api/bill";
import { getInvoice } from "../shared/api/invoice";
import {
  resolveExpenseDeepLink,
  resolveAdvanceDeepLink,
  resolveBillDeepLink,
  resolveInvoiceDeepLink,
} from "../shared/deepLinkModal";

const PATHS = new Set(["/expenses", "/advances", "/bills", "/invoices"]);

/**
 * Reads `?id=<api-guid>&type=<intent>` on list routes, loads the entity, opens the modal
 * for that intent when status/role allow (approve / reject / pay / disburse / inv-pay / detail),
 * then strips `id` and `type` from the URL.
 */
export default function DeepLinkHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setMdl, t } = useAppContext();
  const runId = useRef(0);

  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;
    const params = new URLSearchParams(search);
    const id = params.get("id");
    if (!id?.trim()) return;
    if (!PATHS.has(pathname)) return;

    const typeParam = params.get("type");

    const myRun = ++runId.current;
    let cancelled = false;

    const stripDeepLinkParamsFromUrl = () => {
      const next = new URLSearchParams(search);
      next.delete("id");
      next.delete("type");
      const q = next.toString();
      navigate({ pathname, search: q ? `?${q}` : "" }, { replace: true });
    };

    (async () => {
      try {
        if (pathname === "/expenses") {
          const entity = await getExpenseById(id.trim());
          if (cancelled || runId.current !== myRun) return;
          if (!entity) {
            t("Could not open expense", "error");
            stripDeepLinkParamsFromUrl();
            return;
          }
          setMdl(resolveExpenseDeepLink(entity, user, typeParam));
        } else if (pathname === "/advances") {
          const entity = await getAdvanceById(id.trim());
          if (cancelled || runId.current !== myRun) return;
          if (!entity) {
            t("Could not open advance", "error");
            stripDeepLinkParamsFromUrl();
            return;
          }
          setMdl(resolveAdvanceDeepLink(entity, user, typeParam));
        } else if (pathname === "/bills") {
          const entity = await getBillById(id.trim());
          if (cancelled || runId.current !== myRun) return;
          if (!entity) {
            t("Could not open bill", "error");
            stripDeepLinkParamsFromUrl();
            return;
          }
          setMdl(resolveBillDeepLink(entity, user, typeParam));
        } else if (pathname === "/invoices") {
          const entity = await getInvoice(id.trim());
          if (cancelled || runId.current !== myRun) return;
          if (!entity) {
            t("Could not open invoice", "error");
            stripDeepLinkParamsFromUrl();
            return;
          }
          setMdl(resolveInvoiceDeepLink(entity, user, typeParam));
        }
      } catch {
        if (!cancelled && runId.current === myRun) {
          t("Could not load item from link", "error");
        }
      } finally {
        if (!cancelled && runId.current === myRun) stripDeepLinkParamsFromUrl();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, user, setMdl, navigate, t]);

  return null;
}
