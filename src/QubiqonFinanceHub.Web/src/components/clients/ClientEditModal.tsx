import { useState, useEffect } from "react";
import { C } from "../../shared/theme";
import { Inp, Btn, Mdl, Alert } from "../ui";
import PhoneInputField from "../PhoneInputField";
import { countryNameToPhoneCountry } from "../../shared/countryPhoneDefault";
import { normalizeStoredPhone, isOptionalPhoneValid } from "../../shared/phoneUtils";
import { useAppContext } from "../../context/AppContext";
import { updateClient } from "../../shared/api/clients";
import { getClientFormOptions } from "../../shared/api/clientFormOptions";
import type { GstTreatmentOption, PaymentTermOption } from "../../shared/api/clientFormOptions";
import type { PlaceOfSupplyOption } from "../../shared/gstFinance";
import { isEmailValid } from "../../shared/utils";
import { COUNTRY_OPTS, CURRENCY_OPTS, getCurrencyByCountry, normalizeCountry } from "../../shared/countries";
import type { Client } from "../../types";
import ClientGstFinanceSection, { type ClientGstFinanceValues } from "./ClientGstFinanceSection";
import { EVENTS, MODAL_T } from "../../shared/constants";

export default function ClientEditModal() {
  const { mdl, setMdl, t } = useAppContext();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [gstFinance, setGstFinance] = useState<ClientGstFinanceValues>({
    isTaxable: true,
    gstTreatmentId: "",
    gstin: "",
    placeOfSupplyCode: "",
    pan: "",
    paymentTermsId: "",
    taxExemptionReason: "",
    businessLegalName: "",
    businessTradeName: "",
  });
  const [customerType, setCustomerType] = useState<"Business" | "Individual">("Business");
  const [shippingAddress, setShippingAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameAddress, setSameAddress] = useState(false);
  const [gstTreatments, setGstTreatments] = useState<GstTreatmentOption[]>([]);
  const [placeOfSupply, setPlaceOfSupply] = useState<PlaceOfSupplyOption[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const c = mdl?.d && mdl.t === MODAL_T.CLIENT_EDIT ? (mdl.d as Client) : null;

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    getClientFormOptions()
      .then((opts) => {
        if (cancelled) return;
        setGstTreatments(opts.gstTreatments);
        setPlaceOfSupply(opts.placeOfSupply);
        setPaymentTerms(opts.paymentTerms);
      })
      .catch(() => {
        if (cancelled) return;
        setGstTreatments([]);
        setPlaceOfSupply([]);
        setPaymentTerms([]);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (c) {
      setName(c.name);
      setContactPerson(c.contact || "");
      setEmail(c.email || "");
      setPhone(
        normalizeStoredPhone(c.phone || undefined, countryNameToPhoneCountry(normalizeCountry(c.country) || undefined)) ??
          undefined
      );
      setCountry(normalizeCountry(c.country) || "");
      setCurrency(c.currency || "INR");
      setGstFinance({
        isTaxable: c.isTaxable ?? true,
        gstTreatmentId: c.gstTreatmentId || "",
        gstin: c.gstin || "",
        placeOfSupplyCode: c.placeOfSupplyCode || "",
        pan: c.pan || "",
        paymentTermsId: c.paymentTermsId || "",
        taxExemptionReason: c.taxExemptionReason || "",
        businessLegalName: c.businessLegalName || "",
        businessTradeName: c.businessTradeName || "",
      });
      setCustomerType((c.customerType === "Individual" ? "Individual" : "Business") as "Business" | "Individual");
      setShippingAddress(c.shippingAddress ?? c.addr ?? "");
      const bill = c.billingAddress ?? c.addr ?? "";
      setBillingAddress(bill);
      setSameAddress(!!(c.shippingAddress && c.billingAddress && c.shippingAddress === c.billingAddress) || (!c.shippingAddress && !c.billingAddress && !!c.addr));
      setPhoneError(null);
    }
  }, [c]);

  useEffect(() => {
    if (sameAddress) setBillingAddress(shippingAddress);
  }, [sameAddress, shippingAddress]);

  if (!c) return null;

  const patchGstFinance = (patch: Partial<ClientGstFinanceValues>) => {
    setGstFinance((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async () => {
    setEmailError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!isOptionalPhoneValid(phone)) {
      setPhoneError("Enter a valid phone number for the selected country");
      return;
    }
    if (!name.trim() || !email.trim() || !contactPerson.trim() || !gstFinance.gstTreatmentId) return;

    setLoading(true);
    setError(null);
    try {
      await updateClient(c.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone?.trim() ?? "",
        country: country.trim(),
        currency: currency.trim() || "INR",
        isTaxable: gstFinance.isTaxable,
        gstTreatmentId: gstFinance.gstTreatmentId || null,
        gstin: gstFinance.gstin.trim(),
        placeOfSupplyCode: gstFinance.placeOfSupplyCode || null,
        pan: gstFinance.pan.trim() || null,
        businessLegalName: gstFinance.businessLegalName.trim() || null,
        businessTradeName: gstFinance.businessTradeName.trim() || null,
        paymentTermsId: gstFinance.paymentTermsId || null,
        taxExemptionReason: gstFinance.taxExemptionReason.trim() || null,
        shippingAddress: shippingAddress.trim(),
        billingAddress: sameAddress ? shippingAddress.trim() : billingAddress.trim(),
        customerType,
      });
      setMdl(null);
      window.dispatchEvent(new CustomEvent(EVENTS.CLIENTS_REFRESH));
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
      <PhoneInputField
        label="Phone"
        value={phone}
        onChange={(v) => {
          setPhone(v);
          setPhoneError(null);
        }}
        defaultCountry={countryNameToPhoneCountry(country)}
        error={phoneError}
        placeholder="Contact number"
      />
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

      <ClientGstFinanceSection
        values={gstFinance}
        onChange={patchGstFinance}
        gstTreatments={gstTreatments}
        placeOfSupply={placeOfSupply}
        paymentTerms={paymentTerms}
        optionsLoading={optionsLoading}
        onGetTaxpayerDetails={() => t("Coming soon")}
      />

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
        <Btn
          v="invoice"
          onClick={handleSubmit}
          disabled={
            !name.trim() ||
            !email.trim() ||
            !contactPerson.trim() ||
            !gstFinance.gstTreatmentId ||
            !isEmailValid(email) ||
            !isOptionalPhoneValid(phone) ||
            loading
          }
        >
          {loading ? "Saving..." : "Save"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
