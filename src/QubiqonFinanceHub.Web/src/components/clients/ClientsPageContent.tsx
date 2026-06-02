import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CirclePlus, HandCoins, RefreshCw, Search, UserRoundX } from "lucide-react";
import { C } from "../../shared/theme";
import { Av, Btn, DeleteActionButton, EditActionButton, Empty, Spinner, Tbl, type TblCol } from "../ui";
import ClientDeleteConfirmModal from "./ClientDeleteConfirmModal";
import { useAppContext } from "../../context/AppContext";
import { getClientsPaged } from "../../shared/api/clients";
import type { Client } from "../../types";
import { nextListSort } from "../../shared/utils";
import { EVENTS, MODAL_T, ROLES } from "../../shared/constants";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { is, setMdl, t } = useAppContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.CLIENTS_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.CLIENTS_REFRESH, handler);
  }, []);

  useEffect(() => {
    if (!deleteTarget) {
      setDeleteLoading(false);
      setDeleteError(null);
    } else {
      setDeleteError(null);
    }
  }, [deleteTarget]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getClientsPaged({
      page,
      pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      desc: sortDesc,
    })
      .then((r) => {
        setClients(r.items);
        setTotalCount(r.totalCount);
        setTotalPages(r.totalPages);
      })
      .catch(() => {
        setClients([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc, refreshKey]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);

  const cols: TblCol[] = [
    { label: "Client", sortKey: "Name" },
    { label: "Contact person", sortKey: "ContactPerson" },
    { label: "Email", sortKey: "Email" },
    { label: "Country", sortKey: "Country" },
    { label: "Currency", sortKey: "Currency" },
    { label: "Type", sortKey: "CustomerType" },
    is(ROLES.ADMIN) && "Actions",
  ];

  const rows = clients.map((client) => ({
    client,
    _cells: [
      {
        v: (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Av n={client.name} sz={36} bg={C.clientAvatarBg} color={C.clientAvatarText} />
            <div>
              <div style={{ fontWeight: 600, color: C.primary }}>{client.name}</div>
              {client.gstin && <div style={{ fontSize: "11px", color: C.muted }}>{client.gstin}</div>}
            </div>
          </div>
        ),
      },
      { v: client.contact || "NA" },
      { v: client.email || "NA" },
      { v: client.country || "NA" },
      { v: client.currency || "NA" },
      { v: client.customerType || "NA" },
      ...(is(ROLES.ADMIN)
        ? [
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
                  <EditActionButton
                    sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMdl({ t: MODAL_T.CLIENT_EDIT, d: client });
                    }}
                  />
                  <DeleteActionButton
                    sx={{ width: 30, height: 30, background: C.actionDeleteBg, borderRadius: "4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(client);
                    }}
                  />
                </span>
              ),
              sx: {
                textAlign: "center" as const,
                verticalAlign: "middle" as const,
              },
            },
          ]
        : []),
    ],
  }));

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .clients-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .clients-add-label {
            display: none;
          }

          .clients-table-card {
            margin-top: 20px;
          }

          .clients-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .clients-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="clients-page-header"
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
          <HandCoins size={24} strokeWidth={1.8} color={C.primary} />
          Clients
        </h1>
        {is(ROLES.ADMIN) && (
          <Btn
            v="primary"
            onClick={() => navigate("/clients/add")}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            <span className="clients-add-label">Add client</span>
          </Btn>
        )}
      </div>
      <div
        className="clients-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="clients-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="clients-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search clients..."
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
            aria-label="Refresh clients"
            title="Refresh clients"
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
          onRow={(row) => setMdl({ t: MODAL_T.CLIENT_DETAIL, d: (row as (typeof rows)[number]).client })}
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
                  Loading clients...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching client list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<UserRoundX size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No clients found" : "No clients"}
                sub={debouncedSearch ? "Try a different search term." : "Add clients to create invoices."}
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
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
          }}
          sortBy={sortBy}
          sortDesc={sortDesc}
          onSortChange={handleSort}
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
              Page {page} of {displayTotalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= displayTotalPages}
              onClick={() => {
                if (loading || page >= displayTotalPages) return;
                setPage((p) => Math.min(displayTotalPages, p + 1));
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
                opacity: loading || page >= displayTotalPages ? 0.45 : 1,
                cursor: loading || page >= displayTotalPages ? "not-allowed" : "pointer",
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

      <ClientDeleteConfirmModal
        target={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        setLoading={setDeleteLoading}
        setError={setDeleteError}
        onClose={() => setDeleteTarget(null)}
        onRemoved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
