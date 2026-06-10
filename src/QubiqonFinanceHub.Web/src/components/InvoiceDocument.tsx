import type { Invoice } from "../types";
import type { OrganizationPayload } from "../shared/api/organization";
import { C } from "../shared/theme";
import { INV_S } from "../shared/constants";
import { fmtCur, fmtQty, daysOverdueFromDueYmd, formatTdsDetailParen } from "../shared/utils";

interface Props {
  invoice: Invoice;
  organization?: OrganizationPayload | null;
  /** Omit corner status ribbon (e.g. PDF download). */
  hideStatusRibbon?: boolean;
}

function buildAddress(parts: Array<string | undefined>): string[] {
  return parts.map((part) => (part || "").trim()).filter(Boolean);
}

const docBorder = "#D5DAE2";
const docMuted = "#667085";
const docBlue = "#164A83";
const docOrange = "#D35400";

function numberToWords(value: number, currency: string): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const underThousand = (n: number): string => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} Hundred`);
      n %= 100;
    }
    if (n >= 20) {
      parts.push(`${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
    } else if (n > 0) {
      parts.push(ones[n]);
    }
    return parts.join(" ");
  };

  const whole = Math.max(0, Math.floor(value));
  if (whole === 0) return `${currency} Zero`;
  const scales = ["", "Thousand", "Million", "Billion"];
  const parts: string[] = [];
  let remaining = whole;
  let scale = 0;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk) parts.unshift(`${underThousand(chunk)} ${scales[scale]}`.trim());
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return `${currency} ${parts.join(" ")}`;
}

