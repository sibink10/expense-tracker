import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Layout from "./Layout";
import DashPage from "./DashPage";
import ExpenseListPage from "./ExpenseListPage";
import ExpensePayPage from "./ExpensePayPage";
import AddExpensePage from "../pages/AddExpensePage";
import AdvanceListPage from "./AdvanceListPage";
import RequestAdvancePage from "../pages/RequestAdvancePage";
import BillListPage from "./BillListPage";
import SubmitBillPage from "../pages/SubmitBillPage";
import InvoicesPage from "./InvoicesPage";
import InvoiceAddPage from "./InvoiceAddPage";
import VendorsPage from "./VendorsPage";
import AddVendorPage from "../pages/AddVendorPage";
import ClientsPage from "./ClientsPage";
import AddClientPage from "../pages/AddClientPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import AdminOrgPage from "./AdminOrgPage";
import AdminTaxPage from "./AdminTaxPage";
import AdminGstPage from "./AdminGstPage";
import AdminEmailPage from "./AdminEmailPage";

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
      { path: "admin/org", element: <AdminOrgPage /> },
      { path: "admin/tax", element: <AdminTaxPage /> },
      { path: "admin/gst", element: <AdminGstPage /> },
      { path: "admin/email", element: <AdminEmailPage /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
