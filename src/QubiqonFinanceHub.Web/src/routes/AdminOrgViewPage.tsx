import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Btn } from "../components/ui";
import { getOrganizations, type OrganizationPayload } from "../shared/api";

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
            <span style={{ color: C.invoice }}>🏢</span> Organizations
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.muted }}>
            Manage organization profiles used on invoices, bills and vendor payments.
          </p>
        </div>
        <Btn v="invoice" onClick={() => navigate("/admin/org/edit")}>
          ＋ Add organization
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
                    borderRadius: "12px",
                    border: `1px solid ${C.border}`,
                    padding: "14px 16px 12px",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  {org.selected && (
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
                        borderRadius: "12px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
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
                        <span style={{ fontSize: "20px", fontWeight: 700, color: C.invoice }}>
                          {name?.trim?.()[0] ?? "?"}
                        </span>
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
                        <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>
                          <span style={{ fontWeight: 600 }}>Location: </span>
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
                    <div style={{ fontWeight: 600, marginBottom: "2px" }}>Address</div>
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
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span style={{ fontWeight: 600 }}>Phone: </span>
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.website && (
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span style={{ fontWeight: 600 }}>Website: </span>
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
                    <Btn
                      sm
                      v="secondary"
                      onClick={() => navigate(`/admin/org/edit/${org.id ?? ""}`)}
                    >
                      Edit
                    </Btn>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

