import type { Invoice } from "../types";
import type { OrganizationPayload } from "../shared/api/organization";
import { C } from "../shared/theme";
import { INV_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";

interface Props {
  invoice: Invoice;
  organization?: OrganizationPayload | null;
}

function buildAddress(parts: Array<string | undefined>): string[] {
  return parts.map((part) => (part || "").trim()).filter(Boolean);
}

export default function InvoiceDocument({ invoice: inv, organization: org }: Props) {
  const orgAddressLines = buildAddress([
    org?.address,
    [org?.city, org?.state].filter(Boolean).join(", "),
    [org?.country, org?.postalCode].filter(Boolean).join(" "),
  ]);
  const paymentAddressLines = buildAddress([
    org?.useSeparatePaymentAddress ? org?.paymentAddress : org?.address,
    [org?.city, org?.state].filter(Boolean).join(", "),
    [org?.country, org?.postalCode].filter(Boolean).join(" "),
  ]);
  const subTotal = inv.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const totalGst = inv.items.reduce((sum, item) => sum + item.gstAmt, 0);
  const paidAmount = inv.paidAmound ?? (inv.status === INV_S.PAID ? inv.total : 0);
  const balanceDue = Math.max(inv.total - paidAmount, 0);
  const ribbonColor =
    inv.status === INV_S.PAID
      ? C.success
      : inv.status === INV_S.SENT
        ? C.info
        : inv.status === INV_S.OVERDUE
          ? C.danger
          : inv.status === INV_S.VIEWED
            ? "#6C3FA0"
            : inv.status === INV_S.PARTIALLY_PAID
              ? C.invoice
              : C.muted;

  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        background: "#fff",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "18px",
          right: "-38px",
          width: "140px",
          transform: "rotate(45deg)",
          background: ribbonColor,
          color: "#fff",
          textAlign: "center",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          padding: "6px 0",
          boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
          zIndex: 1,
        }}
      >
        {inv.status.toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: "16px",
          padding: "20px 24px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", gap: "14px", flex: 1 }}>
          <div
            style={{
              width: 64,
              height: 64,
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
            {org?.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={org.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: 700, color: C.invoice }}>
                {(org?.orgName || "Q").trim()[0]}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.1, color: C.primary }}>
              {org?.orgName || "Qubiqon Finance Hub"}
            </div>
            {org?.subName && (
              <div style={{ fontSize: "13px", color: C.muted, marginTop: "2px" }}>{org.subName}</div>
            )}
            <div style={{ marginTop: "8px", fontSize: "12px", color: C.primary }}>
              {orgAddressLines.length > 0 ? (
                orgAddressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))
              ) : (
                <div>Organization address not configured</div>
              )}
              {org?.phone && <div>{org.phone}</div>}
              {org?.website && <div>{org.website}</div>}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ padding: "14px 24px", borderRight: `1px solid ${C.border}` }}>
          {[
            ["Invoice #", inv.id],
            ["Invoice date", inv.invDate],
            ["Terms", inv.terms || "—"],
            ["Due date", inv.due],
            ["PO #", inv.po || "NA"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: "8px",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              <span style={{ color: C.muted }}>{label}</span>
              <span style={{ fontWeight: 600, color: C.primary }}>{value}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "14px 24px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: C.muted }}>{inv.currency} invoice</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ padding: "14px 24px", borderRight: `1px solid ${C.border}` }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Bill To
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: C.invoice }}>{inv.cName}</div>
          {inv.cEmail && <div style={{ fontSize: "12px", marginTop: "4px" }}>{inv.cEmail}</div>}
        </div>
        <div style={{ padding: "14px 24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Payment Address
          </div>
          <div style={{ fontSize: "12px", color: C.primary }}>
            {paymentAddressLines.length > 0 ? (
              paymentAddressLines.map((line) => (
                <div key={line}>{line}</div>
              ))
            ) : (
              <div>Not configured</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: C.surface }}>
              {["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "GST", "Total"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign:
                      h === "Qty" || h === "Rate" || h === "GST" || h === "Total" ? "right" : "left",
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: "11px",
                    color: C.muted,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => {
              const lineTotal = it.qty * it.rate + it.gstAmt;
              return (
                <tr key={i}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, fontWeight: 500 }}>
                    {it.desc}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>{it.hsn || "—"}</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, textAlign: "right" }}>
                    {it.qty}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, textAlign: "right" }}>
                    {fmtCur(it.rate, inv.currency)}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, textAlign: "right" }}>
                    {fmtCur(it.gstAmt, inv.currency)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      borderBottom: `1px solid ${C.border}`,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {fmtCur(lineTotal, inv.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
        }}
      >
        <div style={{ padding: "16px 24px", borderRight: `1px solid ${C.border}` }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Notes
          </div>
          <div style={{ fontSize: "12px", color: C.primary, minHeight: "48px" }}>{inv.notes || "—"}</div>
        </div>
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            {[
              ["Sub total", fmtCur(subTotal, inv.currency)],
              ["GST", fmtCur(totalGst, inv.currency)],
              ["Total", fmtCur(inv.total, inv.currency)],
              ["Payment made", paidAmount > 0 ? `(${fmtCur(paidAmount, inv.currency)})` : fmtCur(0, inv.currency)],
              ["Balance due", fmtCur(balanceDue, inv.currency)],
            ].map(([label, value], idx) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                  fontWeight: idx >= 2 ? 600 : 500,
                  color: idx === 3 ? C.danger : idx >= 2 ? C.primary : C.muted,
                  marginBottom: "6px",
                }}
              >
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            {inv.paidRef && (
              <div style={{ marginTop: "12px", fontSize: "11px", color: C.muted }}>
                Payment ref: <strong style={{ color: C.primary }}>{inv.paidRef}</strong>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: "48px",
              paddingTop: "48px",
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", color: C.muted, marginBottom: "48px" }}>
              {org?.orgName || "Authorized by organization"}
            </div>
            <div style={{ borderTop: `1px solid ${C.primary}`, width: "160px", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "11px", fontWeight: 600, color: C.primary }}>Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
