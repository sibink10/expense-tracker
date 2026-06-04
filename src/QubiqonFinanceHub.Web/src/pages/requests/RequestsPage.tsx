import { Link } from "react-router-dom";
import { C } from "../../shared/theme";
import { PageShell } from "../../components/ui";

const requestCards = [
  { path: "/requests/forecasts", label: "Forecast requests", description: "View forecasts you have submitted." },
  { path: "/requests/expenses", label: "Expense requests", description: "View expense requests you have created." },
  { path: "/requests/advances", label: "Advance requests", description: "View advances requested by you." },
];

export default function RequestsPage() {
  return (
    <PageShell
      header={
        <div>
          <h1 style={{ margin: 0, color: C.text, fontSize: "24px", fontWeight: 600 }}>Requests</h1>
          <p style={{ margin: "8px 0 0", color: C.muted, maxWidth: "680px" }}>
            Access your personal forecast, expense, and advance request pages from one place.
          </p>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {requestCards.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: "22px",
              borderRadius: "14px",
              background: C.white,
              boxShadow: C.cardShadow,
              textDecoration: "none",
              color: C.text,
              minHeight: "130px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{item.label}</h2>
              <p style={{ margin: "10px 0 0", color: C.muted, lineHeight: 1.5 }}>{item.description}</p>
            </div>
            <span style={{ marginTop: "16px", fontSize: "13px", fontWeight: 600, color: C.primary }}>
              Open
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
