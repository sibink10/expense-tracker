import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { C, R } from "../../shared/theme";
import { Inp } from "../ui";
import type { GstTreatmentOption, PaymentTermOption } from "../../shared/api/clientFormOptions";
import type { PlaceOfSupplyOption } from "../../shared/gstFinance";
import { applyPlaceOfSupplyFromTaxId } from "../../shared/gstFinance";

const GRID_BREAKPOINT = 600;
const FIELD_GAP = "16px";
const SECTION_BG = "#F4F7FC";
const SECTION_BORDER = "#D8E2F0";
const SECTION_ACCENT = "#4F6B9A";
const SECTION_ICON_BG = "#E8EEF8";

export interface ClientGstFinanceValues {
  isTaxable: boolean;
  gstTreatmentId: string;
  gstin: string;
  placeOfSupplyCode: string;
  pan: string;
  paymentTermsId: string;
  taxExemptionReason: string;
  businessLegalName: string;
  businessTradeName: string;
}

interface Props {
  values: ClientGstFinanceValues;
  onChange: (patch: Partial<ClientGstFinanceValues>) => void;
  gstTreatments: GstTreatmentOption[];
  placeOfSupply: PlaceOfSupplyOption[];
  paymentTerms: PaymentTermOption[];
  optionsLoading?: boolean;
  onGetTaxpayerDetails?: () => void;
  controlStyle?: React.CSSProperties;
  narrow?: boolean;
}

function buildTreatmentPatch(
  treatmentId: string,
  treatments: GstTreatmentOption[]
): Partial<ClientGstFinanceValues> {
  const treatment = treatments.find((t) => t.id === treatmentId);
  const patch: Partial<ClientGstFinanceValues> = { gstTreatmentId: treatmentId };
  if (!treatment) return patch;
  if (!treatment.showGstin) patch.gstin = "";
  if (!treatment.showPlaceOfSupply) patch.placeOfSupplyCode = "";
  if (!treatment.showBusinessLegalName) patch.businessLegalName = "";
  if (!treatment.showBusinessTradeName) patch.businessTradeName = "";
  if (!treatment.showTaxPreference) {
    patch.isTaxable = true;
    patch.taxExemptionReason = "";
  }
  return patch;
}

