import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Av, Btn, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";

export default function ExpensePayPage() {
  const { payableExp, setMdl } = useAppContext();

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>
        Expense payments
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
        }}
      >
        {payableExp.length === 0 ? (
          <Empty icon="✓" title="All caught up" sub="" />
        ) : (
          payableExp.map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <Av n={e.empName} sz={30} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600 }}>
                  {e.empName} · <span style={{ color: C.accent }}>{e.id}</span>
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>{e.purpose}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{fmtCur(e.amt)}</div>
                {e.documents.length > 0 || e.file ? (
                  <span style={{ fontSize: "10px", color: C.success }}>📎 Bill</span>
                ) : (
                  <span style={{ fontSize: "10px", color: C.warning }}>⚠ No bill</span>
                )}
              </div>
              <Btn sm v="info" onClick={() => setMdl({ t: "pay", d: e, it: "expense" })} disabled={!(e.documents.length > 0 || e.file)}>
                Pay
              </Btn>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
