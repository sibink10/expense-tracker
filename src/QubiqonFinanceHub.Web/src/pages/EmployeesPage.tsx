import { useEffect, useState } from "react";
import { C } from "../shared/theme";
import { Btn, Empty, Inp, Mdl, Tbl, Toggle, ListRefreshButton, type TblCol } from "../components/ui";
import { TrashIcon } from "../components/icons";
import { useAppContext } from "../context/AppContext";
import { getEmployees, saveEmployee, toggleEmployee, deleteEmployee, type Employee } from "../shared/api/employees";
import { getGraphUsers, type GraphUser } from "../shared/api/graph";
import { nextListSort } from "../shared/utils";

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
  const [graphUsers, setGraphUsers] = useState<GraphUser[]>([]);
  const [graphUsersLoading, setGraphUsersLoading] = useState(false);
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

  const openAdd = () => {
    setEditing(null);
    setForm({
      entraObjectId: "",
      name: "",
      email: "",
      dept: "",
      role: "",
      designation: "",
      employeeCode: "",
    });
    setMdlOpen(true);
    if (graphUsers.length === 0 && !graphUsersLoading) {
      setGraphUsersLoading(true);
      void getGraphUsers()
        .then(setGraphUsers)
        .catch(() => t("Failed to load Entra users", "no"))
        .finally(() => setGraphUsersLoading(false));
    }
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      entraObjectId: "",
      name: emp.name,
      email: emp.email,
      dept: emp.dept,
      role: (emp.role || "").toLowerCase(),
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
      t(editing ? "Employee updated" : "Employee added");
    } catch {
      t("Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const handleEntraUserChange = (entraObjectId: string) => {
    const selected = graphUsers.find((item) => item.id === entraObjectId);
    const email = selected?.mail || selected?.userPrincipalName || "";

    setForm((f) => ({
      ...f,
      entraObjectId,
      name: selected?.displayName || f.name,
      email: email || f.email,
      dept: selected?.department || f.dept,
      designation: selected?.jobTitle || f.designation,
      employeeCode: selected?.employeeId || f.employeeCode,
    }));
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
      { v: e.role || "NA" },
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
            <Btn sm v="secondary" onClick={() => openEdit(e)}>
              ✎
            </Btn>
            <Btn sm v="danger" onClick={() => setDeleteTarget(e)} disabled={isCurrentUser(e)}>
              <TrashIcon size={16} color="#fff" />
            </Btn>
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
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div
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
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
            <span style={{ color: C.info }}>👥</span> Employees
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.muted }}>
            Manage employee directory used across expenses, advances and approvals.
          </p>
        </div>
        <Btn v="primary" onClick={openAdd}>
          ＋ Add employee
        </Btn>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          padding: "14px 16px 16px",
        }}
      >
        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department…"
              style={{
                width: "100%",
                padding: "7px 12px 7px 30px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'DM Sans'",
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
                fontSize: "12px",
                color: C.muted,
              }}
            >
              ⌕
            </span>
          </div>
          <div style={{ flexShrink: 0, marginLeft: "auto" }}>
            <ListRefreshButton loading={loading} onRefresh={() => load(page, search, sortBy, sortDesc)} />
          </div>
        </div>

        {loading ? (
          <Empty icon="⏳" title="Loading employees…" sub="Fetching employee directory." />
        ) : rows.length === 0 ? (
          <Empty icon="👥" title="No employees yet" sub="Add your first employee to get started." />
        ) : (
          <>
            <Tbl
              cols={cols}
              rows={rows}
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
              <span style={{ fontSize: "11px", color: C.muted }}>
                Page {page} of {totalPages}
              </span>
              <Btn
                sm
                v="secondary"
                disabled={page <= 1}
                onClick={() => {
                  if (page <= 1) return;
                  const next = page - 1;
                  setPage(next);
                  load(next, search, sortBy, sortDesc);
                }}
              >
                Prev
              </Btn>
              <Btn
                sm
                v="secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  if (page >= totalPages) return;
                  const next = page + 1;
                  setPage(next);
                  load(next, search, sortBy, sortDesc);
                }}
              >
                Next
              </Btn>
            </div>
          </>
        )}
      </div>

      <Mdl
        open={mdlOpen}
        close={() => setMdlOpen(false)}
        title={editing ? "Edit employee" : "Add employee"}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          <div>
            {editing ? (
              <Inp
                label="Entra employee"
                type="select"
                value={form.email}
                opts={[
                  {
                    v: form.email,
                    l: `${form.name || form.email || "Selected employee"}${form.email ? ` (${form.email})` : ""}`,
                  },
                ]}
                disabled
                req
              />
            ) : (
              <Inp
                label="Entra employee"
                type="select"
                value={form.entraObjectId}
                onChange={(e) => handleEntraUserChange(e.target.value)}
                opts={[
                  {
                    v: "",
                    l: graphUsersLoading ? "Loading Entra users..." : "Select employee from Entra...",
                  },
                  ...graphUsers.map((item) => {
                    const email = item.mail || item.userPrincipalName || "No email";
                    return {
                      v: item.id,
                      l: `${item.displayName || email} (${email})`,
                    };
                  }),
                ]}
                disabled={graphUsersLoading}
                req
              />
            )}
            <Inp
              label="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              req
            />
            <Inp
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={!!editing}
              req
            />
            <Inp
              label="Department"
              value={form.dept}
              onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
            />
          </div>
          <div>
            <Inp
              label="Role"
              type="select"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              opts={[
                { v: "", l: "Select role..." },
                { v: "employee", l: "Employee" },
                { v: "approver", l: "Approver" },
                { v: "finance", l: "Finance" },
                { v: "PROJECT_MANAGER", l: "Project Manager" },
                { v: "admin", l: "Admin" },
              ]}
              req
            />
            <Inp
              label="Designation"
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            />
            <Inp
              label="Employee code"
              value={form.employeeCode}
              onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Btn v="secondary" sm onClick={() => setMdlOpen(false)}>
            Cancel
          </Btn>
          <Btn v="primary" sm onClick={handleSave} disabled={!isFormValid || saving}>
            {saving ? "⏳ Saving..." : "Save"}
          </Btn>
        </div>
      </Mdl>

      <Mdl open={!!deleteTarget} close={() => setDeleteTarget(null)} title="Delete employee">
        {deleteTarget && (
          <>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.muted }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Btn v="secondary" sm onClick={() => setDeleteTarget(null)}>
                Cancel
              </Btn>
              <Btn
                v="danger"
                sm
                onClick={async () => {
                  try {
                    await deleteEmployee(deleteTarget.id);
                    t("Employee deleted");
                    setDeleteTarget(null);
                    load();
                  } catch {
                    t("Failed to delete employee");
                  }
                }}
              >
                Delete
              </Btn>
            </div>
          </>
        )}
      </Mdl>
    </div>
  );
}

