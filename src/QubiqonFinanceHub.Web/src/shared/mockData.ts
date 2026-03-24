import type { AppUser } from "../types";

export const USERS: AppUser[] = [
  { id: "1", name: "Arun Kumar", email: "arun.kumar@qubiqon.io", role: "employee", dept: "Engineering", av: "AK" },
  { id: "2", name: "Priya Sharma", email: "priya.sharma@qubiqon.io", role: "employee", dept: "Marketing", av: "PS" },
  { id: "3", name: "Rajesh Nair", email: "rajesh.nair@qubiqon.io", role: "approver", dept: "Engineering", av: "RN" },
  { id: "4", name: "Meera Iyer", email: "meera.iyer@qubiqon.io", role: "finance", dept: "Finance", av: "MI" },
  { id: "5", name: "Vikram Menon", email: "vikram.menon@qubiqon.io", role: "employee", dept: "Sales", av: "VM" },
  { id: "6", name: "Deepak Pillai", email: "deepak.pillai@qubiqon.io", role: "admin", dept: "IT", av: "DP" },
  { id: "7", name: "Sibin John", email: "sibin.k@qubiqon.io", role: "approver", dept: "IT", av: "DP" },
];

export function findUserByEmail(email: string): AppUser | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
