import { ITEM_T, MODAL_T, ROLES } from "../shared/constants";

export type UserRole = typeof ROLES[keyof typeof ROLES];
export type ItemType = typeof ITEM_T[keyof typeof ITEM_T];

export interface AppUser {
  /** Logged-in employee id: API returns employee `Guid` as string; dev mock uses numeric id. */
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dept: string;
  av: string;
  /** Home org from Employees.OrganizationId */
  homeOrganizationId?: string;
  /** Override from employee_organization_context; null when working in home org */
  activeOrganizationId?: string | null;
  /** Active override or home — tenant for API data */
  effectiveOrganizationId?: string;
}

export interface NavItem {
  path: string;
  l: string;
  i: string;
  r: UserRole[];
  /** When true, NavLink only matches exactly (avoids parent + child both active) */
  end?: boolean;
  /** Optional path for create/add action - renders + at flex-end of nav item */
  addPath?: string;
  /** Roles that can see the add button (defaults to r if not set) */
  addRoles?: UserRole[];
}

export interface NavSection {
  s: string;
  c?: string;
  i?: string;
  path?: string;
  end?: boolean;
  items: NavItem[];
}

// Data types
export interface ActivityComment {
  by: string;
  text: string;
  d: string;
  t: "ok" | "no" | "pay" | "sent";
  /** Action / status label for this entry (e.g. Approved, Payment processed). */
  status?: string;
}

export interface FileRef {
  n: string;
  s: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  contentType?: string;
  sizeBytes: number;
  sizeLabel: string;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  /** Backend API id (GUID) for approve/reject endpoints */
  apiId?: string;
  /** Beneficiary employee id (GUID) — whose expense this is */
  employeeId?: string;
  /** Who raised/submitted the request (GUID); cancel only when this matches the logged-in user */
  submittedByEmployeeId?: string;
  empId: number;
  empName: string;
  dept: string;
  amt: number;
  purpose: string;
  reqBy: string;
  status: string;
  at: string;
  file: FileRef | null;
  /** Full URL for view/download of bill image */
  attachmentUrl?: string | null;
  documents: UploadedDocument[];
  billNumber?: string;
  billDate?: string;
  paidAmount?: number;
  comments: ActivityComment[];
}

export interface BillLineItem {
  lineNumber: number;
  description: string;
  account?: string;
  quantity: number;
  rate: number;
  gstConfigId?: string;
  gstName?: string;
  gstRate?: number;
  amount: number;
}

export interface Bill {
  id: string;
  /** Backend API id (GUID) for approve/reject/pay endpoints */
  apiId?: string;
  vendorBillNumber?: string;
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
  /** From API: "Pay immediately" | "Pay later" */
  paymentPriority?: string;
  status: string;
  file: FileRef | null;
  documents: UploadedDocument[];
  by: number;
  byName: string;
  at: string;
  comments: ActivityComment[];
  cc?: string[];
  paidRef?: string;
  paidAmount?: number;
  lineItems?: BillLineItem[];
  discountPercent?: number;
  rounding?: number;
}

export interface Advance {
  id: string;
  /** Backend API id (GUID) for approve/reject endpoints */
  apiId?: string;
  /** Employee who raised the advance (GUID); cancel allowed only when this matches the logged-in user */
  employeeId?: string;
  empId: number;
  empName: string;
  dept: string;
  amt: number;
  paidAmount?: number;
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
  gstConfigId?: string | null;
}

export interface Invoice {
  id: string;
  /** Backend API id for mark-paid etc. */
  apiId?: string;
  cId: string;
  cName: string;
  cEmail: string;
  billTo?: string;
  shipTo?: string;
  currency: string;
  items: InvoiceItem[];
  subTotal: number;
  taxId: string | null;
  taxConfigId?: string | null;
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
  paidAmound?: number;
  zohoSignRequestId?: string | null;
  zohoSignStatus?: string | null;
  signatureRequestedAt?: string | null;
  signedPdfUrl?: string | null;
  signedAt?: string | null;
  organizationBankDetails?: {
    orgName: string;
    accountHolderName?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    swiftCode?: string | null;
    accountNumber?: string | null;
    bankAddress?: string | null;
  } | null;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  email: string;
  cat: string;
  ph: string;
  addr: string;
  contactPerson?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  /** @deprecated use billingAddress / shippingAddress */
  addr?: string;
  gstin: string;
  taxType: string;
  customerType?: string;
  shippingAddress?: string;
  billingAddress?: string;
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
  balanceCap: number;
  /** Base URL for “view in app” links in emails (no trailing slash). Stored as org setting frontendUrl. */
  frontendUrl: string;
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
  t?: typeof MODAL_T[keyof typeof MODAL_T] | null;
  d?: Expense | Bill | Advance | Invoice | Vendor | Client | TaxConfig;
  it?: ItemType;
}
