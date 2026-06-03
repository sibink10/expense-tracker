import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Layout from "./Layout";
import DashPage from "../pages/dashboard/DashPage";
import ExpenseListPage from "../pages/expenses/ExpenseListPage";
import ExpensePayPage from "../pages/expenses/ExpensePayPage";
import AddExpensePage from "../pages/expenses/AddExpensePage";
import ForecastListPage from "../pages/forecasts/ForecastListPage";
import AddForecastPage from "../pages/forecasts/AddForecastPage";
import ForecastDetailPage from "../pages/forecasts/ForecastDetailPage";
import AdvanceListPage from "../pages/advances/AdvanceListPage";
import BillListPage from "../pages/bills/BillListPage";
import SubmitBillPage from "../pages/bills/SubmitBillPage";
import InvoicesPage from "../pages/invoices/InvoicesPage";
import InvoiceAddPage from "../pages/invoices/InvoiceAddPage";
import InvoiceEditPage from "../pages/invoices/InvoiceEditPage";
import VendorsPage from "../pages/vendors/VendorsPage";
import AddVendorPage from "../pages/vendors/AddVendorPage";
import ClientsPage from "../pages/clients/ClientsPage";
import AddClientPage from "../pages/clients/AddClientPage";
import AdminSettingsPage from "../pages/admin/settings/AdminSettingsPage";
import EmployeesPage from "../pages/employees/EmployeesPage";
import AdminOrgViewPage from "../pages/admin/org/AdminOrgViewPage";
import AdminOrgPage from "../pages/admin/org/AdminOrgPage";
import AdminTaxPage from "../pages/admin/tax/AdminTaxPage";
import AdminGstPage from "../pages/admin/gst/AdminGstPage";
import AdminEmailPage from "../pages/admin/email/AdminEmailPage";
import AdminCategoriesPage from "../pages/admin/categories/AdminCategoriesPage";
import AdminPaymentTermsPage from "../pages/admin/payment-terms/AdminPaymentTermsPage";
import AdminAccountsPage from "../pages/admin/accounts/AdminAccountsPage";
import ZohoSignPage from "../pages/admin/zoho-sign/ZohoSignPage";
import NotFoundPage from "../pages/not-found/NotFoundPage";
import RequestsForecastsPage from "../pages/requests/RequestsForecastsPage";
import RequestsExpensesPage from "../pages/requests/RequestsExpensesPage";
import RequestsAdvancesPage from "../pages/requests/RequestsAdvancesPage";
import PayableRequestsPage from "../pages/payable/PayableRequestsPage";

function DashOrRedirect() {
  return <DashPage />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DashOrRedirect /> },
      { path: "forecasts", element: <ForecastListPage /> },
      { path: "forecasts/add", element: <AddForecastPage /> },
      { path: "forecasts/:id", element: <ForecastDetailPage /> },
      { path: "forecasts/:id/edit", element: <AddForecastPage /> },
      { path: "expenses", element: <ExpenseListPage /> },
      { path: "expenses/add", element: <AddExpensePage /> },
      { path: "expenses/pay", element: <ExpensePayPage /> },
      { path: "advances", element: <AdvanceListPage /> },
      { path: "payable/approvals", element: <PayableRequestsPage /> },
      { path: "requests/forecasts", element: <RequestsForecastsPage /> },
      { path: "requests/expenses", element: <RequestsExpensesPage /> },
      { path: "requests/advances", element: <RequestsAdvancesPage /> },
      { path: "bills", element: <BillListPage /> },
      { path: "bills/add", element: <SubmitBillPage /> },
      { path: "vendors", element: <VendorsPage /> },
      { path: "vendors/add", element: <AddVendorPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "invoices/add", element: <InvoiceAddPage /> },
      { path: "invoices/edit/:id", element: <InvoiceEditPage /> },
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
      { path: "admin/payment-terms", element: <AdminPaymentTermsPage /> },
      { path: "admin/accounts", element: <AdminAccountsPage /> },
      { path: "admin/email", element: <AdminEmailPage /> },
      { path: "admin/zoho-sign", element: <ZohoSignPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
