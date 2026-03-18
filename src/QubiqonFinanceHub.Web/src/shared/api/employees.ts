import { apiClient } from "./client";

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
}

export async function getEmployeesRaw(params: GetEmployeesParams = {}): Promise<ApiEmployeesResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
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

export interface SaveEmployeePayload {
  id?: string;
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
  return all.items.filter((e) => (e.role || "").toLowerCase() === "employee");
}
