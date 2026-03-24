import { EXP_S, BILL_S, ADV_S, INV_S } from "./constants";
import type { Expense, Bill, Advance, Invoice, Vendor, Client } from "../types";

export const INIT_VENDORS: Vendor[] = [
  { id: "V001", name: "The Ice Cream Factory", gstin: "32ADDPK7135J2ZN", email: "accounts@icecreamfactory.in", cat: "Advertising", ph: "9847012345", addr: "Kakkanad, Kochi" },
  { id: "V002", name: "Azure Cloud Services", gstin: "27MSFTC1234A1Z5", email: "billing@microsoft.com", cat: "Cloud", ph: "", addr: "Hyderabad" },
  { id: "V003", name: "Wipro Infotech", gstin: "29WIPRO5678B1ZR", email: "vendor@wipro.com", cat: "IT Services", ph: "9876543210", addr: "Bangalore" },
];

export const INIT_CLIENTS: Client[] = [
  { id: "C001", name: "Huddlesmith", contact: "Karim Kurji", email: "karim@huddlesmith.com", phone: "", country: "Canada", currency: "USD", addr: "3421 Concession Rd 5, ON L0B 1M0, Clarington", gstin: "", taxType: "SEZ" },
  { id: "C002", name: "TechVista Solutions", contact: "Ramesh Gupta", email: "accounts@techvista.in", phone: "", country: "India", currency: "INR", addr: "Koramangala, Bangalore 560034", gstin: "29TVSSL4567M1ZQ", taxType: "Domestic" },
  { id: "C003", name: "Nordic Digital AS", contact: "Lars Eriksen", email: "billing@nordicdigital.no", phone: "", country: "Norway", currency: "EUR", addr: "Storgata 15, 0184 Oslo", gstin: "", taxType: "Export" },
];

export const INIT_EXPENSES: Expense[] = [
  { id: "EXP-2026-00001", empId: 1, empName: "Arun Kumar", dept: "Engineering", amt: 15000, purpose: "Azure DevOps licenses", reqBy: "2026-03-20", status: EXP_S.PENDING, at: "2026-03-10", file: null, documents: [], comments: [] },
  { id: "EXP-2026-00002", empId: 2, empName: "Priya Sharma", dept: "Marketing", amt: 45000, purpose: "Q1 LinkedIn Ads campaign", reqBy: "2026-03-25", status: EXP_S.APPROVED, at: "2026-03-08", file: null, documents: [], comments: [{ by: "Rajesh Nair", text: "Approved.", d: "2026-03-09", t: "ok" }] },
  { id: "EXP-2026-00003", empId: 5, empName: "Vikram Menon", dept: "Sales", amt: 8500, purpose: "BLR-MUM client travel", reqBy: "2026-03-18", status: EXP_S.COMPLETED, at: "2026-03-07", file: { n: "travel.pdf", s: "128 KB" }, documents: [{ id: "exp-doc-1", name: "travel.pdf", sizeBytes: 131072, sizeLabel: "128 KB", uploadedAt: "2026-03-07" }], comments: [{ by: "Rajesh Nair", text: "Approved.", d: "2026-03-08", t: "ok" }, { by: "Meera Iyer", text: "Paid. Ref: QBQ0310001", d: "2026-03-10", t: "pay" }] },
];

