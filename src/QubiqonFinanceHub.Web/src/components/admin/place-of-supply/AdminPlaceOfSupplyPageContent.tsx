import { useEffect, useMemo, useState } from "react";
import { CirclePlus, MapPin } from "lucide-react";
import {
  Alert,
  Btn,
  CollapsibleSearch,
  DeleteActionButton,
  EditActionButton,
  Empty,
  Inp,
  ListPageHeader,
  ListPagination,
  Mdl,
  Spinner,
  TableToolbarRefresh,
  Tbl,
  type TblCol,
} from "../../ui";
import { useAppContext } from "../../../context/AppContext";
import {
  type PlaceOfSupplyItem,
  createPlaceOfSupply,
  deletePlaceOfSupply,
  getPlaceOfSupplyPaged,
  updatePlaceOfSupply,
} from "../../../shared/api/placeOfSupply";
import { C, R, tableIconButtonSx } from "../../../shared/theme";

const PAGE_SIZE = 10;

export default function AdminPlaceOfSupplyPageContent() {
  const { t } = useAppContext();
  const [items, setItems] = useState<PlaceOfSupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");
  const [isUnionTerritory, setIsUnionTerritory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getPlaceOfSupplyPaged({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, sortBy: "Name", desc: false })
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

  const submitDisabled = useMemo(() => {
    if (submitLoading) return true;
    if (!name.trim() || !countryCode.trim() || !countryName.trim()) return true;
    if (mode === "add" && code.trim().length !== 2) return true;
    return false;
  }, [code, name, countryCode, countryName, mode, submitLoading]);

  const openAdd = () => {
    setMode("add");
    setEditingCode(null);
    setCode("");
    setName("");
    setCountryCode("IN");
    setCountryName("India");
    setIsUnionTerritory(false);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: PlaceOfSupplyItem) => {
    setMode("edit");
    setEditingCode(item.code);
    setCode(item.code);
    setName(item.name);
    setCountryCode(item.countryCode);
    setCountryName(item.countryName);
    setIsUnionTerritory(item.isUnionTerritory);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      if (mode === "add") {
        await createPlaceOfSupply({
          code: code.trim(),
          name: name.trim(),
          countryCode: countryCode.trim(),
          countryName: countryName.trim(),
          isUnionTerritory,
        });
        t("Place of supply added");
      } else if (editingCode) {
        await updatePlaceOfSupply(editingCode, {
          name: name.trim(),
          countryCode: countryCode.trim(),
          countryName: countryName.trim(),
          isUnionTerritory,
        });
        t("Place of supply updated");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save place of supply");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (item: PlaceOfSupplyItem) => {
    try {
      await deletePlaceOfSupply(item.code);
      t("Place of supply deleted");
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const displayTotalPages = Math.max(totalPages, 1);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = ["Code", "Name", "Country", { label: "UT", sx: centeredColSx }, { label: "Actions", sx: centeredColSx }];

  const rows = items.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.code}</span> },
      { v: item.name },
      { v: item.countryName },
      { v: item.isUnionTerritory ? "Yes" : "No", sx: centeredColSx },
      {
        v: (
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <EditActionButton sx={tableIconButtonSx(C.actionEditBg)} onClick={() => openEdit(item)} />
            <DeleteActionButton sx={tableIconButtonSx(C.actionDeleteBg)} onClick={() => handleDelete(item)} />
          </span>
        ),
        sx: centeredColSx,
      },
    ],
  }));

  return (
    <>
      <ListPageHeader
        title="Place of Supply"
        icon={<MapPin size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch value={searchInput} onChange={setSearchInput} placeholder="Search places of supply..." />
            <Btn v="primary" onClick={openAdd} sx={{ borderRadius: R.control }}>
              <CirclePlus size={15} strokeWidth={1.8} />
              Add place
            </Btn>
          </>
        }
      >
        <div style={{ background: C.white, borderRadius: R.control, padding: "14px 16px", marginTop: "26px", boxShadow: C.cardShadow }}>
          <TableToolbarRefresh onRefresh={() => setRefreshKey((k) => k + 1)} refreshDisabled={loading} refreshAriaLabel="Refresh place of supply" />
          <Tbl
            cols={cols}
            rows={loading ? [] : rows}
            bodyFallback={
              loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={28} /></div>
                : rows.length === 0 ? <Empty icon={<MapPin size={38} />} title="No places of supply" sub="Indian state and UT codes for GST." />
                : null
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

      <Mdl open={modalOpen} close={() => !submitLoading && setModalOpen(false)} title={mode === "add" ? "Add place of supply" : "Edit place of supply"}>
        <Inp label="Code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 2))} req ph="29" disabled={mode === "edit"} />
        <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="Karnataka" />
        <Inp label="Country code" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} req />
        <Inp label="Country name" value={countryName} onChange={(e) => setCountryName(e.target.value)} req />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13 }}>
          <input type="checkbox" checked={isUnionTerritory} onChange={(e) => setIsUnionTerritory(e.target.checked)} />
          Union Territory
        </label>
        {error && <Alert>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={handleSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
          <Btn v="secondary" onClick={() => setModalOpen(false)} disabled={submitLoading}>Cancel</Btn>
        </div>
      </Mdl>
    </>
  );
}
