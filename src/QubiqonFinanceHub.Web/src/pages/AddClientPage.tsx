import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Alert } from "../components/ui";
import { createClient } from "../shared/api/clients";
import { getTaxConfigs } from "../shared/api/taxConfig";
import { isEmailValid } from "../shared/utils";
import { useAppContext } from "../context/AppContext";
import { COUNTRY_OPTS, CURRENCY_OPTS, getCurrencyByCountry } from "../shared/countries";
import type { TaxConfig } from "../types";

const GRID_BREAKPOINT = 600;
const CLIENT_TAX_TYPE = "ClientTax";
const isClientTaxType = (type?: string) => (type || "").replace(/\s+/g, "").toLowerCase() === "clienttax";

export default function AddClientPage() {
  const navigate = useNavigate();
  const { is, t } = useAppContext();

  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxType, setTaxType] = useState("");
  const [gstin, setGstin] = useState("");
  const [customerType, setCustomerType] = useState<"Business" | "Individual">("Business");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [clientTaxOptions, setClientTaxOptions] = useState<TaxConfig[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!is("admin")) navigate("/clients", { replace: true });
  }, [is, navigate]);

  useEffect(() => {
    if (sameAddress) setBillingAddress(shippingAddress);
  }, [sameAddress, shippingAddress]);

  useEffect(() => {
    let cancelled = false;
    setTaxLoading(true);
    getTaxConfigs()
      .then((configs) => {
        if (cancelled) return;
        const clientTaxes = configs.filter((config) => config.isActive && isClientTaxType(config.type));
        setClientTaxOptions(clientTaxes);
        setTaxType((current) =>
          current && clientTaxes.some((config) => config.name === current)
            ? current
            : ""
        );
      })
      .catch(() => {
        if (cancelled) return;
        setClientTaxOptions([]);
        setTaxType("");
      })
      .finally(() => {
        if (!cancelled) setTaxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    setEmailError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!name.trim() || !email.trim() || !contactPerson.trim() || !taxType.trim() || !shippingAddress.trim() || !(sameAddress ? shippingAddress.trim() : billingAddress.trim())) return;

    setLoading(true);
    setError(null);
    try {
      await createClient({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        currency: currency.trim() || "INR",
        taxType: taxType.trim() || null,
        gstin: gstin.trim(),
        shippingAddress: shippingAddress.trim(),
        billingAddress: sameAddress ? shippingAddress.trim() : billingAddress.trim(),
        customerType,
      });
      t("Client added");
      navigate("/clients");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };
  const fullWidth = { gridColumn: "1 / -1" as const };
  const cellStyle = { marginBottom: 0 };
  const canSubmit =
    name.trim() &&
    email.trim() &&
    contactPerson.trim() &&
    taxType.trim() &&
    shippingAddress.trim() &&
    (sameAddress ? shippingAddress.trim() : billingAddress.trim()) &&
    isEmailValid(email);

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px", color: C.invoice }}>
        Add client
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={gridStyle}>
          <Inp
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            req
            ph="Client name"
            style={cellStyle}
          />
          <div style={cellStyle}>
            <Inp
              label="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              onBlur={() => email.trim() && !isEmailValid(email) && setEmailError("Enter a valid email address")}
              type="email"
              req
              ph="email@example.com"
              style={{ marginBottom: 0 }}
            />
            {emailError && <div style={{ fontSize: "11px", color: C.danger, marginTop: "4px" }}>{emailError}</div>}
          </div>
          <Inp
            label="Contact person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            req
            ph="Contact name"
            style={cellStyle}
          />
          <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" style={cellStyle} />
          <Inp
            label="Country"
            type="select"
            value={country}
            onChange={(e) => {
              const v = e.target.value;
              setCountry(v);
              setCurrency(getCurrencyByCountry(v));
            }}
            opts={[{ v: "", l: "Select country" }, ...COUNTRY_OPTS]}
            style={cellStyle}
          />
          <Inp
            label="Currency"
            type="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            opts={CURRENCY_OPTS}
            style={cellStyle}
          />
          <div style={{ ...cellStyle, ...fullWidth }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "6px" }}>Customer type</div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="customerType"
                  checked={customerType === "Business"}
                  onChange={() => setCustomerType("Business")}
                />
                Business
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="customerType"
                  checked={customerType === "Individual"}
                  onChange={() => setCustomerType("Individual")}
                />
                Individual
              </label>
            </div>
          </div>
          <Inp
            label="Tax type"
            type="select"
            value={taxType}
            onChange={(e) => setTaxType(e.target.value)}
            req
            disabled={taxLoading}
            opts={
              clientTaxOptions.length > 0
                ? [
                    { v: "", l: "Select tax config" },
                    ...clientTaxOptions.map((config) => ({ v: config.name, l: `${config.name} (${config.rate}%)` })),
                  ]
                : [{ v: "", l: taxLoading ? "Loading..." : "No client tax configs" }]
            }
            style={cellStyle}
          />
          <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" style={cellStyle} />

          <div style={{ ...fullWidth, marginTop: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
              Address
            </div>
            <Inp
              label="Shipping address"
              type="textarea"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              req
              ph="Full shipping address"
              style={{ ...cellStyle, ...fullWidth }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", cursor: "pointer", fontSize: "13px" }}>
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={(e) => setSameAddress(e.target.checked)}
              />
              Both addresses are the same
            </label>
            <Inp
              label="Billing address"
              type="textarea"
              value={sameAddress ? shippingAddress : billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              req
              ph="Full billing address"
              disabled={sameAddress}
              style={{ ...cellStyle, ...fullWidth }}
            />
          </div>

          {error && <Alert sx={{ ...fullWidth }}>{error}</Alert>}
          <div style={{ ...fullWidth, display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={submit} disabled={!canSubmit || loading}>
              {loading ? "Adding..." : "Add client"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
