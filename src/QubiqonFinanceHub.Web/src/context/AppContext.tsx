import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { useMsal } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { INIT_CONFIG } from "../shared/config";
import { setApiTokenGetter, apiScope } from "../shared/api/client";
import {
  INIT_EXPENSES,
  INIT_BILLS,
  INIT_ADVANCES,
  INIT_INVOICES,
  INIT_VENDORS,
  INIT_CLIENTS,
} from "../shared/initData";
import { EXP_S, BILL_S, ADV_S } from "../shared/constants";
import { getOrganizations, type OrganizationPayload } from "../shared/api";
import type {
  AppUser,
  AppConfig,
  Expense,
  Bill,
  Advance,
  Invoice,
  Vendor,
  Client,
  ToastData,
  EmailData,
  ModalData,
} from "../types";

// ─── Context types ─────────────────────
export interface AppContextValue {
  user: AppUser;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  cfg: AppConfig;
  setCfg: React.Dispatch<React.SetStateAction<AppConfig>>;
  exps: Expense[];
  setExps: React.Dispatch<React.SetStateAction<Expense[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  advs: Advance[];
  setAdvs: React.Dispatch<React.SetStateAction<Advance[]>>;
  invs: Invoice[];
  setInvs: React.Dispatch<React.SetStateAction<Invoice[]>>;
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  mdl: ModalData | null;
  setMdl: React.Dispatch<React.SetStateAction<ModalData | null>>;
  toast: ToastData | null;
  setToast: React.Dispatch<React.SetStateAction<ToastData | null>>;
  email: EmailData | null;
  setEmail: React.Dispatch<React.SetStateAction<EmailData | null>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  sf: string;
  setSf: React.Dispatch<React.SetStateAction<string>>;
  instance: IPublicClientApplication;
  t: (m: string, type?: string) => void;
  rf: () => void;
  approve: (
    item: Expense | Bill | Advance,
    type: "expense" | "bill" | "advance",
  ) => void;
  reject: (
    item: Expense | Bill | Advance,
    type: "expense" | "bill" | "advance",
    reason?: string,
  ) => void;
  pay: (
    item: Expense | Bill | Advance,
    type: "expense" | "bill" | "advance",
    ref: string,
  ) => void;
  is: (r: AppUser["role"]) => boolean;
  myExps: Expense[];
  pendExp: number;
  pendBill: number;
  pendAdv: number;
  payableExp: Expense[];
  payableBill: Bill[];
  fil: <T extends { status: string }>(list: T[]) => T[];
  orgs: OrganizationPayload[];
  activeOrg: OrganizationPayload | null;
  setActiveOrg: React.Dispatch<React.SetStateAction<OrganizationPayload | null>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export interface AppProviderProps {
  children: ReactNode;
  user: AppUser;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  /** Must be used inside MsalProvider. Wraps the authenticated app layout. */
}

const MSAL_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const isMsalConfigured = () => {
  const id = import.meta.env.VITE_AZURE_CLIENT_ID;
  return id && id !== MSAL_PLACEHOLDER;
};

export function AppProvider({ children, user, setUser }: AppProviderProps) {
  const { instance } = useMsal();
  useEffect(() => {
    if (!isMsalConfigured()) return;
    setApiTokenGetter(async () => {
      const accounts = instance.getAllAccounts();
      if (accounts.length === 0) return null;
      try {
        const result = await instance.acquireTokenSilent({
          scopes: [apiScope],
          account: accounts[0],
        });
        return result.accessToken ?? null;
      } catch {
        return null;
      }
    });
  }, [instance]);

  const [cfg, setCfg] = useState<AppConfig>(
    () => JSON.parse(JSON.stringify(INIT_CONFIG)) as AppConfig,
  );
  const [exps, setExps] = useState<Expense[]>(INIT_EXPENSES);
  const [bills, setBills] = useState<Bill[]>(INIT_BILLS);
  const [advs, setAdvs] = useState<Advance[]>(INIT_ADVANCES);
  const [invs, setInvs] = useState<Invoice[]>(INIT_INVOICES);
  const [vendors, setVendors] = useState<Vendor[]>(INIT_VENDORS);
  const [clients, setClients] = useState<Client[]>(INIT_CLIENTS);
  const [mdl, setMdl] = useState<ModalData | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [email, setEmail] = useState<EmailData | null>(null);
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState("all");
  const [orgs, setOrgs] = useState<OrganizationPayload[]>([]);
  const [activeOrg, setActiveOrg] = useState<OrganizationPayload | null>(null);

  const t = useCallback((m: string, type = "ok") => {
    setToast({ m, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const rf = useCallback(() => {
    setSearch("");
    setSf("all");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getOrganizations()
      .then((list) => {
        if (cancelled) return;
        setOrgs(list);
        if (!activeOrg && list.length > 0) {
          const selected = list.find((o) => o.selected) ?? list[0];
          setActiveOrg(selected);
        }
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = useCallback(
    (item: Expense | Bill | Advance, type: "expense" | "bill" | "advance") => {
      const c = {
        by: user.name,
        text: "Approved.",
        d: new Date().toISOString().split("T")[0],
        t: "ok" as const,
      };
      if (type === "expense") {
        const exp = item as Expense;
        const hasBill = exp.file != null;
        setExps((prev) =>
          prev.map((e) =>
            e.id === exp.id
              ? {
                  ...e,
                  status: hasBill ? EXP_S.APPROVED : EXP_S.AWAITING_BILL,
                  comments: [...e.comments, c],
                }
              : e,
          ),
        );
        setEmail({ to: exp.empName, subj: `Expense ${exp.id} approved` });
      } else if (type === "bill") {
        const bill = item as Bill;
        setBills((prev) =>
          prev.map((b) =>
            b.id === bill.id
              ? { ...b, status: BILL_S.APPROVED, comments: [...b.comments, c] }
              : b,
          ),
        );
      } else if (type === "advance") {
        const adv = item as Advance;
        setAdvs((prev) =>
          prev.map((a) =>
            a.id === adv.id
              ? { ...a, status: ADV_S.APPROVED, comments: [...a.comments, c] }
              : a,
          ),
        );
        setEmail({ to: adv.empName, subj: `Advance ${adv.id} approved` });
      }
      t("Approved");
      setMdl(null);
    },
    [user, t],
  );

  const reject = useCallback(
    (
      item: Expense | Bill | Advance,
      type: "expense" | "bill" | "advance",
      reason?: string,
    ) => {
      const c = {
        by: user.name,
        text: reason || "Rejected.",
        d: new Date().toISOString().split("T")[0],
        t: "no" as const,
      };
      if (type === "expense") {
        const exp = item as Expense;
        setExps((prev) =>
          prev.map((e) =>
            e.id === exp.id
              ? { ...e, status: EXP_S.REJECTED, comments: [...e.comments, c] }
              : e,
          ),
        );
        setEmail({ to: exp.empName, subj: `Expense ${exp.id} rejected` });
      } else if (type === "bill") {
        const bill = item as Bill;
        setBills((prev) =>
          prev.map((b) =>
            b.id === bill.id
              ? { ...b, status: BILL_S.REJECTED, comments: [...b.comments, c] }
              : b,
          ),
        );
      } else if (type === "advance") {
        const adv = item as Advance;
        setAdvs((prev) =>
          prev.map((a) =>
            a.id === adv.id
              ? { ...a, status: ADV_S.REJECTED, comments: [...a.comments, c] }
              : a,
          ),
        );
        setEmail({ to: adv.empName, subj: `Advance ${adv.id} rejected` });
      }
      t("Rejected");
      setMdl(null);
    },
    [user, t],
  );

  const pay = useCallback(
    (
      item: Expense | Bill | Advance,
      type: "expense" | "bill" | "advance",
      ref: string,
    ) => {
      const c = {
        by: user.name,
        text: `Paid. Ref: ${ref}`,
        d: new Date().toISOString().split("T")[0],
        t: "pay" as const,
      };
      if (type === "expense") {
        const exp = item as Expense;
        setExps((prev) =>
          prev.map((e) =>
            e.id === exp.id
              ? { ...e, status: EXP_S.COMPLETED, comments: [...e.comments, c] }
              : e,
          ),
        );
        setEmail({
          to: exp.empName,
          cc: cfg.ccEmails.join(", "),
          subj: `Payment for ${exp.id} — Ref: ${ref}`,
        });
      } else if (type === "bill") {
        const bill = item as Bill;
        setBills((prev) =>
          prev.map((b) =>
            b.id === bill.id
              ? {
                  ...b,
                  status: BILL_S.PAID,
                  comments: [...b.comments, c],
                  paidRef: ref,
                }
              : b,
          ),
        );
        setEmail({
          to: `${bill.vName} <${bill.vEmail}>`,
          cc: [...(bill.cc || []), ...cfg.ccEmails].join(", "),
          subj: `Payment for ${bill.id} — Ref: ${ref}`,
        });
      } else if (type === "advance") {
        const adv = item as Advance;
        setAdvs((prev) =>
          prev.map((a) =>
            a.id === adv.id
              ? { ...a, status: ADV_S.DISBURSED, comments: [...a.comments, c] }
              : a,
          ),
        );
        setEmail({
          to: adv.empName,
          subj: `Advance ${adv.id} disbursed — Ref: ${ref}`,
        });
      }
      t("Payment processed");
      setMdl(null);
    },
    [user, cfg.ccEmails, t],
  );

  const is = useCallback((r: AppUser["role"]) => user?.role === r, [user]);

  const myExps = useMemo(
    () => exps.filter((e) => e.empId === user.id),
    [user, exps],
  );

  const pendExp = useMemo(
    () => exps.filter((e) => e.status === EXP_S.PENDING).length,
    [exps],
  );

  const pendBill = useMemo(
    () => bills.filter((b) => b.status === BILL_S.SUBMITTED).length,
    [bills],
  );

  const pendAdv = useMemo(
    () => advs.filter((a) => a.status === ADV_S.PENDING).length,
    [advs],
  );

  const payableExp = useMemo(
    () =>
      exps.filter(
        (e) => e.status === EXP_S.APPROVED || e.status === EXP_S.AWAITING_BILL,
      ),
    [exps],
  );

  const payableBill = useMemo(
    () =>
      bills.filter(
        (b) => b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE,
      ),
    [bills],
  );

  const fil = useCallback(
    <T extends { status: string }>(list: T[]): T[] => {
      let r = list;
      if (sf !== "all") r = r.filter((x) => x.status === sf) as T[];
      if (search) {
        const s = search.toLowerCase();
        r = r.filter((x) => JSON.stringify(x).toLowerCase().includes(s)) as T[];
      }
      return r;
    },
    [sf, search],
  );

  const value: AppContextValue = useMemo(
    () => ({
      user,
      setUser,
      cfg,
      setCfg,
      exps,
      setExps,
      bills,
      setBills,
      advs,
      setAdvs,
      invs,
      setInvs,
      vendors,
      setVendors,
      clients,
      setClients,
      mdl,
      setMdl,
      toast,
      setToast,
      email,
      setEmail,
      search,
      setSearch,
      sf,
      setSf,
      instance,
      t,
      rf,
      approve,
      reject,
      pay,
      is,
      myExps,
      pendExp,
      pendBill,
      pendAdv,
      payableExp,
      payableBill,
      fil,
      orgs,
      activeOrg,
      setActiveOrg,
    }),
    [
      user,
      cfg,
      exps,
      bills,
      advs,
      invs,
      vendors,
      clients,
      mdl,
      toast,
      email,
      search,
      sf,
      instance,
      t,
      rf,
      approve,
      reject,
      pay,
      is,
      myExps,
      pendExp,
      pendBill,
      pendAdv,
      payableExp,
      payableBill,
      fil,
      orgs,
      activeOrg,
      setActiveOrg,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
