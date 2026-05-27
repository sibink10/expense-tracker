import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C } from "../../../shared/theme";
import { Inp, Btn, FileUp, Toggle } from "../../ui";
import PhoneInputField, { isValidPhoneNumber } from "../../PhoneInputField";
import { getOrganization, saveOrganization } from "../../../shared/api";
import { countryNameToPhoneCountry } from "../../../shared/countryPhoneDefault";
import { normalizeStoredPhone } from "../../../shared/phoneUtils";
import { COUNTRY_OPTS, normalizeCountry } from "../../../shared/countries";

const GRID_BREAKPOINT = 720;
const DEFAULT_ZOHO_SCOPE =
  "ZohoSign.templates.CREATE,ZohoSign.templates.READ,ZohoSign.templates.UPDATE,ZohoSign.documents.CREATE,ZohoSign.documents.READ,ZohoSign.documents.UPDATE";
const DEFAULT_ZOHO_AUTHORIZATION_ENDPOINT = "https://accounts.zoho.in/oauth/v2/auth";
const DEFAULT_ZOHO_TOKEN_ENDPOINT = "https://accounts.zoho.in/oauth/v2/token";
const DEFAULT_ZOHO_SIGN_API_BASE_URL = "https://sign.zoho.in";

export default function AdminOrgPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [orgName, setOrgName] = useState("");
  const [orgSubName, setOrgSubName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [fax, setFax] = useState("");
  const [website, setWebsite] = useState("");
  const [zohoSignEmail, setZohoSignEmail] = useState("");
  const [zohoClientId, setZohoClientId] = useState("");
  const [zohoClientSecret, setZohoClientSecret] = useState("");
  const [zohoCode, setZohoCode] = useState("");
  const [zohoScope, setZohoScope] = useState(DEFAULT_ZOHO_SCOPE);
  const [zohoDataCenter, setZohoDataCenter] = useState("IN");
  const [zohoAuthorizationEndpoint, setZohoAuthorizationEndpoint] = useState(DEFAULT_ZOHO_AUTHORIZATION_ENDPOINT);
  const [zohoTokenEndpoint, setZohoTokenEndpoint] = useState(DEFAULT_ZOHO_TOKEN_ENDPOINT);
  const [zohoSignApiBaseUrl, setZohoSignApiBaseUrl] = useState(DEFAULT_ZOHO_SIGN_API_BASE_URL);
  const [zohoRedirectUri, setZohoRedirectUri] = useState("");
  const [zohoHomePage, setZohoHomePage] = useState("");
  const [zohoRefreshToken, setZohoRefreshToken] = useState("");
  const [useSeparatePaymentAddress, setUseSeparatePaymentAddress] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberRe, setAccountNumberRe] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [bankError, setBankError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ n: string; s: string } | null>(null);
  const [logoRawFile, setLogoRawFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [saving, setSaving] = useState(false);

  const narrow = typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT;

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1.2fr 1fr",
    gap: "16px",
  };

  const authorizationUrl =
    zohoClientId.trim() && zohoRedirectUri.trim() && zohoAuthorizationEndpoint.trim()
      ? `${zohoAuthorizationEndpoint.trim()}?${new URLSearchParams({
          response_type: "code",
          client_id: zohoClientId.trim(),
          scope: zohoScope.trim() || DEFAULT_ZOHO_SCOPE,
          redirect_uri: zohoRedirectUri.trim(),
          access_type: "offline",
          prompt: "consent",
        }).toString()}`
      : "";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void getOrganization(id)
      .then((org) => {
        if (cancelled) return;
        setOrgName(org.orgName ?? "");
        setOrgSubName(org.subName ?? "");
        setIndustry(org.industry ?? "");
        setCountry(normalizeCountry(org.country) ?? "");
        setAddress(org.address ?? "");
        setCity(org.city ?? "");
        setPostalCode(org.postalCode ?? "");
        setState(org.state ?? "");
        setPhone(normalizeStoredPhone(org.phone ?? undefined) ?? undefined);
        setFax(org.fax ?? "");
        setWebsite(org.website ?? "");
        setZohoSignEmail(org.zohoSignEmail ?? "");
        setZohoClientId(org.zohoClientId ?? "");
        setZohoClientSecret(org.zohoClientSecret ?? "");
        setZohoCode(org.zohoCode ?? "");
        setZohoScope(org.zohoScope ?? DEFAULT_ZOHO_SCOPE);
        setZohoDataCenter(org.zohoDataCenter ?? "IN");
        setZohoAuthorizationEndpoint(org.zohoAuthorizationEndpoint ?? DEFAULT_ZOHO_AUTHORIZATION_ENDPOINT);
        setZohoTokenEndpoint(org.zohoTokenEndpoint ?? DEFAULT_ZOHO_TOKEN_ENDPOINT);
        setZohoSignApiBaseUrl(org.zohoSignApiBaseUrl ?? DEFAULT_ZOHO_SIGN_API_BASE_URL);
        setZohoRedirectUri(org.zohoRedirectUri ?? "");
        setZohoHomePage(org.zohoHomePage ?? "");
        setZohoRefreshToken(org.zohoRefreshToken ?? "");
        setUseSeparatePaymentAddress(org.useSeparatePaymentAddress ?? false);
        setPaymentAddress(org.paymentAddress ?? "");
        setAccountHolderName(org.accountHolderName ?? "");
        setBankName(org.bankName ?? "");
        setIfscCode(org.ifscCode ?? "");
        setSwiftCode(org.swiftCode ?? "");
        const acct = org.accountNumber ?? "";
        setAccountNumber(acct);
        setAccountNumberRe(acct);
        setBankAddress(org.bankAddress ?? "");
        setBankError(null);
        setLogoPreviewUrl(org.logoUrl ?? null);
        setLogoRawFile(null);
        setLogoFile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (saving) return;

    const p = phone?.trim();
    if (p && !isValidPhoneNumber(p)) {
      setPhoneError("Enter a valid phone number for the selected country");
      return;
    }
    setPhoneError(null);

    if (!accountHolderName.trim() || !bankName.trim() || !ifscCode.trim() || !swiftCode.trim() || !accountNumber.trim() || !accountNumberRe.trim() || !bankAddress.trim()) {
      setBankError("All bank detail fields are required.");
      return;
    }
    if (accountNumber.trim() !== accountNumberRe.trim()) {
      setBankError("Account numbers do not match.");
      return;
    }
    setBankError(null);

    setSaving(true);
    try {
      await saveOrganization({
        id,
        orgName: orgName.trim(),
        subName: orgSubName.trim() || undefined,
        industry: industry || undefined,
        country: country || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        state: state || undefined,
        phone: phone?.trim() || undefined,
        fax: fax || undefined,
        website: website || undefined,
        zohoSignEmail: zohoSignEmail.trim() || undefined,
        zohoClientId: zohoClientId.trim() || undefined,
        zohoClientSecret: zohoClientSecret.trim() || undefined,
        zohoCode: zohoCode.trim() || undefined,
        zohoScope: zohoScope.trim() || undefined,
        zohoDataCenter: zohoDataCenter.trim() || undefined,
        zohoAuthorizationEndpoint: zohoAuthorizationEndpoint.trim() || undefined,
        zohoTokenEndpoint: zohoTokenEndpoint.trim() || undefined,
        zohoSignApiBaseUrl: zohoSignApiBaseUrl.trim() || undefined,
        zohoRedirectUri: zohoRedirectUri.trim() || undefined,
        zohoHomePage: zohoHomePage.trim() || undefined,
        zohoRefreshToken: zohoRefreshToken.trim() || undefined,
        useSeparatePaymentAddress: useSeparatePaymentAddress,
        paymentAddress: useSeparatePaymentAddress ? paymentAddress || undefined : undefined,
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        ifscCode: ifscCode.trim(),
        swiftCode: swiftCode.trim(),
        accountNumber: accountNumber.trim(),
        bankAddress: bankAddress.trim(),
        logoFile: logoRawFile || undefined,
      });
      navigate("/admin/org");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>
        <span style={{ color: C.invoice }}>🏢</span> {id ? "Edit organization" : "Organization profile"}
      </h1>
      <p style={{ margin: "0 0 18px", fontSize: "12px", color: C.muted }}>
        This information appears on invoices, bills and email notifications.
      </p>

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
        {loading && (
          <div style={{ marginBottom: "16px", fontSize: "12px", color: C.muted }}>Loading organization…</div>
        )}
        {/* Logo */}
        <div style={{ marginBottom: "20px" }}>
          {logoPreviewUrl &&<div
            style={{
              width: 96,
              height: 96,
              borderRadius: "16px",
              border: `1px solid ${C.border}`,
              background: C.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            {(
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={logoPreviewUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) }
          </div>}
          <div style={{ maxWidth: 380 }}>
            <FileUp
              file={logoFile}
              onChange={(f) => {
                setLogoFile(f);
                if (!f && logoPreviewUrl) {
                  URL.revokeObjectURL(logoPreviewUrl);
                  setLogoPreviewUrl(null);
                  setLogoRawFile(null);
                }
              }}
              onFileSelect={(file) => {
                if (logoPreviewUrl) {
                  URL.revokeObjectURL(logoPreviewUrl);
                }
                if (file) {
                  const url = URL.createObjectURL(file);
                  setLogoPreviewUrl(url);
                  setLogoRawFile(file);
                } else {
                  setLogoPreviewUrl(null);
                  setLogoRawFile(null);
                }
              }}
              accept=".jpg,.jpeg,.png,.gif,.webp"
              hint="JPG, PNG, GIF or WEBP, up to 1 MB. Recommended 240 × 240 px."
            />
          </div>
        </div>

        {/* Basic details */}
        <div style={gridStyle}>
          <div>
            <Inp
              label="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              req
              ph="Legal name"
            />
            <Inp
              label="Organization sub name"
              value={orgSubName}
              onChange={(e) => setOrgSubName(e.target.value)}
              ph="Short display name (optional)"
            />
            <Inp
              label="Industry"
              type="select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              req
              opts={[
                { v: "technology", l: "Technology" },
                { v: "services", l: "Services" },
                { v: "manufacturing", l: "Manufacturing" },
                { v: "consulting", l: "Consulting" },
              ]}
            />
            <Inp
              label="Organization location"
              type="select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              req
              opts={[{ v: "", l: "Select country" }, ...COUNTRY_OPTS]}
            />
          </div>

          <div>
            <PhoneInputField
              label="Phone"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                setPhoneError(null);
              }}
              defaultCountry={countryNameToPhoneCountry(country)}
              placeholder="Official contact number"
              error={phoneError}
            />
            <Inp label="Fax number" value={fax} onChange={(e) => setFax(e.target.value)} />
            <Inp
              label="Website URL"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              ph="https://example.com"
            />
          </div>
        </div>

        {/* Zoho credentials */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Add Zoho credentials
          </div>
          <div style={gridStyle}>
            <Inp
              label="Zoho Sign email"
              type="email"
              value={zohoSignEmail}
              onChange={(e) => setZohoSignEmail(e.target.value)}
              ph="authorized.signer@company.com"
              req
            />
            <Inp
              label="Client ID"
              value={zohoClientId}
              onChange={(e) => setZohoClientId(e.target.value)}
              ph="1000.xxxxx"
            />
            <Inp
              label="Client secret"
              type="password"
              value={zohoClientSecret}
              onChange={(e) => setZohoClientSecret(e.target.value)}
              ph="Zoho OAuth client secret"
            />
            <Inp
              label="Authorization code"
              value={zohoCode}
              onChange={(e) => setZohoCode(e.target.value)}
              ph="Temporary authorization code"
            />
            <Inp
              label="Refresh token"
              type="password"
              value={zohoRefreshToken}
              onChange={(e) => setZohoRefreshToken(e.target.value)}
              ph="Refresh token"
            />
            <Inp
              label="Data center"
              value={zohoDataCenter}
              onChange={(e) => setZohoDataCenter(e.target.value)}
              ph="IN"
            />
            <Inp
              label="Authorization endpoint"
              value={zohoAuthorizationEndpoint}
              onChange={(e) => setZohoAuthorizationEndpoint(e.target.value)}
              ph={DEFAULT_ZOHO_AUTHORIZATION_ENDPOINT}
            />
            <Inp
              label="Token endpoint"
              value={zohoTokenEndpoint}
              onChange={(e) => setZohoTokenEndpoint(e.target.value)}
              ph={DEFAULT_ZOHO_TOKEN_ENDPOINT}
            />
            <Inp
              label="Sign API base URL"
              value={zohoSignApiBaseUrl}
              onChange={(e) => setZohoSignApiBaseUrl(e.target.value)}
              ph={DEFAULT_ZOHO_SIGN_API_BASE_URL}
            />
            <Inp
              label="Redirect URI"
              value={zohoRedirectUri}
              onChange={(e) => setZohoRedirectUri(e.target.value)}
              ph="https://api.example.com/zoho/auth/callback"
            />
            <Inp
              label="Home page"
              value={zohoHomePage}
              onChange={(e) => setZohoHomePage(e.target.value)}
              ph="https://finance.example.com/"
            />
          </div>
          <Inp
            label="Scope"
            type="textarea"
            value={zohoScope}
            onChange={(e) => setZohoScope(e.target.value)}
            ph={DEFAULT_ZOHO_SCOPE}
          />
          {authorizationUrl && (
            <a href={authorizationUrl} target="_blank" rel="noreferrer" style={{ color: C.info, fontSize: "12px" }}>
              Open OAuth authorization URL
            </a>
          )}
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: C.muted, lineHeight: 1.4 }}>
            Invoice PDFs sent for Zoho Sign are delivered to the signatory email above. Use the OAuth link after saving
            the client details and redirect URI.
          </p>
        </div>

        {/* Organization address */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "10px",
            }}
          >
            Organization address
          </div>
          <Inp
            label="Address"
            type="textarea"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            req
            ph="Street, building, area"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
              gap: "10px",
            }}
          >
            <Inp label="City" value={city} onChange={(e) => setCity(e.target.value)} req />
            <Inp label="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} req />
            <Inp
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              req
              style={narrow ? {} : { gridColumn: "1 / span 2" }}
            />
          </div>
        </div>

        {/* Payment stub address */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Payment stub address
            </div>
            <Toggle checked={useSeparatePaymentAddress} onChange={setUseSeparatePaymentAddress} />
          </div>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px" }}>
            Use a different address on payment stubs shown to vendors.
          </div>
          {useSeparatePaymentAddress && (
            <Inp
              type="textarea"
              value={paymentAddress}
              onChange={(e) => setPaymentAddress(e.target.value)}
              ph="Payment stub address"
              style={{ marginBottom: 0 }}
            />
          )}
        </div>

        {/* Bank details */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Bank details
          </div>
          <div style={gridStyle}>
            <Inp
              label="Account holder name"
              value={accountHolderName}
              onChange={(e) => {
                setAccountHolderName(e.target.value);
                setBankError(null);
              }}
              ph="Name as per bank account"
              req
            />
            <Inp
              label="Bank name"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setBankError(null);
              }}
              ph="e.g. HDFC Bank"
              req
            />
            <Inp
              label="IFSC code"
              value={ifscCode}
              onChange={(e) => {
                setIfscCode(e.target.value);
                setBankError(null);
              }}
              ph="e.g. HDFC0001234"
              req
            />
            <Inp
              label="SWIFT code"
              value={swiftCode}
              onChange={(e) => {
                setSwiftCode(e.target.value);
                setBankError(null);
              }}
              ph="e.g. HDFCINBB"
              req
            />
            <Inp
              label="Account number"
              type="password"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ""));
                setBankError(null);
              }}
              ph="Account number"
              req
              hint="Digits only; masked while typing."
            />
            <Inp
              label="Re-enter account number"
              type="text"
              value={accountNumberRe}
              onChange={(e) => {
                setAccountNumberRe(e.target.value.replace(/\D/g, ""));
                setBankError(null);
              }}
              ph="Re-enter account number"
              req
              hint="Must match the account number above."
            />
          </div>
          <Inp
            label="Bank address"
            type="textarea"
            value={bankAddress}
            onChange={(e) => {
              setBankAddress(e.target.value);
              setBankError(null);
            }}
            req
            ph="Branch name, street, city"
          />
          {bankError && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: C.danger }}>{bankError}</div>
          )}
        </div>

        <div style={{ marginTop: "22px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Btn v="secondary" onClick={() => navigate("/admin/org")} disabled={saving}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
