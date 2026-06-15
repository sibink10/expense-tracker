import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlus, HandCoins } from "lucide-react";
import { C, R, listSectionTableBodyMarginTop } from "../../shared/theme";
import { Inp, Btn, Alert, PageShell } from "../ui";
import PhoneInputField, { isValidPhoneNumber } from "../PhoneInputField";
import { countryNameToPhoneCountry } from "../../shared/countryPhoneDefault";
import { isOptionalPhoneValid } from "../../shared/phoneUtils";
import { createClient } from "../../shared/api/clients";
import { getClientFormOptions } from "../../shared/api/clientFormOptions";
import type { GstTreatmentOption, PaymentTermOption } from "../../shared/api/clientFormOptions";
import type { PlaceOfSupplyOption } from "../../shared/gstFinance";
import { isEmailValid } from "../../shared/utils";
import { useAppContext } from "../../context/AppContext";
import { COUNTRY_OPTS, CURRENCY_OPTS, getCurrencyByCountry } from "../../shared/countries";
import ClientGstFinanceSection, { type ClientGstFinanceValues } from "./ClientGstFinanceSection";
import { ROLES } from "../../shared/constants";

const GRID_BREAKPOINT = 600;

export default function AddClientPage() {
  const navigate = useNavigate();
  const { is, t } = useAppContext();

  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [gstFinance, setGstFinance] = useState<ClientGstFinanceValues>({
    isTaxable: true,
    gstTreatmentId: "",
    gstin: "",
    placeOfSupplyCode: "",
    pan: "",
    paymentTermsId: "",
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

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!is(ROLES.ADMIN)) navigate("/clients", { replace: true });
  }, [is, navigate]);

  useEffect(() => {
    if (sameAddress) setBillingAddress(shippingAddress);
  }, [sameAddress, shippingAddress]);

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

  const patchGstFinance = (patch: Partial<ClientGstFinanceValues>) => {
    setGstFinance((current) => ({ ...current, ...patch }));
  };

  const submit = async () => {
    setEmailError(null);
    setPhoneError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (phone?.trim() && !isValidPhoneNumber(phone.trim())) {
      setPhoneError("Enter a valid phone number for the selected country");
      return;
    }
    if (!name.trim() || !email.trim() || !contactPerson.trim() || !shippingAddress.trim() || !(sameAddress ? shippingAddress.trim() : billingAddress.trim())) return;

    setLoading(true);
    setError(null);
    try {
      await createClient({
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
        paymentTermsId: gstFinance.paymentTermsId || null,
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
  const controlStyle = { borderRadius: R.control };
  const canSubmit =
    name.trim() &&
    email.trim() &&
    contactPerson.trim() &&
    shippingAddress.trim() &&
    (sameAddress ? shippingAddress.trim() : billingAddress.trim()) &&
    isEmailValid(email) &&
    isOptionalPhoneValid(phone);

  return (
    <PageShell
      header={
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.text,
            fontFamily: "'Manrope', sans-serif",
            fontSize: narrow ? "18px" : "24px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: "100%",
            margin: 0,
            paddingBottom: "20px",
          }}
        >
          <HandCoins size={narrow ? 18 : 22} color={C.text} strokeWidth={1.8} />
          Add client
        </h1>
      }
    >
      <div
        style={{
          marginTop: listSectionTableBodyMarginTop,
          background: "#fff",
          borderRadius: R.control,
          padding: narrow ? "16px" : "20px",
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
            controlSx={controlStyle}
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
              controlSx={controlStyle}
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
            controlSx={controlStyle}
          />
          <PhoneInputField
            label="Phone"
            value={phone}
            onChange={(v) => {
              setPhone(v);
              setPhoneError(null);
            }}
            defaultCountry={countryNameToPhoneCountry(country)}
            placeholder="Contact number"
            error={phoneError}
            style={cellStyle}
            controlRadius={4}
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
            style={cellStyle}
            controlSx={controlStyle}
          />
          <Inp
            label="Currency"
            type="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            opts={CURRENCY_OPTS}
            style={cellStyle}
            controlSx={controlStyle}
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

          <ClientGstFinanceSection
            values={gstFinance}
            onChange={patchGstFinance}
            gstTreatments={gstTreatments}
            placeOfSupply={placeOfSupply}
            paymentTerms={paymentTerms}
            optionsLoading={optionsLoading}
            onGetTaxpayerDetails={() => t("Coming soon")}
            controlStyle={controlStyle}
            narrow={narrow}
          />

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
              controlSx={controlStyle}
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
              controlSx={controlStyle}
            />
          </div>

          {error && <Alert sx={{ ...fullWidth }}>{error}</Alert>}
          <div style={{ ...fullWidth, display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={submit} disabled={!canSubmit || loading} sx={{ borderRadius: R.control }}>
              <CirclePlus size={15} strokeWidth={1.8} />
              {loading ? "Adding..." : "Add client"}
            </Btn>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
