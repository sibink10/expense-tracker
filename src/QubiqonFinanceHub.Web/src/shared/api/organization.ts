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
  Tenant?: string;
  tenant?: string;
  Selected?: boolean;
  selected?: boolean;
  LogoUrl?: string | null;
  logoUrl?: string | null;
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
  tenant?: string;
  selected?: boolean;
  logoUrl?: string | null;
  logoFile?: File | null;
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
    tenant: (anyDto.Tenant as string) ?? (anyDto.tenant as string),
    selected: (anyDto.Selected as boolean) ?? (anyDto.selected as boolean),
    logoUrl: (anyDto.LogoUrl as string) ?? (anyDto.logoUrl as string) ?? null,
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


