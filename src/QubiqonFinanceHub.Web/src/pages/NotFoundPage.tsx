import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Btn } from "../components/ui";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "24px",
      }}
    >
      <div style={{ fontSize: "72px", fontWeight: 700, color: C.muted, opacity: 0.3, marginBottom: "8px" }}>
        404
      </div>
      <div style={{ fontSize: "18px", fontWeight: 600, color: C.primary, marginBottom: "6px" }}>
        Page not found
      </div>
      <div style={{ fontSize: "13px", color: C.muted, marginBottom: "20px", textAlign: "center" }}>
        The page you're looking for doesn't exist or has been moved.
      </div>
      <Btn v="primary" onClick={() => navigate("/")}>
        Go to Dashboard
      </Btn>
    </div>
  );
}
