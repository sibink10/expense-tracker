import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, UserRoundX, Users } from "lucide-react";
import { C } from "../../shared/theme";
import { DeleteActionButton, EditActionButton, Empty, Spinner, Tbl, Toggle, type TblCol } from "../ui";
import EmployeeDeleteConfirmModal from "./EmployeeDeleteConfirmModal";
import EmployeeFormModal from "./EmployeeFormModal";
import { useAppContext } from "../../context/AppContext";
import { getEmployeeRoles, getEmployees, saveEmployee, toggleEmployee, deleteEmployee, type Employee, type EmployeeRole } from "../../shared/api/employees";
import { nextListSort } from "../../shared/utils";

export default function EmployeesPage() {
  const { t, user } = useAppContext();
  const isCurrentUser = (emp: Employee) =>
    (user.email || "").toLowerCase().trim() === (emp.email || "").toLowerCase().trim();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("FullName");
  const [sortDesc, setSortDesc] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [mdlOpen, setMdlOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [form, setForm] = useState({
    entraObjectId: "",
    name: "",
    email: "",
    dept: "",
    role: "",
    designation: "",
    employeeCode: "",
  });

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const formatRoleLabel = (role: string) =>
    role
      .trim()
      .replace(/[_-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const isFormValid =
    form.name.trim().length > 0 &&
    isEmailValid(form.email) &&
    form.role.trim().length > 0;

  const load = (
    pageArg = page,
    searchArg = search,
    sb: string = sortBy,
    sd: boolean = sortDesc
  ) => {
    setLoading(true);
    void getEmployees({ page: pageArg, pageSize, search: searchArg || undefined, sortBy: sb, desc: sd })
      .then((res) => {
        setEmployees(res.items);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  };

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    load(1, search, n.sortBy, n.desc);
  };

  useEffect(() => {
    load(1, "");
    setRolesLoading(true);
    void getEmployeeRoles()
      .then(setRoles)
      .catch(() => t("Failed to load roles"))
      .finally(() => setRolesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger API search when search text changes (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      load(1, search, sortBy, sortDesc);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const rowsSource = employees;

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      entraObjectId: "",
      name: emp.name,
      email: emp.email,
      dept: emp.dept,
      role: emp.role || "",
      designation: emp.designation ?? "",
      employeeCode: emp.employeeCode ?? "",
    });
    setMdlOpen(true);
  };

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    const payload = {
      id: editing?.id,
      entraObjectId: editing ? undefined : form.entraObjectId.trim() || undefined,
      name: form.name.trim(),
      email: form.email.trim(),
      dept: form.dept.trim(),
      role: form.role.trim(),
      designation: form.designation.trim() || undefined,
      employeeCode: form.employeeCode.trim() || undefined,
    };
    setSaving(true);
    try {
      await saveEmployee(payload);
      setMdlOpen(false);
      load();
      t("Employee updated");
    } catch {
      t("Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const cols: TblCol[] = [
    { label: "Name", sortKey: "FullName" },
    { label: "Email" },
    { label: "Department" },
    { label: "Role" },
    { label: "Status" },
    "Action",
  ];
  const rows = rowsSource.map((e) => ({
    _cells: [
      { v: e.name || "NA" },
      { v: e.email || "NA" },
      { v: e.dept || "NA" },
      { v: e.role ? formatRoleLabel(e.role) : "NA" },
      {
        v: (
          <Toggle
            checked={e.isActive ?? true}
            disabled={isCurrentUser(e)}
            onChange={async (next) => {
              await toggleEmployee(e.id);
              load();
            }}
          />
        ),
      },
      {
        v: (
          <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <EditActionButton
              sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
              onClick={() => openEdit(e)}
            />
            <DeleteActionButton
              sx={{ width: 30, height: 30, background: C.actionDeleteBg, borderRadius: "4px" }}
              onClick={() => setDeleteTarget(e)}
              disabled={isCurrentUser(e)}
            />
          </span>
        ),
        sx: {
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        },
      },
    ],
  }));

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .employees-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .employees-add-label {
            display: none;
          }

          .employees-table-card {
            margin-top: 20px;
          }

          .employees-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .employees-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="employees-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div>
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
            <Users size={24} strokeWidth={1.8} color={C.primary} />
            Employees
          </h1>
        </div>
      </div>

      <div
        className="employees-table-card"
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: "0 -2px 108.5px 0 #00024914",
        }}
      >
        <div className="employees-table-controls" style={{ marginBottom: "10px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className="employees-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department…"
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
            aria-label="Refresh employees"
            title="Refresh employees"
            onClick={() => load(page, search, sortBy, sortDesc)}
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
                  Loading employees...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching employee directory.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<UserRoundX size={38} strokeWidth={1.6} />}
                title="No employees yet"
                sub="Add your first employee to get started."
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
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => {
              if (loading || page <= 1) return;
              const next = page - 1;
              setPage(next);
              load(next, search, sortBy, sortDesc);
            }}
            style={{
              width: 73,
              height: 28,
              borderRadius: "4px",
              padding: "4px 8px",
              gap: "4px",
              border: "1px solid #DEDEDE",
              background: "#fff",
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
              const next = page + 1;
              setPage(next);
              load(next, search, sortBy, sortDesc);
            }}
            style={{
              width: 73,
              height: 28,
              borderRadius: "4px",
              padding: "4px 8px",
              gap: "4px",
              border: "1px solid #DEDEDE",
              background: "#fff",
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

      <EmployeeFormModal
        open={mdlOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        roles={roles}
        rolesLoading={rolesLoading}
        saving={saving}
        isFormValid={isFormValid}
        onClose={() => setMdlOpen(false)}
        onSave={handleSave}
      />

      <EmployeeDeleteConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteEmployee(deleteTarget.id);
            t("Employee deleted");
            setDeleteTarget(null);
            load();
          } catch {
            t("Failed to delete employee");
          }
        }}
      />
    </div>
  );
}

