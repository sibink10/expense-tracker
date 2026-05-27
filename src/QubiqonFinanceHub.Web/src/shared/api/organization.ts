import { apiClient } from "./client";

// Raw DTO shape returned/expected by the backend.
// Includes both PascalCase and camelCase variants so responses are flexible.
export interface OrganizationDto {
  Id?: string;
  id?: string;
  OrgName?: string;
  orgName?: string;
  SubName?: string;
  subName?: string;
  Address?: string;
  address?: string;
  PaymentAddress?: string;
  paymentAddress?: string;
  UseSeparatePaymentAddress?: boolean;
  useSeparatePaymentAddress?: boolean;
  City?: string;
  city?: string;
  State?: string;
  state?: string;
  Country?: string;
  country?: string;
  PostalCode?: string;
  postalCode?: string;
  Phone?: string;
  phone?: string;
  Fax?: string;
  fax?: string;
  Website?: string;
  website?: string;
  Industry?: string;
  industry?: string;
  AccountHolderName?: string;
  accountHolderName?: string;
  BankName?: string;
  bankName?: string;
  IfscCode?: string;
  ifscCode?: string;
  SwiftCode?: string;
  swiftCode?: string;
  AccountNumber?: string;
  accountNumber?: string;
  BankAddress?: string;
  bankAddress?: string;
  Tenant?: string;
  tenant?: string;
  IsCurrent?: boolean;
  isCurrent?: boolean;
  LogoUrl?: string | null;
  logoUrl?: string | null;
  ZohoSignEmail?: string;
  zohoSignEmail?: string;
  ZohoClientId?: string;
  zohoClientId?: string;
  ZohoClientSecret?: string;
  zohoClientSecret?: string;
  ZohoCode?: string;
  zohoCode?: string;
  ZohoScope?: string;
  zohoScope?: string;
  ZohoDataCenter?: string;
  zohoDataCenter?: string;
  ZohoAuthorizationEndpoint?: string;
  zohoAuthorizationEndpoint?: string;
  ZohoTokenEndpoint?: string;
  zohoTokenEndpoint?: string;
  ZohoSignApiBaseUrl?: string;
  zohoSignApiBaseUrl?: string;
  ZohoRedirectUri?: string;
  zohoRedirectUri?: string;
  ZohoHomePage?: string;
  zohoHomePage?: string;
  ZohoRefreshToken?: string;
  zohoRefreshToken?: string;
}

export interface OrganizationPayload {
  id?: string;
  orgName: string;
  subName?: string;
  address?: string;
  paymentAddress?: string;
  useSeparatePaymentAddress?: boolean;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  fax?: string;
  website?: string;
  industry?: string;
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  swiftCode?: string;
  accountNumber?: string;
  bankAddress?: string;
  tenant?: string;
  isCurrent?: boolean;
  logoUrl?: string | null;
  logoFile?: File | null;
  zohoSignEmail?: string;
  zohoClientId?: string;
  zohoClientSecret?: string;
  zohoCode?: string;
  zohoScope?: string;
  zohoDataCenter?: string;
  zohoAuthorizationEndpoint?: string;
  zohoTokenEndpoint?: string;
  zohoSignApiBaseUrl?: string;
  zohoRedirectUri?: string;
  zohoHomePage?: string;
  zohoRefreshToken?: string;
}

// Normalized shape used by the UI
function mapDtoToPayload(dto: OrganizationDto): OrganizationPayload {
  const anyDto = dto as unknown as Record<string, unknown>;
  return {
    id: (anyDto.Id as string) ?? (anyDto.id as string),
    orgName: (anyDto.OrgName as string) ?? (anyDto.orgName as string) ?? "",
    subName: (anyDto.SubName as string) ?? (anyDto.subName as string),
    address: (anyDto.Address as string) ?? (anyDto.address as string),
    paymentAddress: (anyDto.PaymentAddress as string) ?? (anyDto.paymentAddress as string),
    useSeparatePaymentAddress:
      (anyDto.UseSeparatePaymentAddress as boolean) ?? (anyDto.useSeparatePaymentAddress as boolean),
    city: (anyDto.City as string) ?? (anyDto.city as string),
    state: (anyDto.State as string) ?? (anyDto.state as string),
    country: (anyDto.Country as string) ?? (anyDto.country as string),
    postalCode: (anyDto.PostalCode as string) ?? (anyDto.postalCode as string),
    phone: (anyDto.Phone as string) ?? (anyDto.phone as string),
    fax: (anyDto.Fax as string) ?? (anyDto.fax as string),
    website: (anyDto.Website as string) ?? (anyDto.website as string),
    industry: (anyDto.Industry as string) ?? (anyDto.industry as string),
    accountHolderName: (anyDto.AccountHolderName as string) ?? (anyDto.accountHolderName as string),
    bankName: (anyDto.BankName as string) ?? (anyDto.bankName as string),
    ifscCode: (anyDto.IfscCode as string) ?? (anyDto.ifscCode as string),
    swiftCode: (anyDto.SwiftCode as string) ?? (anyDto.swiftCode as string),
    accountNumber: (anyDto.AccountNumber as string) ?? (anyDto.accountNumber as string),
    bankAddress: (anyDto.BankAddress as string) ?? (anyDto.bankAddress as string),
    tenant: (anyDto.Tenant as string) ?? (anyDto.tenant as string),
    isCurrent: (anyDto.IsCurrent as boolean) ?? (anyDto.isCurrent as boolean) ?? false,
    logoUrl: (anyDto.LogoUrl as string) ?? (anyDto.logoUrl as string) ?? null,
    zohoSignEmail: (anyDto.ZohoSignEmail as string) ?? (anyDto.zohoSignEmail as string),
    zohoClientId: (anyDto.ZohoClientId as string) ?? (anyDto.zohoClientId as string),
    zohoClientSecret: (anyDto.ZohoClientSecret as string) ?? (anyDto.zohoClientSecret as string),
    zohoCode: (anyDto.ZohoCode as string) ?? (anyDto.zohoCode as string),
    zohoScope: (anyDto.ZohoScope as string) ?? (anyDto.zohoScope as string),
    zohoDataCenter: (anyDto.ZohoDataCenter as string) ?? (anyDto.zohoDataCenter as string),
    zohoAuthorizationEndpoint: (anyDto.ZohoAuthorizationEndpoint as string) ?? (anyDto.zohoAuthorizationEndpoint as string),
    zohoTokenEndpoint: (anyDto.ZohoTokenEndpoint as string) ?? (anyDto.zohoTokenEndpoint as string),
    zohoSignApiBaseUrl: (anyDto.ZohoSignApiBaseUrl as string) ?? (anyDto.zohoSignApiBaseUrl as string),
    zohoRedirectUri: (anyDto.ZohoRedirectUri as string) ?? (anyDto.zohoRedirectUri as string),
    zohoHomePage: (anyDto.ZohoHomePage as string) ?? (anyDto.zohoHomePage as string),
    zohoRefreshToken: (anyDto.ZohoRefreshToken as string) ?? (anyDto.zohoRefreshToken as string),
  };
}

