import type { AppUser } from "../types";
import { ROLES } from "./constants";

export const USERS: AppUser[] = [
  { id: "1", name: "Arun Kumar", email: "arun.kumar@qubiqon.io", role: ROLES.EMPLOYEE, dept: "Engineering", av: "AK" },
  { id: "2", name: "Priya Sharma", email: "priya.sharma@qubiqon.io", role: ROLES.EMPLOYEE, dept: "Marketing", av: "PS" },
  { id: "3", name: "Rajesh Nair", email: "rajesh.nair@qubiqon.io", role: ROLES.APPROVER, dept: "Engineering", av: "RN" },
  { id: "4", name: "Meera Iyer", email: "meera.iyer@qubiqon.io", role: ROLES.FINANCE, dept: "Finance", av: "MI" },
  { id: "5", name: "Vikram Menon", email: "vikram.menon@qubiqon.io", role: ROLES.EMPLOYEE, dept: "Sales", av: "VM" },
  { id: "6", name: "Deepak Pillai", email: "deepak.pillai@qubiqon.io", role: ROLES.ADMIN, dept: "IT", av: "DP" },
  { id: "7", name: "Sibin John", email: "sibin.k@qubiqon.io", role: ROLES.APPROVER, dept: "IT", av: "DP" },
];

export function findUserByEmail(email: string): AppUser | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
