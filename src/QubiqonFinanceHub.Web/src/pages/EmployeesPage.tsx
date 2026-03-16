import { useEffect, useState } from "react";
import { C } from "../shared/theme";
import { Btn, Empty, Inp, Mdl, Tbl, Toggle } from "../components/ui";
import { getEmployees, saveEmployee, toggleEmployee, type Employee } from "../shared/api/employees";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [mdlOpen, setMdlOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
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

  const load = (pageArg = page, searchArg = search) => {
    setLoading(true);
    void getEmployees({ page: pageArg, pageSize, search: searchArg || undefined })
      .then((res) => {
        setEmployees(res.items);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger API search when search text changes (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      load(1, search);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const rowsSource = employees;

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      dept: "",
      role: "",
      designation: "",
      employeeCode: "",
    });
    setMdlOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
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
    if (!isFormValid) return;
    const payload = {
      id: editing?.id,
      name: form.name.trim(),
      email: form.email.trim(),
      dept: form.dept.trim(),
      role: form.role.trim(),
      designation: form.designation.trim() || undefined,
      employeeCode: form.employeeCode.trim() || undefined,
    };
    await saveEmployee(payload);
    setMdlOpen(false);
    load();
  };

  const cols = ["Name", "Email", "Department", "Role", "Status", "Action"];
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
            onChange={async (next) => {
              // Backend exposes /api/employees/{id}/toggle
              await toggleEmployee(e.id);
              load();
            }}
          />
        ),
      },
      {
        v: (
          <Btn sm v="secondary" onClick={() => openEdit(e)}>
            ✎
          </Btn>
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
        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "260px" }}>
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
        </div>

        {loading ? (
          <Empty icon="⏳" title="Loading employees…" sub="Fetching employee directory." />
        ) : rows.length === 0 ? (
          <Empty icon="👥" title="No employees yet" sub="Add your first employee to get started." />
        ) : (
          <>
            <Tbl cols={cols} rows={rows} />
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
                  load(next);
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
                  load(next);
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
          <Btn v="primary" sm onClick={handleSave} disabled={!isFormValid}>
            Save
          </Btn>
        </div>
      </Mdl>
    </div>
  );
}

