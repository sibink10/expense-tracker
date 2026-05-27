import type React from "react";
import { Btn, Inp, Mdl } from "../ui";
import type { Employee, EmployeeRole } from "../../shared/api/employees";

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
  roles: EmployeeRole[];
  rolesLoading: boolean;
  saving: boolean;
  isFormValid: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function EmployeeFormModal({
  open,
  editing,
  form,
  setForm,
  roles,
  rolesLoading,
  saving,
  isFormValid,
  onClose,
  onSave,
}: EmployeeFormModalProps) {
  return (
    <Mdl open={open} close={onClose} title="Edit employee">
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
        <div>
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
              { v: "", l: rolesLoading ? "Loading roles..." : "Select role..." },
              ...roles.map((role) => ({ v: role.code, l: role.displayName })),
            ]}
            disabled={rolesLoading}
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
