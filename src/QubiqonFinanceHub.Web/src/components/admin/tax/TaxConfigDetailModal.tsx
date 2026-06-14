import { Mdl } from "../../ui";
import { useAppContext } from "../../../context/AppContext";
import type { TaxConfig } from "../../../types";
import { MODAL_T } from "../../../shared/constants";
import {
  DetailField,
  DetailGrid,
  DetailModalSurface,
  DetailPill,
  DetailSection,
  DetailStatusRow,
} from "../../shared/EntityDetailModalParts";

const CLIENT_TAX_TYPE = "ClientTax";
const formatTaxType = (value?: string) =>
  value === CLIENT_TAX_TYPE ? "Client Tax" : value ?? "—";

interface Props {
  tax: TaxConfig;
}

export default function TaxConfigDetailModal({ tax }: Props) {
  const { setMdl } = useAppContext();

  const openEdit = () => {
    setMdl(null);
    setTimeout(() => setMdl({ t: MODAL_T.TAX_CONFIG_EDIT, d: tax }), 50);
  };

  return (
    <Mdl open close={() => setMdl(null)} title={tax.name} subtitle="Tax configuration" w onEdit={openEdit}>
      <DetailModalSurface>
      <DetailSection title="General information">
        <DetailGrid>
          <DetailField label="Type" value={formatTaxType(tax.type)} />
          <DetailField label="Name" value={tax.name} />
          <DetailField label="Rate" value={`${tax.rate}%`} />
          <DetailField label="Section" value={tax.section} />
          <DetailField label="Sub type" value={tax.subType} />
        </DetailGrid>
        <DetailStatusRow label="Status">
          <DetailPill tone={tax.isActive ? "success" : "neutral"}>
            {tax.isActive ? "Active" : "Inactive"}
          </DetailPill>
        </DetailStatusRow>
      </DetailSection>

      </DetailModalSurface>
    </Mdl>
  );
}
