import RejectModal from "./requests/RejectModal";
import PayModal from "./payments/PayModal";
import InvPayModal from "./invoices/InvPayModal";
import ExpenseApproveModal from "./expenses/ExpenseApproveModal";
import AdvanceApproveModal from "./advances/AdvanceApproveModal";
import RequestAdvanceModal from "./advances/RequestAdvanceModal";
import BillApproveModal from "./bills/BillApproveModal";
import BillEditModal from "./bills/BillEditModal";
import AdvanceDisburseModal from "./advances/AdvanceDisburseModal";
import VendorEditModal from "./vendors/VendorEditModal";
import ClientEditModal from "./clients/ClientEditModal";
import TaxConfigAddModal from "./admin/tax/TaxConfigAddModal";
import TaxConfigEditModal from "./admin/tax/TaxConfigEditModal";
import CancelRequestConfirmModal from "./requests/CancelRequestConfirmModal";
import ExpenseDetailModal from "./expenses/ExpenseDetailModal";
import AdvanceDetailModal from "./advances/AdvanceDetailModal";
import BillDetailModal from "./bills/BillDetailModal";
import InvoiceDetailModal from "./invoices/InvoiceDetailModal";
import VendorDetailModal from "./vendors/VendorDetailModal";
import ClientDetailModal from "./clients/ClientDetailModal";
import TaxConfigDetailModal from "./admin/tax/TaxConfigDetailModal";
import { useAppContext } from "../context/AppContext";
import type { Expense, Advance, Bill, Invoice, Vendor, Client, TaxConfig } from "../types";

export default function Modals() {
  const { mdl, advs } = useAppContext();

  if (!mdl) return null;

  if (mdl.t === "exp-cancel-confirm" || mdl.t === "adv-cancel-confirm") {
    return <CancelRequestConfirmModal />;
  }
  if (mdl.t === "reject") return <RejectModal />;
  if (mdl.t === "pay") return <PayModal />;
  if (mdl.t === "inv-pay") return <InvPayModal />;
  if (mdl.t === "exp-approve") return <ExpenseApproveModal />;
  if (mdl.t === "adv-request") return <RequestAdvanceModal />;
  if (mdl.t === "adv-approve") return <AdvanceApproveModal />;
  if (mdl.t === "bill-approve") return <BillApproveModal />;
  if (mdl.t === "bill-edit") return <BillEditModal />;
  if (mdl.t === "adv-disburse") return <AdvanceDisburseModal />;
  if (mdl.t === "vendor-edit") return <VendorEditModal />;
  if (mdl.t === "client-edit") return <ClientEditModal />;
  if (mdl.t === "tax-config-add") return <TaxConfigAddModal />;
  if (mdl.t === "tax-config-edit") return <TaxConfigEditModal />;

  if (mdl.t === "exp-detail" && mdl.d && "empName" in mdl.d && "reqBy" in mdl.d) {
    return <ExpenseDetailModal expense={mdl.d as Expense} />;
  }

  if (mdl.t === "adv-detail" && mdl.d && "empName" in mdl.d && "purpose" in mdl.d && !("reqBy" in mdl.d)) {
    const a = mdl.d as Advance;
    const hist = advs.filter(
      (x) =>
        x.id !== a.id &&
        ((x.employeeId && a.employeeId && x.employeeId === a.employeeId) ||
          (x.empId && a.empId && x.empId === a.empId)),
    );
    return <AdvanceDetailModal advance={a} previousAdvances={hist} />;
  }

  if (mdl.t === "bill-detail" && mdl.d && "vName" in mdl.d) {
    return <BillDetailModal bill={mdl.d as Bill} />;
  }

  if (mdl.t === "inv-detail" && mdl.d && "cName" in mdl.d) {
    return <InvoiceDetailModal invoice={mdl.d as Invoice} />;
  }

  if (mdl.t === "vendor-detail" && mdl.d && "gstin" in mdl.d) {
    return <VendorDetailModal vendor={mdl.d as Vendor} />;
  }

  if (mdl.t === "client-detail" && mdl.d && "contact" in mdl.d) {
    return <ClientDetailModal client={mdl.d as Client} />;
  }

  if (mdl.t === "tax-config-detail" && mdl.d && "name" in mdl.d && "rate" in mdl.d) {
    return <TaxConfigDetailModal tax={mdl.d as TaxConfig} />;
  }

  return null;
}
