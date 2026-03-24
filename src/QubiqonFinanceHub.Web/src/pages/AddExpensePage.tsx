import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Av, MultiFileUp, Alert } from "../components/ui";
import { AsyncSelectInput } from "../components/AsyncSelectInput";
import { useAppContext } from "../context/AppContext";
import { createExpenseForm } from "../shared/api/expense";
import { getEmployees } from "../shared/api/employees";

const GRID_BREAKPOINT = 600;

export default function AddExpensePage() {
  const navigate = useNavigate();
  const { user, setEmail, t, is } = useAppContext();
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);

  const [amt, setAmt] = useState("");
  const [pur, setPur] = useState("");
  const [billDate, setBillDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [ob, setOb] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadEmployeeOptions = async (query: string) => {
    const res = await getEmployees({ page: 1, pageSize: 20, search: query || undefined });
    return res.items.map((e) => ({
      value: e.id,
      label: `${e.name}${e.dept ? ` (${e.dept})` : ""}`,
    }));
  };

  const submit = async () => {
    const employeeId = is("finance") ? ob.trim() || null : null;
    const displayName = user.name;
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0 || !pur.trim() || !billDate) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("amount", String(amount));
      formData.append("purpose", pur.trim());
      formData.append("billDate", billDate);
      if (employeeId) formData.append("onBehalfOfEmployeeId", employeeId);
      files.forEach((file) => formData.append("BillImages", file));
      await createExpenseForm(formData);
      setEmail({ to: "Approvers", subj: `New expense request from ${displayName}` });
      t("Expense submitted");
      navigate("/expenses");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };
  const cellStyle = { marginBottom: 0 };
  const canSubmit =
    amt.trim() !== "" &&
    pur.trim() !== "" &&
    billDate !== "" &&
    !loading;

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>Add expense</h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {!is("finance") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              background: C.surface,
              borderRadius: "8px",
              marginBottom: "14px",
            }}
          >
            <Av n={user.name} sz={32} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{user.dept}</div>
            </div>
          </div>
        )}

        <div style={gridStyle}>
          {is("finance") && (
            <AsyncSelectInput
              label="On behalf of"
              value={ob}
              onChange={setOb}
              loadOptions={loadEmployeeOptions}
              disabled={loading}
              placeholder="Select employee..."
              req={false}
            />
          )}
          <Inp
            label="Amount (₹)"
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            req
            min="1"
            ph="15000"
            style={cellStyle}
          />
          <Inp
            label="Bill date"
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            req
            style={cellStyle}
          />
        </div>

        <Inp
          label="Purpose"
          type="textarea"
          value={pur}
          onChange={(e) => setPur(e.target.value)}
          req
          ph="Describe..."
          style={{ marginTop: "14px" }}
        />
        <MultiFileUp files={files} onChange={setFiles} title="Attachments" />
        <div style={{ fontSize: "11px", color: C.muted, marginTop: "-6px", marginBottom: "14px" }}>
          Cash reimbursement is disbursed only after the expense is approved and the bill is uploaded.
        </div>
        {error && <Alert sx={{ marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={submit} disabled={!canSubmit}>
            {loading ? "Submitting..." : "Submit"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
