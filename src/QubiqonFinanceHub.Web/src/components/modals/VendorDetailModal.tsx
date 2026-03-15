import { C } from "../../shared/theme";
import { Av, Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { Vendor } from "../../types";

interface Props {
  vendor: Vendor;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px" }}>{value || "—"}</div>
    </div>
  );
}

export default function VendorDetailModal({ vendor: v }: Props) {
  const { setMdl } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={v.name} w>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
        <Av n={v.name} sz={48} v />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{v.name}</div>
          {v.gstin && <div style={{ fontSize: "12px", color: C.muted }}>GSTIN: {v.gstin}</div>}
        </div>
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
        <DetailRow label="Email" value={v.email} />
        <DetailRow label="Phone" value={v.ph} />
        <DetailRow label="Category" value={v.cat} />
        <DetailRow label="Address" value={v.addr} />
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <Btn v="vendor" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "vendor-edit", d: v }), 50); }}>
          Edit
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)}>
          Close
        </Btn>
      </div>
    </Mdl>
  );
}
