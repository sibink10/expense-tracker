import { useState, useEffect } from "react";
import { ReceiptText, Send, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C, R } from "../../shared/theme";
import { Inp, Btn, Av, MultiFileUp, Alert, PageShell } from "../ui";
import { AsyncSelectInput } from "../AsyncSelectInput";
import { useAppContext } from "../../context/AppContext";
import { createExpenseForm } from "../../shared/api/expense";
import { getApprovedForecasts } from "../../shared/api/forecast";
import { getEmployees } from "../../shared/api/employees";
import { ROLES } from "../../shared/constants";
import type { ForecastSummary } from "../../types";
import { Mdl } from "../ui";

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
  const [expenseType, setExpenseType] = useState<"adHoc" | "forecast">("adHoc");
  const [forecasts, setForecasts] = useState<ForecastSummary[]>([]);
  const [forecastId, setForecastId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    getApprovedForecasts()
      .then((items) => {
        if (alive) setForecasts(items);
      })
      .catch(() => {
        if (alive) setForecasts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const loadEmployeeOptions = async (query: string) => {
    const res = await getEmployees({ page: 1, pageSize: 20, search: query || undefined });
    return res.items.map((e) => ({
      value: e.id,
      label: `${e.name}${e.dept ? ` (${e.dept})` : ""}`,
    }));
  };

  const validate = () => {
    const employeeId = is(ROLES.FINANCE) ? ob.trim() || null : null;
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0 || !pur.trim() || !billDate) return null;
    return { employeeId, amount };
  };

  const openConfirm = () => {
    setError(null);
    const valid = validate();
    if (!valid) {
      setError("Please fill all required fields");
      return;
    }
    setConfirmOpen(true);
  };

  const submit = async () => {
    const valid = validate();
    if (!valid) return;
    const { employeeId, amount } = valid;
    const displayName = user.name;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("amount", String(amount));
      formData.append("purpose", pur.trim());
      formData.append("billDate", billDate);
      if (employeeId) formData.append("onBehalfOfEmployeeId", employeeId);
      if (expenseType === "forecast" && forecastId) formData.append("forecastId", forecastId);
      files.forEach((file) => formData.append("BillImages", file));
      await createExpenseForm(formData);
      setConfirmOpen(false);
      setEmail({ to: "Approvers", subj: `New expense request from ${displayName}` });
      t("Expense submitted");
      navigate("/requests/expenses");
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
  const controlStyle = { borderRadius: R.control };
  const canSubmit =
    amt.trim() !== "" &&
    pur.trim() !== "" &&
    billDate !== "" &&
    (expenseType === "adHoc" || forecastId !== "") &&
    !loading;

  const selectedForecast = forecasts.find((forecast) => forecast.id === forecastId) ?? null;
  const expenseAmount = parseFloat(amt) || 0;
  const overForecast = expenseType === "forecast" && selectedForecast !== null && expenseAmount > selectedForecast.expectedAmount;

  return (
    <PageShell
      header={
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.text,
            fontFamily: "'Manrope', sans-serif",
            fontSize: narrow ? "18px" : "24px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: "100%",
            margin: 0,
          }}
        >
          <ReceiptText size={narrow ? 18 : 22} color={C.text} strokeWidth={1.8} />
          Add expense
        </h1>
      }
    >
      <div
        style={{
          background: "#fff",
          borderRadius: R.control,
          padding: narrow ? "16px" : "20px",
          paddingTop:"20px",
          width: "100%",
          boxSizing: "border-box",
          marginTop: "20px",
        }}
      >
        {!is(ROLES.FINANCE) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              background: C.surface,
              borderRadius: R.control,
              marginBottom: "14px",
            }}
          >
            <Av n={user.name} sz={narrow ? 30 : 32} bg={C.successBg} color={C.success} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{user.dept}</div>
            </div>
          </div>
        )}

        <div style={gridStyle}>
          <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "4px" }}>
              Expense type <span style={{ color: C.accent }}>*</span>
            </label>
            <div style={{ display: "inline-flex", gap: "2px", background: C.surface, borderRadius: R.control, padding: "2px", minHeight: "34px" }}>
              {[
                { key: "adHoc" as const, label: "Ad-Hoc Expense" },
                { key: "forecast" as const, label: "Forecast Expense" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setExpenseType(item.key);
                    if (item.key === "adHoc") setForecastId("");
                  }}
                  style={{
                    minHeight: "30px",
                    padding: "6px 12px",
                    borderRadius: R.control,
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: expenseType === item.key ? "#fff" : "transparent",
                    color: expenseType === item.key ? C.primary : C.muted,
                    boxShadow: expenseType === item.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {expenseType === "forecast" && (
            <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
              <Inp
                label="Approved forecast"
                type="select"
                value={forecastId}
                onChange={(e) => setForecastId(e.target.value)}
                req
                opts={forecasts.map((forecast) => ({ v: forecast.id, l: `${forecast.title} · ₹${forecast.expectedAmount.toLocaleString("en-IN")}` }))}
                controlSx={controlStyle}
              />
              {selectedForecast && (
                <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(3, 1fr)", gap: "10px", padding: "12px", background: C.surface, borderRadius: R.control, marginTop: "-8px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, fontWeight: 700 }}>Title</div>
                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 600 }}>{selectedForecast.title}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, fontWeight: 700 }}>Expected amount</div>
                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 600 }}>₹{selectedForecast.expectedAmount.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: C.muted, fontWeight: 700 }}>Expected date</div>
                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 600 }}>{selectedForecast.expectedExpenseDate}</div>
                  </div>
                  <div style={{ gridColumn: narrow ? "auto" : "1 / -1", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <Target size={14} color={C.accent} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div style={{ fontSize: "11px", color: C.muted }}>{selectedForecast.purpose} · {selectedForecast.description}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {is(ROLES.FINANCE) && (
            <AsyncSelectInput
              label="On behalf of"
              value={ob}
              onChange={setOb}
              loadOptions={loadEmployeeOptions}
              disabled={loading}
              placeholder="Select employee..."
              req={false}
              controlRadius={4}
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
            controlSx={controlStyle}
          />
          <Inp
            label="Bill date"
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            req
            style={cellStyle}
            controlSx={controlStyle}
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
          controlSx={controlStyle}
        />
        <MultiFileUp files={files} onChange={setFiles} title="Attachments" radius="4px" />
        <div style={{ fontSize: "11px", color: C.muted, marginTop: "-6px", marginBottom: "14px" }}>
          Cash reimbursement is disbursed only after the expense is approved and the bill is uploaded.
        </div>
        {error && <Alert sx={{ marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn onClick={openConfirm} disabled={!canSubmit} sx={{ borderRadius: R.control }}>
            <Send size={14} />
            {loading ? "Submitting..." : "Submit"}
          </Btn>
        </div>
      </div>
      <Mdl open={confirmOpen} close={() => !loading && setConfirmOpen(false)} title="Submit expense request">
        <div style={{ fontSize: "13px", color: C.primary, lineHeight: 1.5 }}>
          Submit this expense request for approval?
        </div>
        <div style={{ display: "grid", gap: "8px", marginTop: "14px", padding: "12px", background: C.surface, borderRadius: R.control, fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>Amount</span>
            <strong style={{ color: overForecast ? C.danger : C.primary }}>₹{expenseAmount.toLocaleString("en-IN")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: C.muted }}>Type</span>
            <strong>{expenseType === "forecast" ? "Forecast expense" : "Ad-Hoc expense"}</strong>
          </div>
          {expenseType === "forecast" && selectedForecast && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: C.muted }}>Forecast</span>
                <strong>{selectedForecast.title}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: C.muted }}>Approved amount</span>
                <strong>₹{selectedForecast.expectedAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: C.muted }}>Expected date</span>
                <strong>{selectedForecast.expectedExpenseDate}</strong>
              </div>
              {overForecast && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "10px", background: C.dangerBg, borderRadius: R.control }}>
                  <span style={{ color: C.danger, fontWeight: 600 }}>Over forecast by</span>
                  <strong style={{ color: C.danger }}>₹{(expenseAmount - selectedForecast.expectedAmount).toLocaleString("en-IN")}</strong>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <Btn v="secondary" onClick={() => setConfirmOpen(false)} disabled={loading} sx={{ borderRadius: R.control }}>
            Cancel
          </Btn>
          <Btn onClick={submit} disabled={loading} sx={{ borderRadius: R.control }}>
            <Send size={14} />
            {loading ? "Submitting..." : "Confirm submit"}
          </Btn>
        </div>
      </Mdl>
    </PageShell>
  );
}
