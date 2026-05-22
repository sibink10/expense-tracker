import type React from "react";
import { Btn, Inp, Mdl } from "../ui";
import type { Employee } from "../../shared/api/employees";
import type { GraphUser } from "../../shared/api/graph";

export type EmployeeFormState = {
  entraObjectId: string;
  name: string;
  email: string;
  dept: string;
  role: string;
  designation: string;
  employeeCode: string;
};

type EmployeeFormModalProps = {
  open: boolean;
  editing: Employee | null;
  form: EmployeeFormState;
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>;
  graphUsers: GraphUser[];
  graphUsersLoading: boolean;
  saving: boolean;
  isFormValid: boolean;
  onClose: () => void;
  onSave: () => void;
  onEntraUserChange: (entraObjectId: string) => void;
};

export default function EmployeeFormModal({
  open,
  editing,
  form,
  setForm,
  graphUsers,
  graphUsersLoading,
  saving,
  isFormValid,
  onClose,
  onSave,
  onEntraUserChange,
}: EmployeeFormModalProps) {
  return (
    <Mdl open={open} close={onClose} title={editing ? "Edit employee" : "Add employee"}>
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
              onChange={(e) => onEntraUserChange(e.target.value)}
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
        <Btn v="secondary" sm onClick={onClose}>
          Cancel
        </Btn>
        <Btn v="primary" sm onClick={onSave} disabled={!isFormValid || saving}>
          {saving ? "Saving..." : "Save"}
        </Btn>
      </div>
    </Mdl>
  );
}