export default function ClientGstFinanceSection({
  values,
  onChange,
  gstTreatments,
  placeOfSupply,
  paymentTerms,
  optionsLoading = false,
  controlStyle = { borderRadius: R.control },
  narrow: narrowProp,
}: Props) {
  const [narrowViewport, setNarrowViewport] = useState(
    typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT
  );
  const narrow = narrowProp ?? narrowViewport;

  useEffect(() => {
    if (narrowProp !== undefined) return;
    const onResize = () => setNarrowViewport(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [narrowProp]);

  const selectedTreatment = gstTreatments.find((t) => t.id === values.gstTreatmentId);
  const showGstinField = !!selectedTreatment?.showGstin;
  const showPlaceOfSupplyField = !!selectedTreatment?.showPlaceOfSupply;
  const showTaxPreferenceField = !!selectedTreatment?.showTaxPreference;
  const showBusinessLegalNameField = !!selectedTreatment?.showBusinessLegalName;
  const showBusinessTradeNameField = !!selectedTreatment?.showBusinessTradeName;
  const panRequired = !!selectedTreatment?.showPan;

  const fullWidth = { gridColumn: "1 / -1" as const };
  const fieldStyle = { marginBottom: 0 };
  const pairRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: FIELD_GAP,
    gridColumn: "1 / -1",
    alignItems: "start",
  };

  const handleGstinChange = (next: string) => {
    const patch: Partial<ClientGstFinanceValues> = { gstin: next };
    const auto = applyPlaceOfSupplyFromTaxId(next, placeOfSupply);
    if (auto) patch.placeOfSupplyCode = auto;
    onChange(patch);
  };

  const handleTreatmentChange = (treatmentId: string) => {
    onChange(buildTreatmentPatch(treatmentId, gstTreatments));
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: FIELD_GAP,
    alignItems: "start",
  };

  const gstTreatmentField = (
    <Inp
      label="GST treatment"
      type="select"
      value={values.gstTreatmentId}
      onChange={(e) => handleTreatmentChange(e.target.value)}
      disabled={optionsLoading}
      opts={[
        { v: "", l: optionsLoading ? "Loading..." : "Select GST treatment" },
        ...gstTreatments.map((t) => ({ v: t.id, l: t.name })),
      ]}
      style={fieldStyle}
      controlSx={controlStyle}
    />
  );

  const gstinField = showGstinField ? (
    <Inp
      label="GSTIN / UIN"
      value={values.gstin}
      onChange={(e) => handleGstinChange(e.target.value)}
      ph="GSTIN or UIN"
      req
      style={fieldStyle}
      controlSx={controlStyle}
    />
  ) : null;

  const businessLegalNameField = showBusinessLegalNameField ? (
    <Inp
      label="Business legal name"
      value={values.businessLegalName}
      onChange={(e) => onChange({ businessLegalName: e.target.value })}
      ph="Registered legal name"
      req
      style={fieldStyle}
      controlSx={controlStyle}
    />
  ) : null;

  const businessTradeNameField = showBusinessTradeNameField ? (
    <Inp
      label="Business trade name"
      value={values.businessTradeName}
      onChange={(e) => onChange({ businessTradeName: e.target.value })}
      ph="Trading / brand name"
      req
      style={fieldStyle}
      controlSx={controlStyle}
    />
  ) : null;

  const businessNamesRow =
    showBusinessLegalNameField || showBusinessTradeNameField ? (
      <div style={pairRowStyle}>
        {showBusinessLegalNameField ? businessLegalNameField : <div />}
        {showBusinessTradeNameField ? businessTradeNameField : showBusinessLegalNameField ? <div /> : null}
      </div>
    ) : null;

  const paymentTermsField = (
    <Inp
      label="Payment terms"
      type="select"
      value={values.paymentTermsId}
      onChange={(e) => onChange({ paymentTermsId: e.target.value })}
      disabled={optionsLoading}
      opts={[
        { v: "", l: optionsLoading ? "Loading..." : "Select payment terms" },
        ...paymentTerms.map((p) => ({ v: p.id, l: `${p.name} (${p.days} days)` })),
      ]}
      style={fieldStyle}
      controlSx={controlStyle}
    />
  );

  const placeOfSupplyField = showPlaceOfSupplyField ? (
    <Inp
      label="Place of supply"
      type="select"
      value={values.placeOfSupplyCode}
      onChange={(e) => onChange({ placeOfSupplyCode: e.target.value })}
      disabled={optionsLoading}
      opts={[
        { v: "", l: optionsLoading ? "Loading..." : "Select place of supply" },
        ...placeOfSupply.map((p) => ({ v: p.code, l: `${p.code} — ${p.name}` })),
      ]}
      style={fieldStyle}
      controlSx={controlStyle}
    />
  ) : null;

  const panField = (
    <Inp
      label="PAN"
      value={values.pan}
      onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
      ph="Permanent Account Number"
      req={panRequired}
      style={fieldStyle}
      controlSx={controlStyle}
    />
  );

  const taxPreferenceBlock = showTaxPreferenceField ? (
    <div style={{ ...fullWidth, minWidth: 0 }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "8px" }}>Tax preference</div>
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          width: "fit-content",
          maxWidth: "100%",
          padding: "10px 14px",
          background: C.white,
          borderRadius: R.control,
          border: `1px solid ${C.subtleBorder}`,
          boxSizing: "border-box",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.text }}>
          <input
            type="radio"
            name="isTaxable"
            checked={values.isTaxable}
            onChange={() => onChange({ isTaxable: true, taxExemptionReason: "" })}
          />
          Taxable
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.text }}>
          <input
            type="radio"
            name="isTaxable"
            checked={!values.isTaxable}
            onChange={() => onChange({ isTaxable: false })}
          />
          Tax exempt
        </label>
      </div>
      {!values.isTaxable && (
        <div style={{ marginTop: "10px" }}>
          <Inp
            label="Exemption reason"
            type="textarea"
            value={values.taxExemptionReason}
            onChange={(e) => onChange({ taxExemptionReason: e.target.value })}
            ph="Reason for tax exemption"
            req
            style={fieldStyle}
            controlSx={controlStyle}
          />
        </div>
      )}
    </div>
  ) : null;

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        marginTop: "4px",
        marginBottom: "4px",
        background: SECTION_BG,
        border: `1px solid ${SECTION_BORDER}`,
        borderRadius: R.control,
        padding: narrow ? "16px" : "18px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          paddingBottom: "12px",
          borderBottom: `1px solid ${SECTION_BORDER}`,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: SECTION_ICON_BG,
            color: SECTION_ACCENT,
            flexShrink: 0,
          }}
        >
          <Receipt size={15} strokeWidth={2} />
        </span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: C.primary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            GST &amp; finance
          </div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
            Tax registration and billing terms
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        {narrow ? (
          <>
            {gstTreatmentField}
            {gstinField}
            {businessLegalNameField}
            {businessTradeNameField}
            {paymentTermsField}
            {placeOfSupplyField}
            {taxPreferenceBlock}
            {panField}
          </>
        ) : (
          <>
            {showGstinField ? (
              <>
                <div style={pairRowStyle}>
                  {gstTreatmentField}
                  {gstinField}
                </div>
                {businessNamesRow}
                <div style={pairRowStyle}>
                  {paymentTermsField}
                  {placeOfSupplyField}
                </div>
              </>
            ) : (
              <>
                <div style={pairRowStyle}>
                  {gstTreatmentField}
                  {paymentTermsField}
                </div>
                {businessNamesRow}
              </>
            )}

            {taxPreferenceBlock}
            {panField}
          </>
        )}
      </div>
    </div>
  );
}
