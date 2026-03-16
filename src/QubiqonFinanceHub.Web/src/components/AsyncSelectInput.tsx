import { useEffect, useState } from "react";
import Select from "react-select";
import { C } from "../shared/theme";

interface Option {
  value: string;
  label: string;
}

interface AsyncSelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  loadOptions: (query: string) => Promise<Option[]>;
  disabled?: boolean;
  placeholder?: string;
}

export function AsyncSelectInput({
  label,
  value,
  onChange,
  loadOptions,
  disabled,
  placeholder,
}: AsyncSelectInputProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  // initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadOptions("")
      .then((opts) => {
        if (!cancelled) setOptions(opts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadOptions]);

  // debounced search (also refreshes list when input is cleared)
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      const q = inputValue.trim();
      setLoading(true);
      loadOptions(q)
        .then((opts) => {
          if (!cancelled) setOptions(opts);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [inputValue, loadOptions]);

  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: C.primary,
          marginBottom: "4px",
        }}
      >
        {label} <span style={{ color: C.accent }}>*</span>
      </label>
      <Select
        value={selected}
        onChange={(opt) => {
          const option = opt as Option | null;
          onChange(option?.value ?? "");
        }}
        onInputChange={(val, action) => {
          if (action.action === "input-change") {
            setInputValue(val);
          }
        }}
        options={options}
        isDisabled={disabled}
        isLoading={loading}
        isSearchable
        placeholder={placeholder}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "32px",
            borderRadius: 8,
            borderColor: C.border,
            boxShadow: "none",
            "&:hover": { borderColor: C.border },
            fontSize: 13,
            fontFamily: "'DM Sans'",
          }),
          valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
          }),
          indicatorsContainer: (base) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            zIndex: 20,
          }),
          option: (base, state) => ({
            ...base,
            fontSize: 12,
            backgroundColor: state.isSelected
              ? C.surface
              : state.isFocused
              ? "#f1f3f5"
              : "#fff",
            color: "#111827",
          }),
        }}
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        menuPosition="absolute"
        menuPlacement="auto"
      />
    </div>
  );
}

