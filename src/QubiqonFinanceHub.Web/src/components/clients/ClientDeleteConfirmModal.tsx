import { Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getApiErrorMessage } from "../../shared/api/client";
import { deleteClient } from "../../shared/api/clients";
import { C } from "../../shared/theme";
import type { Client } from "../../types";

type ClientDeleteConfirmModalProps = {
  target: Client | null;
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onClose: () => void;
  onRemoved: () => void;
};

export default function ClientDeleteConfirmModal({
  target,
  loading,
  error,
  setLoading,
  setError,
  onClose,
  onRemoved,
}: ClientDeleteConfirmModalProps) {
  const { t } = useAppContext();

  const remove = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      await deleteClient(target.id);
      t("Client removed");
      onClose();
      onRemoved();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to remove client");
      setError(msg);
      t(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open={!!target} close={() => { if (!loading) onClose(); }} title="Remove client">
      {target && (
        <>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.muted }}>
            Remove <strong>{target.name}</strong> from the directory? They will no longer appear in lists; existing invoices linked to this client are unchanged.
          </p>
          {error && (
            <p role="alert" style={{ margin: "0 0 16px", fontSize: "13px", color: "#b91c1c", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Btn v="secondary" sm disabled={loading} onClick={onClose}>Cancel</Btn>
            <Btn v="danger" sm disabled={loading} onClick={remove}>{loading ? "Removing..." : "Remove"}</Btn>
          </div>
        </>
      )}
    </Mdl>
  );
}
