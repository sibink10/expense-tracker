import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CirclePlus, Landmark, WalletCards } from "lucide-react";
import {
  Btn,
  CollapsibleSearch,
  EditActionButton,
  Empty,
  ListPageHeader,
  Spinner,
  TableToolbarRefresh,
  Toggle,
  Tbl,
  type TblCol,
} from "../../ui";
import AccountFormModal from "./AccountFormModal";
import { useAppContext } from "../../../context/AppContext";
import { type Account, createAccount, getAccounts, updateAccount } from "../../../shared/api";
import { C } from "../../../shared/theme";

type Mode = "add" | "edit";
const PAGE_SIZE = 10;

export default function AdminAccountsPage() {
  const { t } = useAppContext();
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");

  useEffect(() => {
    setLoading(true);
    getAccounts()
      .then((res) => setItems(res))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const submitDisabled = useMemo(() => !name.trim() || !shortName.trim() || submitLoading, [name, shortName, submitLoading]);

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setName("");
    setShortName("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Account) => {
    setMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setShortName(item.shortName);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = { name: name.trim(), shortName: shortName.trim().toLowerCase() };
      if (mode === "add") {
        await createAccount(payload);
        t("Account added");
      } else if (editingId) {
        const original = items.find((x) => x.id === editingId);
        await updateAccount(editingId, { ...payload, isActive: original?.isActive ?? true });
        t("Account updated");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (item: Account, next: boolean) => {
    try {
      await updateAccount(item.id, { name: item.name, shortName: item.shortName, isActive: next });
      setRefreshKey((k) => k + 1);
    } catch {
      t("Failed to update status", "error");
    }
  };

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((item) =>
      [item.name, item.shortName, item.isActive ? "Active" : "Inactive"]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(debouncedSearch))
    );
  }, [debouncedSearch, items]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalCount);
  const pageItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = [
    "Name",
    "Short name",
    { label: "Status", sx: centeredColSx },
    { label: "Actions", sx: centeredColSx },
  ];
  const rows = pageItems.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.name}</span> },
      { v: item.shortName },
      {
        v: (
          <span
            style={{
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <Toggle checked={item.isActive} onChange={(next) => handleToggle(item, next)} />
          </span>
        ),
        sx: centeredColSx,
      },
      {
        v: (
          <span
            style={{
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              verticalAlign: "middle",
            }}
          >
            <EditActionButton
              sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
              onClick={() => openEdit(item)}
            />
          </span>
        ),
        sx: centeredColSx,
      },
    ],
  }));

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .list-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-accounts-add-label {
            display: none;
          }

          .admin-accounts-table-card {
            margin-top: 20px;
          }
        }
      `}</style>
      <ListPageHeader
        className="list-page-header"
        title="Accounts"
        icon={<Landmark size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search accounts..."
            />
            <Btn v="primary" onClick={openAdd} sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}>
              <CirclePlus size={15} strokeWidth={1.8} />
              <span className="admin-accounts-add-label">Add account</span>
            </Btn>
          </>
        }
      />

      <div
        className="admin-accounts-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <TableToolbarRefresh
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh accounts"
        />

        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          bodyFallback={
            loading ? (
              <div
                style={{
                  minHeight: "460px",
                  padding: "42px 16px",
                  textAlign: "center",
                  color: C.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <Spinner size={28} />
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: C.primary }}>
                  Loading accounts...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching account list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<WalletCards size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No accounts found" : "No accounts"}
                sub={debouncedSearch ? "Try a different search term." : "Create accounts to organize workspace settings."}
              />
            ) : null
          }
          headerSx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
            Showing {totalCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCount}
          </span>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => {
                if (loading || page <= 1) return;
                setPage((p) => Math.max(1, p - 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page <= 1 ? 0.45 : 1,
                cursor: loading || page <= 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              Prev
            </button>
            <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => {
                if (loading || page >= totalPages) return;
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page >= totalPages ? 0.45 : 1,
                cursor: loading || page >= totalPages ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Next
              <ChevronRight size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>

      <AccountFormModal
        open={modalOpen}
        mode={mode}
        name={name}
        shortName={shortName}
        error={error}
        submitLoading={submitLoading}
        submitDisabled={submitDisabled}
        setName={setName}
        setShortName={setShortName}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
