import { useState } from "react";
import AdvanceListPageContent from "../../components/advances/AdvanceListPageContent";
import ExpenseListPageContent from "../../components/expenses/ExpenseListPageContent";
import ForecastListPageContent from "../../components/forecasts/ForecastListPageContent";
import BillListPageContent from "../../components/bills/BillListPageContent";
import { C } from "../../shared/theme";
import { PageShell } from "../../components/ui";
import "../../components/list-toolbar/list-toolbar.css";
import { IndianRupee } from "lucide-react";

const tabs = [
  { key: "forecasts", label: "Forecasts" },
  { key: "expenses", label: "Expenses" },
  { key: "advances", label: "Advances" },
  { key: "bills", label: "Vendor Bills" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function PayableRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("forecasts");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "expenses":
        return <ExpenseListPageContent pendingOnly hideHeader />;
      case "advances":
        return <AdvanceListPageContent pendingOnly hideHeader />;
      case "bills":
        return <BillListPageContent pendingOnly hideHeader />;
      default:
        return <ForecastListPageContent pendingOnly hideHeader />;
    }
  };

  return (
    <PageShell
      className="page-shell--payable-approvals"
      header={
        <div className="payable-approvals-header">
          <h1 className="payable-approvals-title list-page-header__title">
            <IndianRupee size={24} strokeWidth={1.8} color={C.primary} />
            Approvals
          </h1>
          <div className="payable-approvals-tabs" role="tablist" aria-label="Approval categories">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`payable-approvals-tab${activeTab === tab.key ? " payable-approvals-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="payable-approvals-body">
        {renderActiveTab()}
      </div>
    </PageShell>
  );
}
