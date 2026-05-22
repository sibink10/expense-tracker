import { Alert, Btn, Inp, Mdl } from "../../ui";

type PaymentTermFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  name: string;
  shortName: string;
  days: string;
  error: string | null;
  submitLoading: boolean;
  submitDisabled: boolean;
  setName: (name: string) => void;
  setShortName: (shortName: string) => void;
  setDays: (days: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function PaymentTermFormModal({
  open,
  mode,
  name,
  shortName,
  days,
  error,
  submitLoading,
  submitDisabled,
  setName,
  setShortName,
  setDays,
  onClose,
  onSubmit,
}: PaymentTermFormModalProps) {
  return (
    <Mdl open={open} close={() => { if (!submitLoading) onClose(); }} title={mode === "add" ? "Add payment term" : "Edit payment term"}>
      <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="e.g. Net 30" />
      <Inp label="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} req ph="e.g. net30" />
      <Inp label="Days" type="number" value={days} onChange={(e) => setDays(e.target.value)} req min="0" />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
        <Btn v="secondary" onClick={onClose} disabled={submitLoading}>Close</Btn>
        <Btn v="vendor" onClick={onSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
      </div>
    </Mdl>
  );
}
