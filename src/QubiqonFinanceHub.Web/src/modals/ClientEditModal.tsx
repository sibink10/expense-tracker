import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateClient } from "../shared/api/clients";
import { getTaxConfigs } from "../shared/api/taxConfig";
import { isEmailValid } from "../shared/utils";
import { COUNTRY_OPTS, CURRENCY_OPTS, getCurrencyByCountry, normalizeCountry } from "../shared/countries";
import type { Client, TaxConfig } from "../types";

const CLIENT_TAX_TYPE = "ClientTax";
const isClientTaxType = (type?: string) => (type || "").replace(/\s+/g, "").toLowerCase() === "clienttax";

export default function ClientEditModal() {
  const { mdl, setMdl } = useAppContext();
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

  const c = mdl?.d && mdl.t === "client-edit" ? (mdl.d as Client) : null;

  useEffect(() => {
    if (c) {
      setName(c.name);
      setContactPerson(c.contact || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      setCountry(normalizeCountry(c.country) || "");
      setCurrency(c.currency || "INR");
      setTaxType(c.taxType || "");
      setGstin(c.gstin || "");
      setCustomerType((c.customerType === "Individual" ? "Individual" : "Business") as "Business" | "Individual");
      setShippingAddress(c.shippingAddress ?? c.addr ?? "");
      const bill = c.billingAddress ?? c.addr ?? "";
      setBillingAddress(bill);
      setSameAddress(!!(c.shippingAddress && c.billingAddress && c.shippingAddress === c.billingAddress) || (!c.shippingAddress && !c.billingAddress && !!c.addr));
    }
  }, [c]);

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
      })
      .finally(() => {
        if (!cancelled) setTaxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!c) return null;

  const handleSubmit = async () => {
    setEmailError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!name.trim() || !email.trim() || !contactPerson.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateClient(c.id, {
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
      setMdl(null);
      window.dispatchEvent(new CustomEvent("clients-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Edit ${c.name}`} w>
      <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req showReqStar={false} ph="Client name" />
      <Inp label="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} req showReqStar={false} ph="Contact name" />
      <div>
        <Inp
          label="Email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
          onBlur={() => email.trim() && !isEmailValid(email) && setEmailError("Enter a valid email address")}
          type="email"
          req
          showReqStar={false}
          ph="email@example.com"
          style={{ marginBottom: 0 }}
        />
        {emailError && <div style={{ fontSize: "11px", color: C.danger, marginTop: "4px" }}>{emailError}</div>}
      </div>
      <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" />
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
      />
      <Inp label="Currency" type="select" value={currency} onChange={(e) => setCurrency(e.target.value)} opts={CURRENCY_OPTS} />
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "6px" }}>Customer type</div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
            <input type="radio" name="customerType" checked={customerType === "Business"} onChange={() => setCustomerType("Business")} />
            Business
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
            <input type="radio" name="customerType" checked={customerType === "Individual"} onChange={() => setCustomerType("Individual")} />
            Individual
          </label>
        </div>
      </div>
      <Inp
        label="Tax type"
        type="select"
        value={taxType}
        onChange={(e) => setTaxType(e.target.value)}
        disabled={taxLoading}
        opts={
          clientTaxOptions.length > 0
            ? [
                { v: "", l: "Select tax config" },
                ...clientTaxOptions.map((config) => ({ v: config.name, l: `${config.name} (${config.rate}%)` })),
              ]
            : [{ v: "", l: taxLoading ? "Loading..." : "No client tax configs" }]
        }
      />
      <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" />
      <Inp label="Shipping address" type="textarea" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} ph="Full shipping address" />
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", cursor: "pointer", fontSize: "13px" }}>
        <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
        Both addresses are the same
      </label>
      <Inp
        label="Billing address"
        type="textarea"
        value={sameAddress ? shippingAddress : billingAddress}
        onChange={(e) => setBillingAddress(e.target.value)}
        ph="Full billing address"
        disabled={sameAddress}
      />
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn v="invoice" onClick={handleSubmit} disabled={!name.trim() || !email.trim() || !contactPerson.trim() || !isEmailValid(email) || loading}>
          {loading ? "Saving..." : "Save"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
