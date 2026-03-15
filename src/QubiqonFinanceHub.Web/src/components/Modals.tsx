import RejectModal from "../modals/RejectModal";
import PayModal from "../modals/PayModal";
import InvPayModal from "../modals/InvPayModal";
import ExpenseApproveModal from "../modals/ExpenseApproveModal";
import AdvanceApproveModal from "../modals/AdvanceApproveModal";
import BillApproveModal from "../modals/BillApproveModal";
import AdvanceDisburseModal from "../modals/AdvanceDisburseModal";
import VendorEditModal from "../modals/VendorEditModal";
import ClientEditModal from "../modals/ClientEditModal";
import ExpenseDetailModal from "./modals/ExpenseDetailModal";
import AdvanceDetailModal from "./modals/AdvanceDetailModal";
import BillDetailModal from "./modals/BillDetailModal";
import InvoiceDetailModal from "./modals/InvoiceDetailModal";
import VendorDetailModal from "./modals/VendorDetailModal";
import ClientDetailModal from "./modals/ClientDetailModal";
import { useAppContext } from "../context/AppContext";
import type { Expense, Advance, Bill, Invoice, Vendor, Client } from "../types";

export default function Modals() {
  const { mdl, advs } = useAppContext();

  if (!mdl) return null;

  if (mdl.t === "reject") return <RejectModal />;
  if (mdl.t === "pay") return <PayModal />;
  if (mdl.t === "inv-pay") return <InvPayModal />;
  if (mdl.t === "exp-approve") return <ExpenseApproveModal />;
  if (mdl.t === "adv-approve") return <AdvanceApproveModal />;
  if (mdl.t === "bill-approve") return <BillApproveModal />;
  if (mdl.t === "adv-disburse") return <AdvanceDisburseModal />;
  if (mdl.t === "vendor-edit") return <VendorEditModal />;
  if (mdl.t === "client-edit") return <ClientEditModal />;

  if (mdl.t === "exp-detail" && mdl.d && "empName" in mdl.d && "reqBy" in mdl.d) {
    return <ExpenseDetailModal expense={mdl.d as Expense} />;
  }

  if (mdl.t === "adv-detail" && mdl.d && "empName" in mdl.d && "purpose" in mdl.d && !("reqBy" in mdl.d)) {
    const a = mdl.d as Advance;
    const hist = advs.filter((x) => x.empId === a.empId && x.id !== a.id);
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

  return null;
}
