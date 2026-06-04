import type { CSSProperties } from "react";

export const C = {
  primary: "#242424",
  accent: "#219268",
  accentH: "#1B7A57",
  surface: "#F7F8FA",
  text: "#242424",
  muted: "#4E4E4E",
  border: "#E2E6ED",
  subtleBorder: "#DEDEDE",
  white: "#FFFFFF",
  success: "#219268",
  successBg: "#E1F5EE",
  warning: "#854F0B",
  warningBg: "#FAEEDA",
  danger: "#A32D2D",
  dangerBg: "#FCEBEB",
  info: "#219268",
  infoBg: "#E6F1FB",
  vendor: "#219268",
  vendorBg: "#F0EAFC",
  vendorL: "#2DB77F",
  advance: "#219268",
  advanceBg: "#E0F7FA",
  invoice: "#219268",
  invoiceBg: "#FEF3C7",
  invoiceL: "#2DB77F",
  clientAvatarBg: "#E1F5EE",
  clientAvatarText: "#219268",
  actionIcon: "#6D6B6B",
  actionDangerIcon: "#FF383C",
  cardShadow: "0 1px 4px rgba(15, 23, 42, 0.06)",
  tableButtonShadow: "0 1px 3px rgba(15, 23, 42, 0.1)",
  actionEditBg: "#EEF2FF",
  actionEditIcon: "#4F46E5",
  actionDeleteBg: "#FCEBEB",
  actionDownloadBg: "#E6F1FB",
  actionDownloadIcon: "#185FA5",
  invoiceActionSent: "#185FA5",
  invoiceActionSentBg: "#E6F1FB",
  invoiceActionSign: "#6C3FA0",
  invoiceActionSignBg: "#F0EAFC",
  invoiceActionPaid: "#219268",
  invoiceActionPaidBg: "#E1F5EE",
};

/** Standard corner radius for cards, tables, buttons, tabs, and status pills */
export const R = {
  control: "0.75rem",
};

/** Horizontal padding inside list table cards */
export const listTableCardPaddingX = "16px";

/** Right inset for list page title/search header (search aligns with table content) */
export const listPageHeaderPaddingRight = "8px";

/** White list/table container used on list pages */
export const listTableCardStyle: CSSProperties = {
  background: C.white,
  borderRadius: R.control,
  padding: `14px ${listTableCardPaddingX} 16px`,
  boxShadow: C.cardShadow,
};

/** Gap between list page title/search header and table card */
export const listTableBodyMarginTop = "10px";

/** Gap above table card on My Requests and Payable list pages */
export const listSectionTableBodyMarginTop = "20px";

/** @deprecated Use listSectionTableBodyMarginTop */
export const listRequestTableBodyMarginTop = listSectionTableBodyMarginTop;

/** Extra gap below list page title/search block (most spacing comes from listTableBodyMarginTop) */
export const listPageHeaderMarginBottom = "0px";

/** Corner radius for workflow and icon buttons inside table action columns */
export const R_TABLE_BUTTON = "6px";

/** Workflow buttons inside table action columns */
export function workflowTableActionStyle(fg: string, bg: string): CSSProperties {
  return {
    borderRadius: R_TABLE_BUTTON,
    background: bg,
    color: fg,
    padding: "6px 8px",
    minHeight: 26,
    boxShadow: C.tableButtonShadow,
  };
}

/** Icon edit/delete buttons in table rows */
export function tableIconButtonSx(background: string): CSSProperties {
  return {
    width: 30,
    height: 30,
    background,
    borderRadius: R_TABLE_BUTTON,
    boxShadow: C.tableButtonShadow,
  };
}
