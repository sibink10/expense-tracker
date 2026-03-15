import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Av, FileUp } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { createExpense } from "../shared/api/expense";
import { getEmployeeRoleEmployees } from "../shared/api/employees";
import type { Employee } from "../shared/api/employees";

export default function AddExpensePage() {
  const navigate = useNavigate();
  const { user, setEmail, t, is } = useAppContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [amt, setAmt] = useState("");
  const [pur, setPur] = useState("");
  const [rq, setRq] = useState("");
  const [fi, setFi] = useState<{ n: string; s: string } | null>(null);
  const [ob, setOb] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (is("finance")) {
      getEmployeeRoleEmployees()
        .then(setEmployees)
        .catch(() => setEmployees([]))
        .finally(() => setEmployeesLoading(false));
    } else {
      setEmployeesLoading(false);
    }
  }, [is]);

  const submit = async () => {
    const selectedEmp = ob ? employees.find((e) => e.id === ob) : null;
    const employeeId = selectedEmp ? selectedEmp.id : user.employeeId?.trim() || null;
    const displayName = selectedEmp ? selectedEmp.name : user.name;
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0) return;
    if (is("finance") && !ob) return;
    setLoading(true);
    setError(null);
    try {
      await createExpense({
        amount,
        purpose: pur,
        requiredByDate: rq ? new Date(rq).toISOString() : new Date().toISOString(),
        onBehalfOfEmployeeId: employeeId,
      });
      setEmail({ to: "Approvers", subj: `New expense request from ${displayName}` });
      t("Expense submitted");
      navigate("/expenses");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>Add expense</h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        {is("finance") && (
          <Inp
            label="On behalf of"
            type="select"
            value={ob}
            onChange={(e) => setOb(e.target.value)}
            req
            opts={[
              { v: "", l: employeesLoading ? "Loading..." : "Select employee..." },
              ...employees.map((e) => ({
                v: e.id,
                l: `${e.name} (${e.dept})`,
              })),
            ]}
          />
        )}
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
        <Inp
          label="Amount (₹)"
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          req
          min="1"
          ph="15000"
        />
        <Inp
          label="Purpose"
          type="textarea"
          value={pur}
          onChange={(e) => setPur(e.target.value)}
          req
          ph="Describe..."
        />
        <Inp
          label="Required by"
          type="date"
          value={rq}
          onChange={(e) => setRq(e.target.value)}
          req
        />
        <FileUp file={fi} onChange={setFi} />
        <div
          style={{
            fontSize: "11px",
            color: C.muted,
            padding: "8px 12px",
            background: C.surface,
            borderRadius: "6px",
            marginBottom: "14px",
          }}
        >
          💡 No bill attached = approval only. Payment after bill submission.
        </div>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: C.dangerBg,
              color: C.danger,
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}
        <Btn
          onClick={submit}
          disabled={!amt || !pur || !rq || (is("finance") && !ob) || loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Btn>
      </div>
    </div>
  );
}
