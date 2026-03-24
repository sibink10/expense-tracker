import type { CSSProperties, ReactNode } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import { C } from "../shared/theme";
import "./PhoneInputField.css";

export interface PhoneInputFieldProps {
  label?: ReactNode;
  /** E.164 value e.g. +919876543210, or empty */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Initial country selector when value is empty */
  defaultCountry?: Country;
  required?: boolean;
  showReqStar?: boolean;
  error?: string | null;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}

export default function PhoneInputField({
  label,
  value,
  onChange,
  defaultCountry = "IN",
  required,
  showReqStar = true,
  error,
  onBlur,
  disabled,
  placeholder = "Phone number",
  style: sx,
}: PhoneInputFieldProps) {
  return (
    <div
      className={`phone-input-field${error ? " phone-input-field--error" : ""}`}
      style={
        {
          marginBottom: "14px",
          ...sx,
          ["--phone-border" as string]: C.border,
          ["--phone-danger" as string]: C.danger,
        } as CSSProperties
      }
    >
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: C.primary,
            marginBottom: "4px",
          }}
        >
          {label} {required && showReqStar && <span style={{ color: C.accent }}>*</span>}
        </label>
      )}
      {/* Country code is not editable in the text field; country changes only via the flag dropdown. */}
      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value || undefined}
        onChange={(v) => onChange(v ?? undefined)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        limitMaxLength
        addInternationalOption={false}
      />
      {error && (
        <div style={{ fontSize: "11px", color: C.danger, marginTop: "4px" }}>{error}</div>
      )}
    </div>
  );
}

export { isValidPhoneNumber };
