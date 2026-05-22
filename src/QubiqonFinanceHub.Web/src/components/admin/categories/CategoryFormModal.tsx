import { Alert, Btn, Inp, Mdl } from "../../ui";

type CategoryFormModalProps = {
  open: boolean;
  name: string;
  error: string | null;
  submitLoading: boolean;
  setName: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CategoryFormModal({
  open,
  name,
  error,
  submitLoading,
  setName,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  return (
    <Mdl open={open} close={() => { if (!submitLoading) onClose(); }} title="Add category">
      <Inp
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        req
        ph="e.g. Software, Utilities..."
      />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "4px" }}>
        <Btn v="secondary" onClick={onClose} disabled={submitLoading}>Close</Btn>
        <Btn v="vendor" onClick={onSubmit} disabled={!name.trim() || submitLoading}>{submitLoading ? "Adding..." : "Add"}</Btn>
      </div>
    </Mdl>
  );
}
