import { useState } from "react";
import AdvanceListPageContent from "../../components/advances/AdvanceListPageContent";
import ExpenseListPageContent from "../../components/expenses/ExpenseListPageContent";
import ForecastListPageContent from "../../components/forecasts/ForecastListPageContent";
import BillListPageContent from "../../components/bills/BillListPageContent";
import { C } from "../../shared/theme";
import { PageShell } from "../../components/ui";
import { BanknoteArrowUp, IndianRupee } from "lucide-react";

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
      header={
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: C.primary,
                fontFamily: "inherit",
                fontSize: "18px",
                fontWeight: 600,
                lineHeight: "100%",
                letterSpacing: "-0.02em",
              }}
            >
              <IndianRupee size={24} strokeWidth={1.8} color={C.primary} />
              Approvals
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              padding: "10px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              marginTop: "16px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "999px",
                  border:
                    activeTab === tab.key
                      ? `1px solid ${C.success}`
                      : "1px solid transparent",
                  background: activeTab === tab.key ? C.successBg : C.white,
                  color: activeTab === tab.key ? C.success : C.text,
                  fontWeight: activeTab === tab.key ? 700 : 600,
                  cursor: "pointer",
                  minWidth: "120px",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transition: "all 160ms ease",
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      }
    >
      <div style={{ minHeight: 0 }}>{renderActiveTab()}</div>
    </PageShell>
  );
}
