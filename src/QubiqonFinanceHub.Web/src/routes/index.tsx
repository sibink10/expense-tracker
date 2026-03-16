import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Layout from "./Layout";
import DashPage from "../pages/DashPage";
import ExpenseListPage from "../pages/ExpenseListPage";
import ExpensePayPage from "../pages/ExpensePayPage";
import AddExpensePage from "../pages/AddExpensePage";
import AdvanceListPage from "../pages/AdvanceListPage";
import RequestAdvancePage from "../pages/RequestAdvancePage";
import BillListPage from "../pages/BillListPage";
import SubmitBillPage from "../pages/SubmitBillPage";
import InvoicesPage from "../pages/InvoicesPage";
import InvoiceAddPage from "../pages/InvoiceAddPage";
import VendorsPage from "../pages/VendorsPage";
import AddVendorPage from "../pages/AddVendorPage";
import ClientsPage from "../pages/ClientsPage";
import AddClientPage from "../pages/AddClientPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import EmployeesPage from "../pages/EmployeesPage";
import AdminOrgViewPage from "../pages/AdminOrgViewPage";
import AdminOrgPage from "../pages/AdminOrgPage";
import AdminTaxPage from "../pages/AdminTaxPage";
import AdminGstPage from "../pages/AdminGstPage";
import AdminEmailPage from "../pages/AdminEmailPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";

function DashOrRedirect() {
  return <DashPage />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashOrRedirect /> },
      { path: "expenses", element: <ExpenseListPage /> },
      { path: "expenses/add", element: <AddExpensePage /> },
      { path: "expenses/pay", element: <ExpensePayPage /> },
      { path: "advances", element: <AdvanceListPage /> },
      { path: "advances/add", element: <RequestAdvancePage /> },
      { path: "bills", element: <BillListPage /> },
      { path: "bills/add", element: <SubmitBillPage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "vendors/add", element: <AddVendorPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "invoices/add", element: <InvoiceAddPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/add", element: <AddClientPage /> },
      { path: "admin", element: <AdminSettingsPage /> },
      { path: "employees", element: <EmployeesPage /> },
      { path: "admin/org", element: <AdminOrgViewPage /> },
      { path: "admin/org/edit", element: <AdminOrgPage /> },
      { path: "admin/org/edit/:id", element: <AdminOrgPage /> },
      { path: "admin/tax", element: <AdminTaxPage /> },
      { path: "admin/gst", element: <AdminGstPage /> },
      { path: "admin/categories", element: <AdminCategoriesPage /> },
      { path: "admin/email", element: <AdminEmailPage /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
