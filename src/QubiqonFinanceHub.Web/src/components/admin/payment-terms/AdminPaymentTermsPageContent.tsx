import { useEffect, useMemo, useState } from "react";
import { CirclePlus, Clock } from "lucide-react";
import {
  Btn,
  CollapsibleSearch,
  EditActionButton,
  Empty,
  ListPageHeader,
  ListPagination,
  Spinner,
  TableToolbarRefresh,
  Toggle,
  Tbl,
  type TblCol,
} from "../../ui";
import PaymentTermFormModal from "./PaymentTermFormModal";
import { useAppContext } from "../../../context/AppContext";
import {
  type PaymentTerm,
  createPaymentTerm,
  getPaymentTermsPaged,
  updatePaymentTerm,
} from "../../../shared/api/paymentTerms";
import { C, R, tableIconButtonSx } from "../../../shared/theme";

type Mode = "add" | "edit";
const PAGE_SIZE = 10;

export default function AdminPaymentTermsPage() {
  const { t } = useAppContext();
  const [items, setItems] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [days, setDays] = useState("30");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getPaymentTermsPaged({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      sortBy: "Name",
      desc: false,
    })
      .then((res) => {
        setItems(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, refreshKey]);

  const submitDisabled = useMemo(
    () => !name.trim() || !shortName.trim() || Number.isNaN(Number(days)) || Number(days) < 0 || submitLoading,
    [name, shortName, days, submitLoading]
  );

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setName("");
    setShortName("");
    setDays("30");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: PaymentTerm) => {
    setMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setShortName(item.shortName);
    setDays(String(item.days));
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        shortName: shortName.trim().toLowerCase(),
        days: Number(days),
      };
      if (mode === "add") {
        await createPaymentTerm(payload);
        t("Payment term added");
      } else if (editingId) {
        const original = items.find((x) => x.id === editingId);
        await updatePaymentTerm(editingId, { ...payload, isActive: original?.isActive ?? true });
        t("Payment term updated");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save payment term");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (item: PaymentTerm, next: boolean) => {
    try {
      await updatePaymentTerm(item.id, {
        name: item.name,
        shortName: item.shortName,
        days: item.days,
        isActive: next,
      });
      setRefreshKey((k) => k + 1);
    } catch {
      t("Failed to update status", "error");
    }
  };

  const displayTotalPages = Math.max(totalPages, 1);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = [
    "Name",
    "Short name",
    { label: "Days", sx: centeredColSx },
    { label: "Status", sx: centeredColSx },
    { label: "Actions", sx: centeredColSx },
  ];

  const rows = items.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.name}</span> },
      { v: item.shortName },
      { v: item.days, sx: centeredColSx },
      {
        v: (
          <span style={{ minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Toggle checked={item.isActive} onChange={(next) => handleToggle(item, next)} />
          </span>
        ),
        sx: centeredColSx,
      },
      {
        v: (
          <span style={{ minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <EditActionButton sx={tableIconButtonSx(C.actionEditBg)} onClick={() => openEdit(item)} />
          </span>
        ),
        sx: centeredColSx,
      },
    ],
  }));

  return (
    <>
      <ListPageHeader
        className="list-page-header"
        title="Payment Terms"
        icon={<Clock size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch value={searchInput} onChange={setSearchInput} placeholder="Search payment terms..." />
            <Btn v="primary" onClick={openAdd} sx={{ borderRadius: R.control, boxShadow: C.cardShadow }}>
              <CirclePlus size={15} strokeWidth={1.8} />
              <span className="admin-payment-terms-add-label">Add payment term</span>
            </Btn>
          </>
        }
      >
        <div
          style={{
            background: C.white,
            borderRadius: R.control,
            padding: "14px 16px 16px",
            marginTop: "26px",
            boxShadow: C.cardShadow,
          }}
        >
          <TableToolbarRefresh
            onRefresh={() => setRefreshKey((k) => k + 1)}
            refreshDisabled={loading}
            refreshAriaLabel="Refresh payment terms"
          />
          <Tbl
            cols={cols}
            rows={loading ? [] : rows}
            bodyFallback={
              loading ? (
                <div style={{ minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <Spinner size={28} />
                </div>
              ) : rows.length === 0 ? (
                <Empty
                  icon={<Clock size={38} strokeWidth={1.6} />}
                  title={debouncedSearch ? "No payment terms found" : "No payment terms"}
                  sub={debouncedSearch ? "Try a different search term." : "Create payment terms to define due dates."}
                />
              ) : null
            }
          />
          <ListPagination
            page={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            totalPages={displayTotalPages}
            loading={loading}
            onPageChange={setPage}
          />
        </div>
      </ListPageHeader>

      <PaymentTermFormModal
        open={modalOpen}
        mode={mode}
        name={name}
        shortName={shortName}
        days={days}
        error={error}
        submitLoading={submitLoading}
        submitDisabled={submitDisabled}
        setName={setName}
        setShortName={setShortName}
        setDays={setDays}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
