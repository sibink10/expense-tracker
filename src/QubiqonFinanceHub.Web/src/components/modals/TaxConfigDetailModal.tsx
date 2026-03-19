import { C } from "../../shared/theme";
import { Btn, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import type { TaxConfig } from "../../types";

const CLIENT_TAX_TYPE = "ClientTax";
const formatTaxType = (value?: string) => value === CLIENT_TAX_TYPE ? "Client Tax" : (value ?? "—");

interface Props {
  tax: TaxConfig;
}

export default function TaxConfigDetailModal({ tax }: Props) {
  const { setMdl } = useAppContext();

  return (
    <Mdl open close={() => setMdl(null)} title={tax.name} w>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Type</span>
          <span style={{ fontWeight: 600 }}>{formatTaxType(tax.type)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Name</span>
          <span style={{ fontWeight: 600 }}>{tax.name}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Rate</span>
          <span style={{ fontWeight: 600 }}>{tax.rate}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Section</span>
          <span style={{ fontWeight: 600 }}>{tax.section || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Sub type</span>
          <span style={{ fontWeight: 600 }}>{tax.subType ?? "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.surface, borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: C.muted }}>Status</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 600,
              background: tax.isActive ? `${C.success}20` : `${C.muted}20`,
              color: tax.isActive ? C.success : C.muted,
            }}
          >
            {tax.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Btn v="primary" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: "tax-config-edit", d: tax }), 50); }}>
          Edit
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)}>Close</Btn>
      </div>
    </Mdl>
  );
}
