export type UserRole = "employee" | "approver" | "finance" | "admin";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  dept: string;
  av: string;
  /** Backend employee UUID for API calls (e.g. onBehalfOfEmployeeId) */
  employeeId?: string;
}

export interface NavItem {
  path: string;
  l: string;
  i: string;
  r: UserRole[];
  b?: number;
  /** When true, NavLink only matches exactly (avoids parent + child both active) */
  end?: boolean;
}

export interface NavSection {
  s: string;
  c?: string;
  items: NavItem[];
}

// Data types
export interface ActivityComment {
  by: string;
  text: string;
  d: string;
  t: "ok" | "no" | "pay" | "sent";
}

export interface FileRef {
  n: string;
  s: string;
}

export interface Expense {
  id: string;
  /** Backend API id (GUID) for approve/reject endpoints */
  apiId?: string;
  empId: number;
  empName: string;
  dept: string;
  amt: number;
  purpose: string;
  reqBy: string;
  status: string;
  at: string;
  file: FileRef | null;
  comments: ActivityComment[];
}

export interface Bill {
  id: string;
  /** Backend API id (GUID) for approve/reject/pay endpoints */
  apiId?: string;
  vId: string;
  vName: string;
  vGst: string;
  vEmail: string;
  amt: number;
  tds: string;
  tdsAmt: number;
  pay: number;
  desc: string;
  bDate: string;
  due: string;
  terms: string;
  status: string;
  file: FileRef | null;
  by: number;
  byName: string;
  at: string;
  comments: ActivityComment[];
  cc?: string[];
  paidRef?: string;
}

export interface Advance {
  id: string;
  /** Backend API id (GUID) for approve/reject endpoints */
  apiId?: string;
  empId: number;
  empName: string;
  dept: string;
  amt: number;
  purpose: string;
  status: string;
  at: string;
  comments: ActivityComment[];
}

export interface InvoiceItem {
  desc: string;
  hsn: string;
  qty: number;
  rate: number;
  gst: string;
  gstAmt: number;
}

export interface Invoice {
  id: string;
  /** Backend API id for mark-paid etc. */
  apiId?: string;
  cId: string;
  cName: string;
  cEmail: string;
  currency: string;
  items: InvoiceItem[];
  subTotal: number;
  taxId: string | null;
  taxAmt: number;
  total: number;
  invDate: string;
  due: string;
  terms: string;
  status: string;
  po: string;
  notes: string;
  at: string;
  comments: ActivityComment[];
  paidRef?: string;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  email: string;
  cat: string;
  ph: string;
  addr: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  addr: string;
  gstin: string;
  taxType: string;
}

export interface OrgConfig {
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  cin: string;
  tan: string;
  addr1: string;
  addr2: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  bankAccName: string;
  bankAccNo: string;
  bankIfsc: string;
  bankName: string;
  bankBranch: string;
  bankSwift: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  section: string;
  isActive: boolean;
  type?: string;
  subType?: string;
}

export interface GstType {
  id: string;
  name: string;
  rate: number;
  type?: string;
  active: boolean;
}

export interface AppConfig {
  expFmt: string;
  billFmt: string;
  advFmt: string;
  invFmt: string;
  advEnabled: boolean;
  advCap: number;
  ccEmails: string[];
  expSeq: number;
  billSeq: number;
  advSeq: number;
  invSeq: number;
  org: OrgConfig;
  taxes: TaxConfig[];
  gstTypes: GstType[];
}

export interface ToastData {
  m: string;
  type: string;
}

export interface EmailData {
  to: string;
  cc?: string;
  subj: string;
}

export interface ModalData {
  t?: string;
  d?: Expense | Bill | Advance | Invoice | Vendor | Client;
  it?: "expense" | "bill" | "advance";
}
