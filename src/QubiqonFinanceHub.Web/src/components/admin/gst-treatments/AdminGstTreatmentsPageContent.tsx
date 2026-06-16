import { useEffect, useMemo, useState } from "react";
import { CirclePlus, Receipt } from "lucide-react";
import {
  Alert,
  Btn,
  CollapsibleSearch,
  EditActionButton,
  Empty,
  Inp,
  ListPageHeader,
  ListPagination,
  Mdl,
  Spinner,
  TableToolbarRefresh,
  Toggle,
  Tbl,
  type TblCol,
} from "../../ui";
import { useAppContext } from "../../../context/AppContext";
import {
  type GstTreatment,
  createGstTreatment,
  getGstTreatmentsPaged,
  toggleGstTreatment,
  updateGstTreatment,
} from "../../../shared/api/gstTreatments";
import { C, R, tableIconButtonSx } from "../../../shared/theme";

const PAGE_SIZE = 10;

const DEFAULT_FLAGS = {
  showGstin: true,
  showPlaceOfSupply: true,
  showTaxPreference: true,
  showPan: true,
  showBusinessLegalName: false,
  showBusinessTradeName: false,
};

function FlagCell({ value }: { value: boolean }) {
  return (
    <span style={{ fontSize: "12px", fontWeight: 600, color: value ? C.accent : C.muted }}>
      {value ? "Yes" : "No"}
    </span>
  );
}

function FieldFlagCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.text }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function AdminGstTreatmentsPageContent() {
  const { t } = useAppContext();
  const [items, setItems] = useState<GstTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showGstin, setShowGstin] = useState(true);
  const [showPlaceOfSupply, setShowPlaceOfSupply] = useState(true);
  const [showTaxPreference, setShowTaxPreference] = useState(true);
  const [showPan, setShowPan] = useState(true);
  const [showBusinessLegalName, setShowBusinessLegalName] = useState(false);
  const [showBusinessTradeName, setShowBusinessTradeName] = useState(false);
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
    getGstTreatmentsPaged({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined, sortBy: "Name", desc: false })
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
    () => !code.trim() || !name.trim() || submitLoading,
    [code, name, submitLoading]
  );

  const resetFlags = () => {
    setShowGstin(DEFAULT_FLAGS.showGstin);
    setShowPlaceOfSupply(DEFAULT_FLAGS.showPlaceOfSupply);
    setShowTaxPreference(DEFAULT_FLAGS.showTaxPreference);
    setShowPan(DEFAULT_FLAGS.showPan);
    setShowBusinessLegalName(DEFAULT_FLAGS.showBusinessLegalName);
    setShowBusinessTradeName(DEFAULT_FLAGS.showBusinessTradeName);
  };

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setCode("");
    setName("");
    setDescription("");
    resetFlags();
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: GstTreatment) => {
    setMode("edit");
    setEditingId(item.id);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description || "");
    setShowGstin(item.showGstin);
    setShowPlaceOfSupply(item.showPlaceOfSupply);
    setShowTaxPreference(item.showTaxPreference);
    setShowPan(item.showPan);
    setShowBusinessLegalName(item.showBusinessLegalName);
    setShowBusinessTradeName(item.showBusinessTradeName);
    setError(null);
    setModalOpen(true);
  };

  const flagPayload = () => ({
    showGstin,
    showPlaceOfSupply,
    showTaxPreference,
    showPan,
    showBusinessLegalName,
    showBusinessTradeName,
  });

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || null,
        ...flagPayload(),
      };
      if (mode === "add") {
        await createGstTreatment(payload);
        t("GST treatment added");
      } else if (editingId) {
        const original = items.find((x) => x.id === editingId);
        await updateGstTreatment(editingId, { ...payload, isActive: original?.isActive ?? true });
        t("GST treatment updated");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save GST treatment");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (item: GstTreatment, next: boolean) => {
    try {
      await updateGstTreatment(item.id, {
        code: item.code,
        name: item.name,
        description: item.description,
        isActive: next,
        showGstin: item.showGstin,
        showPlaceOfSupply: item.showPlaceOfSupply,
        showTaxPreference: item.showTaxPreference,
        showPan: item.showPan,
        showBusinessLegalName: item.showBusinessLegalName,
        showBusinessTradeName: item.showBusinessTradeName,
      });
      setRefreshKey((k) => k + 1);
    } catch {
      try {
        await toggleGstTreatment(item.id);
        setRefreshKey((k) => k + 1);
      } catch {
        t("Failed to update status", "error");
      }
    }
  };

  const displayTotalPages = Math.max(totalPages, 1);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = [
    "Code",
    "Name",
    { label: "GSTIN", sx: centeredColSx },
    { label: "POS", sx: centeredColSx },
    { label: "Tax pref.", sx: centeredColSx },
    { label: "PAN req.", sx: centeredColSx },
    { label: "Legal name", sx: centeredColSx },
    { label: "Trade name", sx: centeredColSx },
    { label: "Status", sx: centeredColSx },
    { label: "Actions", sx: centeredColSx },
  ];

  const rows = items.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.code}</span> },
      { v: item.name },
      { v: <FlagCell value={item.showGstin} />, sx: centeredColSx },
      { v: <FlagCell value={item.showPlaceOfSupply} />, sx: centeredColSx },
      { v: <FlagCell value={item.showTaxPreference} />, sx: centeredColSx },
      { v: <FlagCell value={item.showPan} />, sx: centeredColSx },
      { v: <FlagCell value={item.showBusinessLegalName} />, sx: centeredColSx },
      { v: <FlagCell value={item.showBusinessTradeName} />, sx: centeredColSx },
      {
        v: (
          <span style={{ minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Toggle checked={item.isActive} onChange={(next) => handleToggle(item, next)} />
          </span>
        ),
        sx: centeredColSx,
      },
      {
        v: <EditActionButton sx={tableIconButtonSx(C.actionEditBg)} onClick={() => openEdit(item)} />,
        sx: centeredColSx,
      },
    ],
  }));

  return (
    <>
      <ListPageHeader
        title="GST Treatments"
        icon={<Receipt size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch value={searchInput} onChange={setSearchInput} placeholder="Search GST treatments..." />
            <Btn v="primary" onClick={openAdd} sx={{ borderRadius: R.control }}>
              <CirclePlus size={15} strokeWidth={1.8} />
              Add treatment
            </Btn>
          </>
        }
      >
        <div style={{ background: C.white, borderRadius: R.control, padding: "14px 16px", marginTop: "26px", boxShadow: C.cardShadow }}>
          <TableToolbarRefresh onRefresh={() => setRefreshKey((k) => k + 1)} refreshDisabled={loading} refreshAriaLabel="Refresh GST treatments" />
          <Tbl
            cols={cols}
            rows={loading ? [] : rows}
            bodyFallback={
              loading ? <div style={{ padding: 40, textAlign: "center" }}><Spinner size={28} /></div>
                : rows.length === 0 ? <Empty icon={<Receipt size={38} />} title="No GST treatments" sub="Add treatments used on client records." />
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

      <Mdl open={modalOpen} close={() => !submitLoading && setModalOpen(false)} title={mode === "add" ? "Add GST treatment" : "Edit GST treatment"}>
        <Inp label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} req ph="REGISTERED" />
        <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="Registered" />
        <Inp label="Description" type="textarea" value={description} onChange={(e) => setDescription(e.target.value)} ph="Optional description" />
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "8px" }}>Client form fields</div>
          <div style={{ display: "grid", gap: "8px", padding: "10px 12px", background: C.surface, borderRadius: R.control, border: `1px solid ${C.border}` }}>
            <FieldFlagCheckbox label="GSTIN / UIN" checked={showGstin} onChange={setShowGstin} />
            <FieldFlagCheckbox label="Place of supply" checked={showPlaceOfSupply} onChange={setShowPlaceOfSupply} />
            <FieldFlagCheckbox label="Tax preference" checked={showTaxPreference} onChange={setShowTaxPreference} />
            <FieldFlagCheckbox label="PAN (required)" checked={showPan} onChange={setShowPan} />
            <FieldFlagCheckbox label="Business legal name" checked={showBusinessLegalName} onChange={setShowBusinessLegalName} />
            <FieldFlagCheckbox label="Business trade name" checked={showBusinessTradeName} onChange={setShowBusinessTradeName} />
          </div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>
            Fields shown on the client form when this treatment is selected. PAN is always shown; this flag makes it mandatory.
          </div>
        </div>
        {error && <Alert>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={handleSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
          <Btn v="secondary" onClick={() => setModalOpen(false)} disabled={submitLoading}>Cancel</Btn>
        </div>
      </Mdl>
    </>
  );
}
