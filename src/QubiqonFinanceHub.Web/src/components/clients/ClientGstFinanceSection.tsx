import { useEffect, useState } from "react";
import { Receipt, ShieldCheck } from "lucide-react";
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
  /** When omitted, section tracks viewport width internally. */
  narrow?: boolean;
}

export default function ClientGstFinanceSection({
  values,
  onChange,
  gstTreatments,
  placeOfSupply,
  paymentTerms,
  optionsLoading = false,
  onGetTaxpayerDetails,
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

  const showGstin = !!values.gstTreatmentId;
  const fullWidth = { gridColumn: "1 / -1" as const };
  const fieldStyle = { marginBottom: 0 };

  const handleGstinChange = (next: string) => {
    const patch: Partial<ClientGstFinanceValues> = { gstin: next };
    const auto = applyPlaceOfSupplyFromTaxId(next, placeOfSupply);
    if (auto) patch.placeOfSupplyCode = auto;
    onChange(patch);
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: FIELD_GAP,
    alignItems: "start",
  };

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
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: C.primary,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            GST &amp; finance
          </div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
            Tax registration and billing terms
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        <div style={{ ...fullWidth, width: "fit-content", maxWidth: "100%" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "8px" }}>Tax status</div>
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
                onChange={() => onChange({ isTaxable: true })}
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
              Non-taxable
            </label>
          </div>
        </div>

        <Inp
          label="GST treatment"
          type="select"
          value={values.gstTreatmentId}
          onChange={(e) => onChange({ gstTreatmentId: e.target.value })}
          disabled={optionsLoading}
          opts={[
            { v: "", l: optionsLoading ? "Loading..." : "Select GST treatment" },
            ...gstTreatments.map((t) => ({ v: t.id, l: t.name })),
          ]}
          style={{ ...fieldStyle, ...(showGstin && !narrow ? fullWidth : {}) }}
          controlSx={controlStyle}
        />

        {!showGstin && (
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
        )}

        {showGstin && (
          <div style={{ marginBottom: 0, minWidth: 0 }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: C.primary,
                marginBottom: "4px",
              }}
            >
              GSTIN / UIN
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: R.control,
                overflow: "hidden",
                border: `1.5px solid ${C.border}`,
                background: C.white,
                ...controlStyle,
              }}
            >
              <input
                type="text"
                value={values.gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="GSTIN or UIN"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontFamily: "'Inter', 'Manrope', sans-serif",
                  background: "transparent",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                title="Validate GSTIN"
                onClick={onGetTaxpayerDetails}
                disabled={!onGetTaxpayerDetails || !values.gstin.trim()}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: narrow ? "0 12px" : "0 14px",
                  border: "none",
                  borderLeft: `1.5px solid ${C.border}`,
                  background: C.successBg,
                  color: C.accent,
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "'Inter', 'Manrope', sans-serif",
                  cursor: !onGetTaxpayerDetails || !values.gstin.trim() ? "not-allowed" : "pointer",
                  opacity: !onGetTaxpayerDetails || !values.gstin.trim() ? 0.55 : 1,
                  transition: "background 0.15s ease, color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget.disabled) return;
                  e.currentTarget.style.background = C.accent;
                  e.currentTarget.style.color = C.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.successBg;
                  e.currentTarget.style.color = C.accent;
                }}
              >
                <ShieldCheck size={14} strokeWidth={2.25} />
                {!narrow && "Validate"}
              </button>
            </div>
          </div>
        )}

        {showGstin && (
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
        )}

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

        <Inp
          label="PAN"
          value={values.pan}
          onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
          ph="Permanent Account Number"
          style={fieldStyle}
          controlSx={controlStyle}
        />
      </div>
    </div>
  );
}
