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
}

function mapApiEmployeeToApp(item: ApiEmployee): Employee {
  return {
    id: item.id,
    name: item.fullName ?? item.name ?? "",
    email: item.email ?? "",
    role: item.role ?? "",
    dept: item.department ?? item.dept ?? "",
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiEmployee[] | { items: ApiEmployee[] }>("/employees");
  const items = Array.isArray(data) ? data : (data as { items: ApiEmployee[] })?.items ?? [];
  return items.map(mapApiEmployeeToApp);
}

/** Employees with role "employee" only (for on-behalf dropdowns). */
export async function getEmployeeRoleEmployees(): Promise<Employee[]> {
  const all = await getEmployees();
  return all.filter((e) => (e.role || "").toLowerCase() === "employee");
}
