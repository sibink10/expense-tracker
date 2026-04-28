import { useEffect, useMemo, useState } from "react";
import { Alert, Btn, Empty, Inp, ListRefreshButton, Toggle } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { type Account, createAccount, getAccounts, updateAccount } from "../shared/api";
import { C } from "../shared/theme";

type Mode = "add" | "edit";

export default function AdminAccountsPage() {
  const { t } = useAppContext();
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");

  useEffect(() => {
    setLoading(true);
    getAccounts()
      .then((res) => setItems(res))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const submitDisabled = useMemo(() => !name.trim() || !shortName.trim() || submitLoading, [name, shortName, submitLoading]);

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setName("");
    setShortName("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Account) => {
    setMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setShortName(item.shortName);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = { name: name.trim(), shortName: shortName.trim().toLowerCase() };
      if (mode === "add") {
        await createAccount(payload);
        t("Account added");
      } else if (editingId) {
        const original = items.find((x) => x.id === editingId);
        await updateAccount(editingId, { ...payload, isActive: original?.isActive ?? true });
        t("Account updated");
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (item: Account, next: boolean) => {
    try {
      await updateAccount(item.id, { name: item.name, shortName: item.shortName, isActive: next });
      setRefreshKey((k) => k + 1);
    } catch {
      t("Failed to update status", "error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.vendor }}>💼</span> Accounts
        </h1>
        <Btn v="vendor" onClick={openAdd}>＋ Add</Btn>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <ListRefreshButton loading={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : items.length === 0 ? (
          <Empty icon="💼" title="No accounts" sub="Create one using Add button" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "12px" }}>
              <thead>
                <tr>
                  {["Name", "Short name", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "10px 12px" }}>{item.name}</td>
                    <td style={{ padding: "10px 12px" }}>{item.shortName}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle checked={item.isActive} onChange={(next) => handleToggle(item, next)} />
                    </td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                      <Btn sm v="secondary" onClick={() => openEdit(item)}>Edit</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "12px", padding: "20px" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 12px", color: C.primary }}>{mode === "add" ? "Add account" : "Edit account"}</h2>
            <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="e.g. Office Supplies" />
            <Inp label="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} req ph="e.g. office_supplies" />
            {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
              <Btn v="secondary" onClick={() => setModalOpen(false)} disabled={submitLoading}>Close</Btn>
              <Btn v="vendor" onClick={handleSubmit} disabled={submitDisabled}>{submitLoading ? "Saving..." : "Save"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
