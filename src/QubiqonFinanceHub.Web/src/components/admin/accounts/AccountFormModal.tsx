import { Alert, Btn, Inp, Mdl } from "../../ui";

type AccountFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  name: string;
  shortName: string;
  error: string | null;
  submitLoading: boolean;
  submitDisabled: boolean;
  setName: (name: string) => void;
  setShortName: (shortName: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AccountFormModal({
  open,
  mode,
  name,
  shortName,
  error,
  submitLoading,
  submitDisabled,
  setName,
  setShortName,
  onClose,
  onSubmit,
}: AccountFormModalProps) {
  return (
    <Mdl open={open} close={() => { if (!submitLoading) onClose(); }} title={mode === "add" ? "Add account" : "Edit account"}>
      <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="e.g. Office Supplies" />
      <Inp label="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} req ph="e.g. office_supplies" />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
        <Btn v="secondary" onClick={onClose} disabled={submitLoading}>Close</Btn>
        <Btn v="vendor" onClick={onSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
      </div>
    </Mdl>
  );
}
