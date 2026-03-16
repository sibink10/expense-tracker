import { apiClient } from "./client";

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CreateCategoryPayload {
  name: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[] | { items: Category[] }>("/categories");
  const items = Array.isArray(data) ? data : (data as { items: Category[] })?.items ?? [];
  return items;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const { data } = await apiClient.post<Category>("/categories", payload);
  return data;
}

export async function toggleCategory(id: string): Promise<void> {
  await apiClient.post(`/categories/${id}/toggle`);
}

