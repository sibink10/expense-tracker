import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, FileUp, Toggle } from "../components/ui";
import { getOrganization, saveOrganization } from "../shared/api";

const GRID_BREAKPOINT = 720;

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
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [website, setWebsite] = useState("");
  const [useSeparatePaymentAddress, setUseSeparatePaymentAddress] = useState(false);
  const [paymentAddress, setPaymentAddress] = useState("");
  const [logoFile, setLogoFile] = useState<{ n: string; s: string } | null>(null);
  const [logoRawFile, setLogoRawFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);

  const narrow = typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT;

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1.2fr 1fr",
    gap: "16px",
  };

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
        setCountry(org.country ?? "");
        setAddress(org.address ?? "");
        setCity(org.city ?? "");
        setPostalCode(org.postalCode ?? "");
        setState(org.state ?? "");
        setPhone(org.phone ?? "");
        setFax(org.fax ?? "");
        setWebsite(org.website ?? "");
        setUseSeparatePaymentAddress(org.useSeparatePaymentAddress ?? false);
        setPaymentAddress(org.paymentAddress ?? "");
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
      phone: phone || undefined,
      fax: fax || undefined,
      website: website || undefined,
      useSeparatePaymentAddress: useSeparatePaymentAddress,
      paymentAddress: useSeparatePaymentAddress ? paymentAddress || undefined : undefined,
      logoFile: logoRawFile || undefined,
    });
    navigate("/admin/org");
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
              opts={[
                { v: "IN", l: "India" },
                { v: "US", l: "United States" },
                { v: "GB", l: "United Kingdom" },
              ]}
            />
          </div>

          <div>
            <Inp
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              ph="Official contact number"
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

        <div style={{ marginTop: "22px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Btn v="secondary" onClick={() => navigate("/admin/org")}>
            Cancel
          </Btn>
          <Btn v="invoice" onClick={handleSave}>
            Save
          </Btn>
        </div>
      </div>
    </div>
  );
}