export async function getOrganization(id: string): Promise<OrganizationPayload> {
  const { data } = await apiClient.get<OrganizationDto | null>(`/organization/${id}`);
  if (!data) {
    // If backend returns null/404-like payload, fall back to a minimal object
    return {
      id,
      orgName: "",
    };
  }
  return mapDtoToPayload(data);
}

export async function getOrganizations(): Promise<OrganizationPayload[]> {
  // Backend lists organizations via /api/organization/all
  const { data } = await apiClient.get<OrganizationDto[] | OrganizationDto | null>("/organization/all");
  if (!data) return [];
  const arr = Array.isArray(data) ? data : [data];
  return arr.map(mapDtoToPayload);
}

export async function saveOrganization(payload: OrganizationPayload): Promise<OrganizationPayload> {
  const form = new FormData();
  form.append("OrgName", payload.orgName);
  if (payload.subName) form.append("SubName", payload.subName);
  if (payload.address) form.append("Address", payload.address);
  if (payload.paymentAddress) form.append("PaymentAddress", payload.paymentAddress);
  form.append(
    "UseSeparatePaymentAddress",
    String(payload.useSeparatePaymentAddress ?? false),
  );
  if (payload.city) form.append("City", payload.city);
  if (payload.state) form.append("State", payload.state);
  if (payload.country) form.append("Country", payload.country);
  if (payload.postalCode) form.append("PostalCode", payload.postalCode);
  if (payload.phone) form.append("Phone", payload.phone);
  if (payload.fax) form.append("Fax", payload.fax);
  if (payload.website) form.append("Website", payload.website);
  if (payload.industry) form.append("Industry", payload.industry);
  if (payload.accountHolderName) form.append("AccountHolderName", payload.accountHolderName);
  if (payload.bankName) form.append("BankName", payload.bankName);
  if (payload.ifscCode) form.append("IfscCode", payload.ifscCode);
  if (payload.swiftCode) form.append("SwiftCode", payload.swiftCode);
  if (payload.accountNumber) form.append("AccountNumber", payload.accountNumber);
  if (payload.bankAddress) form.append("BankAddress", payload.bankAddress);
  if (payload.zohoSignEmail) form.append("ZohoSignEmail", payload.zohoSignEmail);
  if (payload.zohoClientId) form.append("ZohoClientId", payload.zohoClientId);
  if (payload.zohoClientSecret) form.append("ZohoClientSecret", payload.zohoClientSecret);
  if (payload.zohoCode) form.append("ZohoCode", payload.zohoCode);
  if (payload.zohoScope) form.append("ZohoScope", payload.zohoScope);
  if (payload.zohoDataCenter) form.append("ZohoDataCenter", payload.zohoDataCenter);
  if (payload.zohoAuthorizationEndpoint) form.append("ZohoAuthorizationEndpoint", payload.zohoAuthorizationEndpoint);
  if (payload.zohoTokenEndpoint) form.append("ZohoTokenEndpoint", payload.zohoTokenEndpoint);
  if (payload.zohoSignApiBaseUrl) form.append("ZohoSignApiBaseUrl", payload.zohoSignApiBaseUrl);
  if (payload.zohoRedirectUri) form.append("ZohoRedirectUri", payload.zohoRedirectUri);
  if (payload.zohoHomePage) form.append("ZohoHomePage", payload.zohoHomePage);
  if (payload.zohoRefreshToken) form.append("ZohoRefreshToken", payload.zohoRefreshToken);
  if (payload.tenant) form.append("Tenant", payload.tenant);
  if (payload.logoFile) form.append("LogoFile", payload.logoFile);
  if (payload.id) {
    form.append("Id", payload.id);
  }

  const url = payload.id ? `/organization/${payload.id}` : "/organization";
  const method = payload.id ? "put" : "post";

  const { data } = await apiClient[method as "post" | "put"]<OrganizationDto>(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapDtoToPayload(data);
}

export async function selectOrganization(id: string): Promise<void> {
  await apiClient.patch(`/organization/${id}/select`);
}


