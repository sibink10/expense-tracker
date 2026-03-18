import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Empty, Toggle, Alert } from "../components/ui";
import { getCategories, createCategory, toggleCategory, type Category } from "../shared/api";
import { useAppContext } from "../context/AppContext";

export default function AdminCategoriesPage() {
  const { t } = useAppContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((items) => setCategories(items))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSubmitLoading(true);
    setError(null);
    try {
      await createCategory({ name: name.trim() });
      setName("");
      setRefreshKey((k) => k + 1);
      setModalOpen(false);
      t("Category added");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleCategory(id);
      setRefreshKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.vendor }}>🏷</span> Categories
        </h1>
        <Btn v="vendor" onClick={() => { setModalOpen(true); setError(null); }}>
          ＋ Add
        </Btn>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : categories.length === 0 ? (
          <Empty icon="🏷" title="No categories" sub="Use the Add button to create a category" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "12px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px" }}>{c.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 600,
                          background: c.isActive ? `${C.success}20` : `${C.muted}20`,
                          color: c.isActive ? C.success : C.muted,
                        }}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle
                        checked={c.isActive}
                        onChange={() => handleToggle(c.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => !submitLoading && setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "420px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(27,42,74,0.18)",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: C.primary }}>
              Add category
            </h2>
            <Inp
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              req
              ph="e.g. Software, Utilities..."
            />
            {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "4px" }}>
              <Btn v="secondary" onClick={() => setModalOpen(false)} disabled={submitLoading}>
                Close
              </Btn>
              <Btn v="vendor" onClick={handleAdd} disabled={!name.trim() || submitLoading}>
                {submitLoading ? "Adding..." : "Add"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

