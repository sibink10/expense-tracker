import { apiClient } from "./client";
import { ROLES } from "../constants";

export interface ApiEmployee {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  dept?: string;
  designation?: string;
  employeeCode?: string | null;
  isActive?: boolean;
  organizationId?: string;
  organizationName?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  dept: string;
  designation?: string;
  employeeCode?: string | null;
  isActive?: boolean;
  organizationId?: string;
  organizationName?: string | null;
}

export interface EmployeeRole {
  id: number;
  code: string;
  displayName: string;
}

function mapApiEmployeeToApp(item: ApiEmployee): Employee {
  return {
    id: item.id,
    name: item.fullName ?? item.name ?? "",
    email: item.email ?? "",
    role: item.role ?? "",
    dept: item.department ?? item.dept ?? "",
    designation: item.designation,
    employeeCode: item.employeeCode ?? null,
    isActive: item.isActive ?? true,
    organizationId: item.organizationId,
    organizationName: item.organizationName ?? null,
  };
}

export interface ApiEmployeesResponse {
  items: ApiEmployee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
  role?: string;
}

export async function getEmployeesRaw(params: GetEmployeesParams = {}): Promise<ApiEmployeesResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    SortBy: params.sortBy,
    Desc: params.desc,
    Role: params.role,
  };

  const { data } = await apiClient.get<ApiEmployee[] | ApiEmployeesResponse>("/employees", {
    params: apiParams,
  });

  if (Array.isArray(data)) {
    const items = data;
    return {
      items,
      totalCount: items.length,
      page: params.page ?? 1,
      pageSize: params.pageSize || items.length || 10,
      totalPages: 1,
      hasNext: false,
    };
  }

  return data as ApiEmployeesResponse;
}

export async function getEmployees(params: GetEmployeesParams = {}): Promise<{
  items: Employee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}> {
  const res = await getEmployeesRaw(params);
  return {
    ...res,
    items: res.items.map(mapApiEmployeeToApp),
  };
}

export async function getEmployeeRoles(): Promise<EmployeeRole[]> {
  const { data } = await apiClient.get<EmployeeRole[]>("/employees/roles");
  return data;
}

export interface SaveEmployeePayload {
  id?: string;
  entraObjectId?: string | null;
  name: string;
  email: string;
  role: string;
  dept: string;
  designation?: string;
  employeeCode?: string | null;
}

export async function saveEmployee(payload: SaveEmployeePayload): Promise<Employee> {
  const body = {
    // API expects this shape:
    // { fullName, email, department, designation, employeeCode, role }
    entraObjectId: payload.entraObjectId ?? undefined,
    fullName: payload.name,
    email: payload.email,
    department: payload.dept,
    designation: payload.designation,
    employeeCode: payload.employeeCode ?? undefined,
    role: payload.role,
  };
  if (payload.id) {
    const { data } = await apiClient.put<ApiEmployee>(`/employees/${payload.id}`, body);
    return mapApiEmployeeToApp(data);
  }
  const { data } = await apiClient.post<ApiEmployee>("/employees", body);
  return mapApiEmployeeToApp(data);
}

export async function toggleEmployee(id: string): Promise<Employee> {
  const { data } = await apiClient.post<ApiEmployee>(`/employees/${id}/toggle`);
  return mapApiEmployeeToApp(data);
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.patch(`/employees/${id}/delete`);
}

/** Employees with role "employee" only (for on-behalf dropdowns). */
export async function getEmployeeRoleEmployees(): Promise<Employee[]> {
  const all = await getEmployees();
  return all.items.filter((e) => (e.role || "").toLowerCase() === ROLES.EMPLOYEE);
}

export interface EntraSyncStartResponse {
  jobId: string;
  status: string;
}

export interface EntraSyncJob {
  jobId: string;
  status: string;
  totalUsers?: number | null;
  processedUsers: number;
  created: number;
  updated: number;
  skipped: number;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export async function startEntraSync(): Promise<EntraSyncStartResponse> {
  const { data } = await apiClient.post<EntraSyncStartResponse>("/employees/sync-from-entra");
  return data;
}

export async function getEntraSyncJob(jobId: string): Promise<EntraSyncJob> {
  const { data } = await apiClient.get<EntraSyncJob>(`/employees/sync-from-entra/jobs/${jobId}`);
  return data;
}

const ENTRA_SYNC_POLL_MS = 2000;

export async function pollEntraSyncJob(
  jobId: string,
  onProgress?: (job: EntraSyncJob) => void
): Promise<EntraSyncJob> {
  for (;;) {
    const job = await getEntraSyncJob(jobId);
    onProgress?.(job);
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((r) => setTimeout(r, ENTRA_SYNC_POLL_MS));
  }
}
