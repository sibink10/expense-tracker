import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CirclePlus, Clock, RefreshCw, Search } from "lucide-react";
import { Btn, EditActionButton, Empty, Spinner, Toggle, Tbl, type TblCol } from "../../ui";
import PaymentTermFormModal from "./PaymentTermFormModal";
import { useAppContext } from "../../../context/AppContext";
import { type PaymentTerm, createPaymentTerm, getPaymentTerms, updatePaymentTerm } from "../../../shared/api";
import { C } from "../../../shared/theme";

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
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [days, setDays] = useState("30");

  useEffect(() => {
    setLoading(true);
    getPaymentTerms()
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

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((item) =>
      [item.name, item.shortName, String(item.days), item.isActive ? "Active" : "Inactive"]
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
    { label: "Days", sx: centeredColSx },
    { label: "Status", sx: centeredColSx },
    { label: "Actions", sx: centeredColSx },
  ];

  const rows = pageItems.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.name}</span> },
      { v: item.shortName },
      { v: item.days, sx: centeredColSx },
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
          .admin-payment-terms-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-payment-terms-add-label {
            display: none;
          }

          .admin-payment-terms-table-card {
            margin-top: 20px;
          }

          .admin-payment-terms-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-payment-terms-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="admin-payment-terms-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
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
          <Clock size={24} strokeWidth={1.8} color={C.primary} />
          Payment terms
        </h1>
        <Btn v="primary" onClick={openAdd} sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}>
          <CirclePlus size={15} strokeWidth={1.8} />
          <span className="admin-payment-terms-add-label">Add payment term</span>
        </Btn>
      </div>

      <div
        className="admin-payment-terms-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="admin-payment-terms-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="admin-payment-terms-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search payment terms..."
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
            aria-label="Refresh payment terms"
            title="Refresh payment terms"
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
                  Loading payment terms...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching payment term list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<Clock size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No payment terms found" : "No payment terms"}
                sub={debouncedSearch ? "Try a different search term." : "Create payment terms to define due dates."}
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
    </div>
  );
}
