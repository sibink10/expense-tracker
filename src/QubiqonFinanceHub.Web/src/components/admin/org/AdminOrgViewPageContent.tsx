import { useEffect, useState } from "react";
import { Building2, ExternalLink, MapPin, Phone, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C } from "../../../shared/theme";
import { Btn, EditActionButton } from "../../ui";
import { getOrganizations, type OrganizationPayload } from "../../../shared/api";

export default function AdminOrgViewPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrganizationPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState(3);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrganizations()
      .then((data) => {
        if (!cancelled) setOrgs(data);
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Responsive grid: 1 on mobile, 2 on tablet, 3 on desktop
  useEffect(() => {
    const computeCols = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 640) setCols(1);
      else if (w < 1024) setCols(2);
      else setCols(3);
    };
    computeCols();
    window.addEventListener("resize", computeCols);
    return () => window.removeEventListener("resize", computeCols);
  }, []);

  const hasOrgs = orgs.length > 0;

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div
        style={{
          position: "sticky",
          top: "-17px",
          background: "#f1f2f6",
          padding: "10px 2px",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "Manrope, sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              lineHeight: "100%",
              letterSpacing: "-0.02em",
              color: "#242424",
            }}
          >
            <Building2 size={24} color="#242424" strokeWidth={1.9} /> Organizations
          </h1>
        </div>
        <Btn v="invoice" onClick={() => navigate("/admin/org/edit")}>
          <Plus size={14} /> Add organization
        </Btn>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: C.muted }}>Loading organizations…</div>
      ) : !hasOrgs ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: "13px" }}>
          No organizations configured yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols === 1 ? "1fr" : cols === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: "16px",
          }}
        >
            {orgs.map((org) => {
              const name = org.orgName ?? "Organization";
              const locationLine =
                org.city || org.state || org.country
                  ? [org.city, org.state, org.country].filter(Boolean).join(", ")
                  : null;
              return (
                <div
                  key={org.id ?? org.orgName}
                  style={{
                    borderRadius: "4px",
                    border: "none",
                    padding: "14px 16px 12px",
                    background: "#fff",
                    boxShadow: "-5px -2px 108.5px 0px #00024914",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  {org.isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderTop: `28px solid ${C.success}`,
                        borderLeft: "28px solid transparent",
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "4px",
                        background: C.surface,
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {org.logoUrl ? (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <img src={org.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Building2 size={24} color={C.invoice} strokeWidth={1.8} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: C.muted, marginBottom: "2px" }}>Name</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px", color: C.primary }}>
                        {name}
                      </div>
                      {org.subName && (
                        <div style={{ fontSize: "12px", color: C.muted }}>{org.subName}</div>
                      )}
                      {locationLine && (
                        <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={12} color={C.muted} strokeWidth={1.9} />
                          {locationLine}
                        </div>
                      )}
                    </div>
                    {org.industry && (
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 600,
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            color: C.muted,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {org.industry}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "11px", color: C.muted, width: "100%" }}>
                    <div style={{ fontWeight: 600, marginBottom: "2px", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} color={C.muted} strokeWidth={1.9} /> Address
                    </div>
                    <div>{org.address || locationLine || "No address set"}</div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 8px",
                      fontSize: "11px",
                      color: C.muted,
                      width: "100%",
                    }}
                  >
                    {org.phone && (
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={12} color={C.muted} strokeWidth={1.9} />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.website && (
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
                        <ExternalLink size={12} color={C.muted} strokeWidth={1.9} />
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: C.invoice }}
                        >
                          {org.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <EditActionButton
                      sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
                      onClick={() => navigate(`/admin/org/edit/${org.id ?? ""}`)}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

