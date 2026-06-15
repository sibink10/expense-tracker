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

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setCode("");
    setName("");
    setDescription("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: GstTreatment) => {
    setMode("edit");
    setEditingId(item.id);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description || "");
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || null,
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
  const cols: TblCol[] = ["Code", "Name", "Description", { label: "Status", sx: centeredColSx }, { label: "Actions", sx: centeredColSx }];

  const rows = items.map((item) => ({
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{item.code}</span> },
      { v: item.name },
      { v: item.description || "—" },
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
        {error && <Alert>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={handleSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
          <Btn v="secondary" onClick={() => setModalOpen(false)} disabled={submitLoading}>Cancel</Btn>
        </div>
      </Mdl>
    </>
  );
}
