import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Btn, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getClients } from "../shared/api/clients";
import type { Client } from "../types";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { is, setMdl } = useAppContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("clients-refresh", handler);
    return () => window.removeEventListener("clients-refresh", handler);
  }, []);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
          <span style={{ color: C.invoice }}>👥</span> Clients
        </h1>
        {is("admin") && (
          <Btn v="invoice" onClick={() => navigate("/clients/add")}>
            ＋ Add
          </Btn>
        )}
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
        ) : clients.length === 0 ? (
          <Empty icon="👥" title="No clients" sub="Add clients to create invoices" />
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setMdl({ t: "client-detail", d: c })}
              onKeyDown={(e) => e.key === "Enter" && setMdl({ t: "client-detail", d: c })}
              style={{
                padding: "12px",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: "11px", color: C.muted }}>{c.contact || "—"} · {c.email || "—"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
