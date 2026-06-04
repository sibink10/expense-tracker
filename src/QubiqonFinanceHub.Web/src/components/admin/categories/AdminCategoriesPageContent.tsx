import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CirclePlus, FolderKanban, Tags } from "lucide-react";
import { C, R } from "../../../shared/theme";
import {
  Btn,
  CollapsibleSearch,
  Empty,
  ListPageHeader,
  Spinner,
  TableToolbarRefresh,
  Toggle,
  Tbl,
  type TblCol,
} from "../../ui";
import CategoryFormModal from "./CategoryFormModal";
import { getCategories, createCategory, toggleCategory, type Category } from "../../../shared/api";
import { useAppContext } from "../../../context/AppContext";

const PAGE_SIZE = 10;

export default function AdminCategoriesPage() {
  const { t } = useAppContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((items) => setCategories(items))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSubmitLoading(true);
    setError(null);
    try {
      await createCategory({ name: name.trim() });
      setName("");
      setRefreshKey((k) => k + 1);
      setModalOpen(false);
      t("Category added");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleCategory(id);
      setRefreshKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch) return categories;
    return categories.filter((category) =>
      [category.name, category.isActive ? "Active" : "Inactive"]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(debouncedSearch))
    );
  }, [categories, debouncedSearch]);

  const totalCount = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalCount);
  const pageItems = filteredCategories.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = [
    "Name",
    { label: "Status", sx: centeredColSx },
    { label: "Action", sx: centeredColSx },
  ];

  const rows = pageItems.map((category) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{category.name}</span> },
      {
        v: (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: R.control,
              fontSize: "10px",
              fontWeight: 600,
              background: category.isActive ? C.successBg : C.surface,
              color: category.isActive ? C.success : C.muted,
            }}
          >
            {category.isActive ? "Active" : "Inactive"}
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
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <Toggle
              checked={category.isActive}
              disabled={togglingId === category.id}
              onChange={() => void handleToggle(category.id)}
            />
          </span>
        ),
        sx: centeredColSx,
      },
    ],
  }));

  return (
      <ListPageHeader
        className="list-page-header"
        title="Categories"
        icon={<FolderKanban size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search categories..."
            />
            <Btn
              v="primary"
              onClick={() => {
                setName("");
                setError(null);
                setModalOpen(true);
              }}
              sx={{ borderRadius: R.control, boxShadow: C.cardShadow }}
            >
              <CirclePlus size={15} strokeWidth={1.8} />
              <span className="admin-categories-add-label">Add category</span>
            </Btn>
          </>
        }
      >
      <style>{`
        @media (max-width: 640px) {
          .list-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-categories-add-label {
            display: none;
          }

          .admin-categories-table-card {
            margin-top: 20px;
          }
        }
      `}</style>
      <div
        className="admin-categories-table-card"
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
          refreshAriaLabel="Refresh categories"
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
                  Loading categories...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching category list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<Tags size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No categories found" : "No categories"}
                sub={debouncedSearch ? "Try a different search term." : "Add categories to organize bills and vendors."}
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
                borderRadius: R.control,
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
                borderRadius: R.control,
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

      <CategoryFormModal
        open={modalOpen}
        name={name}
        error={error}
        submitLoading={submitLoading}
        setName={setName}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />
    </ListPageHeader>
  );
}

