import RejectModal from "./requests/RejectModal";
import PayModal from "./payments/PayModal";
import InvPayModal from "./invoices/InvPayModal";
import ExpenseApproveModal from "./expenses/ExpenseApproveModal";
import AdvanceApproveModal from "./advances/AdvanceApproveModal";
import RequestAdvanceModal from "./advances/RequestAdvanceModal";
import EditAdvanceModal from "./advances/EditAdvanceModal";
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
import { MODAL_T } from "../shared/constants";

export default function Modals() {
  const { mdl, advs } = useAppContext();

  if (!mdl) return null;

  if (
    mdl.t === MODAL_T.EXP_CANCEL_CONFIRM ||
    mdl.t === MODAL_T.ADV_CANCEL_CONFIRM ||
    mdl.t === MODAL_T.FORECAST_CANCEL_CONFIRM
  ) {
    return <CancelRequestConfirmModal />;
  }
  if (mdl.t === MODAL_T.REJECT) return <RejectModal />;
  if (mdl.t === MODAL_T.PAY) return <PayModal />;
  if (mdl.t === MODAL_T.INV_PAY) return <InvPayModal />;
  if (mdl.t === MODAL_T.EXP_APPROVE) return <ExpenseApproveModal />;
  if (mdl.t === MODAL_T.ADV_REQUEST) return <RequestAdvanceModal />;
  if (mdl.t === MODAL_T.ADV_EDIT) return <EditAdvanceModal />;
  if (mdl.t === MODAL_T.ADV_APPROVE) return <AdvanceApproveModal />;
  if (mdl.t === MODAL_T.BILL_APPROVE) return <BillApproveModal />;
  if (mdl.t === MODAL_T.BILL_EDIT) return <BillEditModal />;
  if (mdl.t === MODAL_T.ADV_DISBURSE) return <AdvanceDisburseModal />;
  if (mdl.t === MODAL_T.VENDOR_EDIT) return <VendorEditModal />;
  if (mdl.t === MODAL_T.CLIENT_EDIT) return <ClientEditModal />;
  if (mdl.t === MODAL_T.TAX_CONFIG_ADD) return <TaxConfigAddModal />;
  if (mdl.t === MODAL_T.TAX_CONFIG_EDIT) return <TaxConfigEditModal />;

  if (mdl.t === MODAL_T.EXP_DETAIL && mdl.d && "empName" in mdl.d && "reqBy" in mdl.d) {
    return <ExpenseDetailModal expense={mdl.d as Expense} />;
  }

  if (mdl.t === MODAL_T.ADV_DETAIL && mdl.d && "empName" in mdl.d && "purpose" in mdl.d && !("reqBy" in mdl.d)) {
    const a = mdl.d as Advance;
    const hist = advs.filter(
      (x) =>
        x.id !== a.id &&
        ((x.employeeId && a.employeeId && x.employeeId === a.employeeId) ||
          (x.empId && a.empId && x.empId === a.empId)),
    );
    return <AdvanceDetailModal advance={a} previousAdvances={hist} />;
  }

  if (mdl.t === MODAL_T.BILL_DETAIL && mdl.d && "vName" in mdl.d) {
    return <BillDetailModal bill={mdl.d as Bill} />;
  }

  if (mdl.t === MODAL_T.INV_DETAIL && mdl.d && "cName" in mdl.d) {
    return <InvoiceDetailModal invoice={mdl.d as Invoice} />;
  }

  if (mdl.t === MODAL_T.VENDOR_DETAIL && mdl.d && "gstin" in mdl.d) {
    return <VendorDetailModal vendor={mdl.d as Vendor} />;
  }

  if (mdl.t === MODAL_T.CLIENT_DETAIL && mdl.d && "contact" in mdl.d) {
    return <ClientDetailModal client={mdl.d as Client} />;
  }

  if (mdl.t === MODAL_T.TAX_CONFIG_DETAIL && mdl.d && "name" in mdl.d && "rate" in mdl.d) {
    return <TaxConfigDetailModal tax={mdl.d as TaxConfig} />;
  }

  return null;
}
