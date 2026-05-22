import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CirclePlus, FolderKanban, RefreshCw, Search, Tags } from "lucide-react";
import { C } from "../../../shared/theme";
import { Btn, Empty, Toggle, Spinner, Tbl, type TblCol } from "../../ui";
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
              borderRadius: "6px",
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
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .admin-categories-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-categories-add-label {
            display: none;
          }

          .admin-categories-table-card {
            margin-top: 20px;
          }

          .admin-categories-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-categories-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="admin-categories-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.primary,
            fontFamily: "'Manrope', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "-0.02em",
          }}
        >
          <FolderKanban size={24} strokeWidth={1.8} color={C.primary} />
          Categories
        </h1>
        <Btn
          v="primary"
          onClick={() => {
            setName("");
            setError(null);
            setModalOpen(true);
          }}
          sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
        >
          <CirclePlus size={15} strokeWidth={1.8} />
          <span className="admin-categories-add-label">Add category</span>
        </Btn>
      </div>

      <div
        className="admin-categories-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="admin-categories-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="admin-categories-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search categories..."
              style={{
                width: "100%",
                padding: "7px 12px 7px 34px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Search size={16} strokeWidth={2} />
            </span>
          </div>
          <button
            type="button"
            aria-label="Refresh categories"
            title="Refresh categories"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: "4px",
              background: "transparent",
              color: C.primary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <RefreshCw size={20} strokeWidth={1.9} />
          </button>
        </div>

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

      <CategoryFormModal
        open={modalOpen}
        name={name}
        error={error}
        submitLoading={submitLoading}
        setName={setName}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}

