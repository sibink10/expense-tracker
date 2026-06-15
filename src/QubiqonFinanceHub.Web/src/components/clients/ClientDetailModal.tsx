import { useAppContext } from "../../context/AppContext";
import type { Client } from "../../types";
import { MODAL_T } from "../../shared/constants";
import { Mdl } from "../ui";
import {
  DetailAddressGrid,
  DetailEntityHero,
  DetailField,
  DetailGrid,
  DetailModalSurface,
  DetailPill,
  DetailSection,
} from "../shared/EntityDetailModalParts";

interface Props {
  client: Client;
}

export default function ClientDetailModal({ client: c }: Props) {
  const { setMdl } = useAppContext();

  const openEdit = () => {
    setMdl(null);
    setTimeout(() => setMdl({ t: MODAL_T.CLIENT_EDIT, d: c }), 50);
  };

  const heroSub = [c.gstin, c.email].filter(Boolean).join(" · ") || c.contact || undefined;
  const taxPreference = c.isTaxable === false ? "Tax exempt" : "Taxable";
  const placeOfSupplyDisplay = c.placeOfSupplyName
    ? (c.placeOfSupplyCode ? `${c.placeOfSupplyCode} — ${c.placeOfSupplyName}` : c.placeOfSupplyName)
    : c.placeOfSupplyCode;

  return (
    <Mdl open close={() => setMdl(null)} title={c.name} subtitle="Client" w onEdit={openEdit}>
      <DetailModalSurface>
      <DetailEntityHero
        name={c.name}
        subtitle={heroSub}
        avatarVariant="client"
        pills={
          <>
            {c.customerType?.trim() && <DetailPill tone="neutral">{c.customerType}</DetailPill>}
            {c.currency?.trim() && <DetailPill tone="success">{c.currency}</DetailPill>}
          </>
        }
      />

      <DetailSection title="GST & finance">
        <DetailGrid>
          <DetailField label="Tax preference" value={taxPreference} />
          {c.isTaxable === false && <DetailField label="Exemption reason" value={c.taxExemptionReason} />}
          <DetailField label="GST treatment" value={c.gstTreatmentName} />
          <DetailField label="GSTIN / UIN" value={c.gstin} />
          <DetailField label="Place of supply" value={placeOfSupplyDisplay} />
          <DetailField label="PAN" value={c.pan} />
          <DetailField label="Payment terms" value={c.paymentTermsName} />
          <DetailField label="Country" value={c.country} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Contact">
        <DetailGrid>
          <DetailField label="Contact person" value={c.contact} />
          <DetailField label="Email" value={c.email} />
          <DetailField label="Phone" value={c.phone} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Addresses">
        <DetailAddressGrid
          shipping={c.shippingAddress}
          billing={c.billingAddress ?? c.addr}
        />
      </DetailSection>

      </DetailModalSurface>
    </Mdl>
  );
}