export default function InvoiceDocument({ invoice: inv, organization: org, hideStatusRibbon = false }: Props) {
  const bankDetails = inv.organizationBankDetails;
  const bankOrgName = bankDetails?.orgName ?? org?.orgName;
  const accountHolderName = bankDetails?.accountHolderName ?? org?.accountHolderName;
  const bankName = bankDetails?.bankName ?? org?.bankName;
  const ifscCode = bankDetails?.ifscCode ?? org?.ifscCode;
  const swiftCode = bankDetails?.swiftCode ?? org?.swiftCode;
  const accountNumber = bankDetails?.accountNumber ?? org?.accountNumber;
  const bankAddress = bankDetails?.bankAddress ?? org?.bankAddress;

  const orgAddressLines = buildAddress([
    org?.address,
    [org?.city, org?.state].filter(Boolean).join(", "),
    [org?.country, org?.postalCode].filter(Boolean).join(" "),
  ]);
  const subTotal = inv.subTotal ?? inv.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const totalGst = inv.totalGst ?? inv.items.reduce((sum, item) => sum + item.gstAmt, 0);
  const tdsAmt = inv.taxAmt ?? 0;
  const tdsLabel = inv.taxName
    ? `TDS ${formatTdsDetailParen(null, inv.taxName)}`
    : "TDS";
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
              : inv.status === INV_S.PENDING_SIGNATURE
                ? C.info
                : inv.status === INV_S.SIGNED
                  ? C.success
                  : inv.status === INV_S.SIGNATURE_FAILED
                    ? C.danger
                    : C.muted;

  const overdueDays =
    inv.status === INV_S.OVERDUE ? daysOverdueFromDueYmd(inv.due) : null;

  const hasBankDetails = Boolean(
    accountHolderName?.trim() ||
      bankName?.trim() ||
      ifscCode?.trim() ||
      swiftCode?.trim() ||
      accountNumber?.trim() ||
      bankAddress?.trim(),
  );
  const billToLines = buildAddress([inv.billTo, inv.cEmail]);
  const shipToLines = buildAddress([inv.shipTo ?? inv.billTo, inv.cEmail]);
  const bankRows = [
    ["Account Holder Name", accountHolderName || bankOrgName],
    ["Account Number", accountNumber],
    ["IFSC Code", ifscCode],
    ["Bank Name", bankName],
    ["Bank Address", bankAddress],
    ["SWIFT Code", swiftCode],
  ].filter(([, value]) => value?.trim());

  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${docBorder}`,
        borderRadius: 0,
        overflow: "hidden",
        background: "#fff",
        width: "100%",
        color: "#111827",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
      }}
    >
      {!hideStatusRibbon && (
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
          {inv.status === INV_S.OVERDUE && overdueDays != null && overdueDays >= 1 ? (
            <>
              OVERDUE
              <span style={{ display: "block", fontSize: "9px", fontWeight: 700, marginTop: "2px", letterSpacing: "0.02em" }}>
                {overdueDays} {overdueDays === 1 ? "day" : "days"}
              </span>
            </>
          ) : (
            inv.status.toUpperCase()
          )}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "18px",
          padding: "22px 24px 18px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: "#E7F7F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {org?.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={org.logoUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "34px", fontWeight: 700, color: C.invoice }}>
                {(org?.orgName || "Q").trim()[0]}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.15, color: docBlue }}>
              {org?.orgName || "Qubiqon Finance Hub"}
            </div>
            {org?.subName && (
              <div style={{ fontSize: "11px", color: docMuted, marginTop: "4px" }}>{org.subName}</div>
            )}
            <div style={{ marginTop: "4px", fontSize: "10px", color: docMuted, lineHeight: 1.25 }}>
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
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "32px", lineHeight: 1, fontWeight: 700, letterSpacing: "0.04em", color: "#D1D5DB" }}>
            INVOICE
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "0 24px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          border: `1px solid ${docBorder}`,
          padding: "12px 14px",
        }}
      >
        <div>
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
                gridTemplateColumns: "110px 1fr",
                gap: "10px",
                fontSize: "10px",
                marginBottom: "4px",
              }}
            >
              <span style={{ color: docMuted }}>{label}</span>
              <span style={{ fontWeight: 700, color: docBlue }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: docOrange, whiteSpace: "nowrap" }}>
          {inv.currency} Invoice
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          margin: "0 24px 12px",
          border: `1px solid ${docBorder}`,
        }}
      >
        <div style={{ padding: "12px 14px", borderRight: `1px solid ${docBorder}` }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: docMuted,
              marginBottom: "6px",
            }}
          >
            Bill To
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: docBlue }}>{inv.cName}</div>
          {billToLines.map((line) => (
            <div key={line} style={{ color: docMuted, marginTop: "3px" }}>{line}</div>
          ))}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: docMuted,
              marginBottom: "6px",
            }}
          >
            Ship To
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: docBlue }}>{inv.cName}</div>
          {shipToLines.map((line) => (
            <div key={line} style={{ color: docMuted, marginTop: "3px" }}>{line}</div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F1F3F5" }}>
              {["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "GST", "Total"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 10px",
                    textAlign:
                      h === "Qty" || h === "Rate" || h === "GST" || h === "Total" ? "right" : "left",
                    borderBottom: `1px solid ${docBorder}`,
                    fontSize: "9px",
                    color: "#374151",
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
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}` }}>{i + 1}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}`, fontWeight: 700 }}>
                    {it.desc}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}` }}>{it.hsn || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}`, textAlign: "right" }}>
                    {fmtQty(it.qty)}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}`, textAlign: "right" }}>
                    {fmtCur(it.rate, inv.currency)}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${docBorder}`, textAlign: "right" }}>
                    {fmtCur(it.gstAmt, inv.currency)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: `1px solid ${docBorder}`,
                      textAlign: "right",
                      fontWeight: 700,
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
          gridTemplateColumns: "1.15fr 0.85fr",
          margin: "10px 24px 0",
        }}
      >
        <div
          style={{
            padding: "0 18px 12px 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "120px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                color: docMuted,
                marginBottom: "4px",
              }}
            >
              TOTAL IN WORDS
            </div>
            <div style={{ fontSize: "10px", fontStyle: "italic", fontWeight: 700, color: "#111827" }}>
              {numberToWords(inv.total, inv.currency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: docMuted, marginBottom: "5px" }}>Notes</div>
            <div style={{ fontSize: "10px", color: "#111827" }}>{inv.notes || "—"}</div>
          </div>
        </div>
        <div
          style={{
            padding: "0 0 12px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div>
            {(
              [
                { key: "subtotal", label: "Sub total", value: fmtCur(subTotal, inv.currency), bold: false, danger: false },
                { key: "gst", label: "GST", value: fmtCur(totalGst, inv.currency), bold: false, danger: false },
                ...(tdsAmt > 0
                  ? [{
                      key: "tds",
                      label: tdsLabel,
                      value: `-${fmtCur(tdsAmt, inv.currency)}`,
                      bold: false,
                      danger: true,
                    }]
                  : []),
                { key: "total", label: "Total", value: fmtCur(inv.total, inv.currency), bold: true, danger: false },
                {
                  key: "paid",
                  label: "Payment made",
                  value: paidAmount > 0 ? `(${fmtCur(paidAmount, inv.currency)})` : fmtCur(0, inv.currency),
                  bold: false,
                  danger: true,
                },
                { key: "balance", label: "Balance due", value: fmtCur(balanceDue, inv.currency), bold: true, danger: false },
              ] as const
            ).map((row) => (
              <div
                key={row.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "10px",
                  fontWeight: row.bold ? 700 : 600,
                  color: row.danger ? C.danger : "#111827",
                  marginBottom: "7px",
                }}
              >
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
            {inv.paidRef && (
              <div style={{ marginTop: "12px", fontSize: "11px", color: C.muted }}>
                Payment ref: <strong style={{ color: C.primary }}>{inv.paidRef}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
      {hasBankDetails && (
        <div style={{ margin: "22px 24px 28px" }}>
          <div style={{ fontSize: "10px", color: docMuted, marginBottom: "6px" }}>Bank Account Details</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <tbody>
              {bankRows.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ width: "42%", padding: "7px 8px", border: `1px solid ${docBorder}`, color: docMuted }}>
                    {label}
                  </td>
                  <td style={{ padding: "7px 8px", border: `1px solid ${docBorder}`, color: "#111827" }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
