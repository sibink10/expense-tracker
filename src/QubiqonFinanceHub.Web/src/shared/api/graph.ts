import { apiClient } from "./client";

export interface GraphUser {
  id: string;
  displayName?: string | null;
  userPrincipalName?: string | null;
  mail?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  employeeId?: string | null;
}

export async function getGraphUsers(): Promise<GraphUser[]> {
  const { data } = await apiClient.get<GraphUser[]>("/graph/users");
  return data;
}
