import { useAppContext } from "../../context/AppContext";
import type { Vendor } from "../../types";
import { MODAL_T } from "../../shared/constants";
import { Mdl } from "../ui";
import {
  DetailEntityHero,
  DetailField,
  DetailFieldBlock,
  DetailGrid,
  DetailModalFooter,
  DetailModalSurface,
  DetailPill,
  DetailSection,
} from "../shared/EntityDetailModalParts";

interface Props {
  vendor: Vendor;
}

export default function VendorDetailModal({ vendor: v }: Props) {
  const { setMdl } = useAppContext();
  const hasBank = !!(v.bankName || v.accountNumber || v.ifscCode);

  const openEdit = () => {
    setMdl(null);
    setTimeout(() => setMdl({ t: MODAL_T.VENDOR_EDIT, d: v }), 50);
  };

  const heroSub = [v.gstin, v.email].filter(Boolean).join(" · ") || v.ph || undefined;

  return (
    <Mdl open close={() => setMdl(null)} title={v.name} subtitle="Vendor" w>
      <DetailModalSurface>
      <DetailEntityHero
        name={v.name}
        subtitle={heroSub}
        avatarVariant="vendor"
        pills={v.cat?.trim() ? <DetailPill tone="success">{v.cat}</DetailPill> : undefined}
      />

      <DetailSection title="General information">
        <DetailGrid>
          <DetailField label="GSTIN" value={v.gstin} />
          <DetailField label="Contact person" value={v.contactPerson} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Contact">
        <DetailGrid>
          <DetailField label="Email" value={v.email} />
          <DetailField label="Phone" value={v.ph} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Address">
        <DetailFieldBlock label="Address" value={v.addr} />
      </DetailSection>

      {hasBank && (
        <DetailSection title="Bank details">
          <DetailGrid>
            <DetailField label="Bank name" value={v.bankName} />
            <DetailField label="Account number" value={v.accountNumber} />
            <DetailField label="IFSC code" value={v.ifscCode} />
          </DetailGrid>
        </DetailSection>
      )}

      <DetailModalFooter onEdit={openEdit} onClose={() => setMdl(null)} editVariant="vendor" />
      </DetailModalSurface>
    </Mdl>
  );
}
