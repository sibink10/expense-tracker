import { Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getApiErrorMessage } from "../../shared/api/client";
import { deleteVendor } from "../../shared/api/vendor";
import { C } from "../../shared/theme";
import type { Vendor } from "../../types";

type VendorDeleteConfirmModalProps = {
  target: Vendor | null;
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onClose: () => void;
  onRemoved: () => void;
};

export default function VendorDeleteConfirmModal({
  target,
  loading,
  error,
  setLoading,
  setError,
  onClose,
  onRemoved,
}: VendorDeleteConfirmModalProps) {
  const { t } = useAppContext();

  const remove = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      await deleteVendor(target.id);
      t("Vendor removed");
      onClose();
      onRemoved();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to remove vendor");
      setError(msg);
      t(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open={!!target} close={() => { if (!loading) onClose(); }} title="Remove vendor">
      {target && (
        <>
          <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.muted }}>
            Remove <strong>{target.name}</strong> from the directory? They will no longer appear in lists; existing bills linked to this vendor are unchanged.
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
