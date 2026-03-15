import { C } from "../../shared/theme";
import { Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Client } from "../../types";

interface Props {
  client: Client;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px" }}>{value || "—"}</div>
    </div>
  );
}

export default function ClientDetailModal({ client: c }: Props) {
  const { setMdl } = useAppContext();

  const detailsGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 20px",
  };

  return (
    <Mdl open close={() => setMdl(null)} title={c.name} w>
      <div style={{ marginBottom: "16px" }}>
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
          ...detailsGrid,
        }}
      >
        <DetailRow label="Contact person" value={c.contact} />
        <DetailRow label="Email" value={c.email} />
        <DetailRow label="Phone" value={c.phone} />
        <DetailRow label="Country" value={c.country} />
        <DetailRow label="Currency" value={c.currency} />
        <DetailRow label="Customer type" value={c.customerType ?? ""} />
        <DetailRow label="Tax type" value={c.taxType} />
        <DetailRow label="GSTIN" value={c.gstin} />
      </div>
      <div
        style={{
          padding: "16px",
          background: C.surface,
          borderRadius: "8px",
          marginBottom: "12px",
          fontSize: "13px",
          ...detailsGrid,
        }}
      >
        <div>
          <div style={{ fontSize: "10px", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Shipping address</div>
          <div style={{ fontSize: "13px" }}>{c.shippingAddress || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Billing address</div>
          <div style={{ fontSize: "13px" }}>{c.billingAddress ?? c.addr ?? "—"}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <Btn v="invoice" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "client-edit", d: c }), 50); }}>
          Edit
        </Btn>
      </div>
    </Mdl>
  );
}
