import type { AppUser } from "../types";

export const USERS: AppUser[] = [
  { id: 1, name: "Arun Kumar", email: "arun.kumar@qubiqon.io", role: "employee", dept: "Engineering", av: "AK", employeeId: "" },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@qubiqon.io", role: "employee", dept: "Marketing", av: "PS", employeeId: "" },
  { id: 3, name: "Rajesh Nair", email: "rajesh.nair@qubiqon.io", role: "approver", dept: "Engineering", av: "RN", employeeId: "" },
  { id: 4, name: "Meera Iyer", email: "meera.iyer@qubiqon.io", role: "finance", dept: "Finance", av: "MI", employeeId: "" },
  { id: 5, name: "Vikram Menon", email: "vikram.menon@qubiqon.io", role: "employee", dept: "Sales", av: "VM", employeeId: "" },
  { id: 6, name: "Deepak Pillai", email: "deepak.pillai@qubiqon.io", role: "admin", dept: "IT", av: "DP", employeeId: "" },
  { id: 7, name: "Sibin John", email: "sibin.k@qubiqon.io", role: "approver", dept: "IT", av: "DP", employeeId: "" },
];

export function findUserByEmail(email: string): AppUser | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