export const INIT_BILLS: Bill[] = [
  { id: "BL-200/25-26", vId: "V001", vName: "The Ice Cream Factory", vGst: "32ADDPK7135J2ZN", vEmail: "accounts@icecreamfactory.in", amt: 449500, tds: "T07", tdsAmt: 8990, pay: 440510, desc: "Hoarding & LED displays — Infopark branding", bDate: "2026-03-10", due: "2026-04-09", terms: "net30", paymentPriority: "Pay immediately", status: BILL_S.SUBMITTED, file: { n: "BL_200.pdf", s: "42 KB" }, documents: [{ id: "bill-doc-1", name: "BL_200.pdf", sizeBytes: 43008, sizeLabel: "42 KB", uploadedAt: "2026-03-10" }], by: 4, byName: "Meera Iyer", at: "2026-03-10", comments: [], cc: ["marketing@qubiqon.io"] },
  { id: "BL-201/25-26", vId: "V002", vName: "Azure Cloud Services", vGst: "27MSFTC1234A1Z5", vEmail: "billing@microsoft.com", amt: 285000, tds: "T07", tdsAmt: 5700, pay: 279300, desc: "Azure Feb 2026 subscription", bDate: "2026-03-05", due: "2026-04-04", terms: "net30", paymentPriority: "Pay later", status: BILL_S.APPROVED, file: { n: "AZURE_FEB.pdf", s: "156 KB" }, documents: [{ id: "bill-doc-2", name: "AZURE_FEB.pdf", sizeBytes: 159744, sizeLabel: "156 KB", uploadedAt: "2026-03-05" }], by: 4, byName: "Meera Iyer", at: "2026-03-05", comments: [{ by: "Rajesh Nair", text: "Approved.", d: "2026-03-06", t: "ok" }], cc: [] },
];

export const INIT_ADVANCES: Advance[] = [
  { id: "ADV-2026-0001", empId: 1, empName: "Arun Kumar", dept: "Engineering", amt: 25000, purpose: "Hyderabad client visit", status: ADV_S.DISBURSED, at: "2026-03-05", comments: [{ by: "Rajesh Nair", text: "Approved.", d: "2026-03-06", t: "ok" }, { by: "Meera Iyer", text: "Disbursed. Ref: QBQADV07", d: "2026-03-07", t: "pay" }] },
  { id: "ADV-2026-0002", empId: 5, empName: "Vikram Menon", dept: "Sales", amt: 15000, purpose: "Mumbai meetings — 3 days", status: ADV_S.PENDING, at: "2026-03-11", comments: [] },
];

export const INIT_INVOICES: Invoice[] = [
  { id: "QINV-SEZ-2626114", cId: "C001", cName: "Huddlesmith", cEmail: "karim@huddlesmith.com", currency: "USD", items: [{ desc: "Huddlesmith - EstateXL - Fullstack Developer - Allan Varghese\nBased on Approved Time Sheets", hsn: "998314", qty: 152, rate: 19, gst: "G12", gstAmt: 0 }, { desc: "Huddlesmith - EstateXL - Fullstack Developer - Nihal Fairooz E S\nBased on Approved Time Sheets", hsn: "998314", qty: 152, rate: 13, gst: "G12", gstAmt: 0 }], subTotal: 4864, taxId: null, taxAmt: 0, total: 4864, invDate: "2026-03-05", due: "2026-05-04", terms: "net60", status: INV_S.SENT, po: "NA", notes: "Looking forward for your business.", at: "2026-03-05", comments: [{ by: "Meera Iyer", text: "Invoice sent to client.", d: "2026-03-05", t: "sent" }] },
  { id: "QINV-DOM-2626113", cId: "C002", cName: "TechVista Solutions", cEmail: "accounts@techvista.in", currency: "INR", items: [{ desc: "Power Platform Development - March 2026", hsn: "998314", qty: 200, rate: 1500, gst: "G04", gstAmt: 54000 }], subTotal: 300000, taxId: "T07", taxAmt: 6000, total: 348000, invDate: "2026-03-01", due: "2026-03-31", terms: "net30", status: INV_S.PAID, po: "PO-TV-2026-008", notes: "", at: "2026-03-01", comments: [{ by: "Meera Iyer", text: "Sent.", d: "2026-03-01", t: "sent" }, { by: "Meera Iyer", text: "Payment received. Ref: NEFT20260325TV", d: "2026-03-25", t: "pay" }], paidRef: "NEFT20260325TV" },
];
