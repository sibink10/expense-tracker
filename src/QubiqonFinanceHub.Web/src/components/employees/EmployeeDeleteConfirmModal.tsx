import { Btn, Mdl } from "../ui";
import type { Employee } from "../../shared/api/employees";
import { C } from "../../shared/theme";

type EmployeeDeleteConfirmModalProps = {
  target: Employee | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function EmployeeDeleteConfirmModal({ target, onClose, onConfirm }: EmployeeDeleteConfirmModalProps) {
  return (
    <Mdl open={!!target} close={onClose} title="Delete employee">
      {target && (
        <>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.muted }}>
            Are you sure you want to delete <strong>{target.name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Btn v="secondary" sm onClick={onClose}>
              Cancel
            </Btn>
            <Btn v="danger" sm onClick={onConfirm}>
              Delete
            </Btn>
          </div>
        </>
      )}
    </Mdl>
  );
}
