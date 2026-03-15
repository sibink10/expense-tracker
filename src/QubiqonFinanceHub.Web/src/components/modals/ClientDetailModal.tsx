import { C } from "../../shared/theme";
import { Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Client } from "../../types";

interface Props {
  client: Client;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px" }}>{value || "—"}</div>
    </div>
  );
}

export default function ClientDetailModal({ client: c }: Props) {
  const { setMdl } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={c.name} w>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{c.name}</div>
        {c.gstin && <div style={{ fontSize: "12px", color: C.muted }}>GSTIN: {c.gstin}</div>}
      </div>
      <div
        style={{
          padding: "16px",
          background: C.surface,
          borderRadius: "8px",
          marginBottom: "12px",
          fontSize: "13px",
        }}
      >
        <DetailRow label="Contact person" value={c.contact} />
        <DetailRow label="Email" value={c.email} />
        <DetailRow label="Phone" value={c.phone} />
        <DetailRow label="Country" value={c.country} />
        <DetailRow label="Currency" value={c.currency} />
        <DetailRow label="Tax type" value={c.taxType} />
        <DetailRow label="Address" value={c.addr} />
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <Btn v="invoice" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "client-edit", d: c }), 50); }}>
          Edit
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)}>
          Close
        </Btn>
      </div>
    </Mdl>
  );
}
