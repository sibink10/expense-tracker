import { useState, useCallback } from "react";
import { C } from "../shared/theme";
import { EXP_S, EXPENSE_PAY_DISABLED_NO_BILL_TOOLTIP } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Av, Btn, Empty, ListRefreshButton } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getExpensesMapped } from "../shared/api/expense";

export default function ExpensePayPage() {
  const { payableExp, setMdl, setExps, is } = useAppContext();
  const [loading, setLoading] = useState(false);

  const myOnly = is("employee");

  const refreshPayable = useCallback(async () => {
    setLoading(true);
    try {
      const [awaiting, partial] = await Promise.all([
        getExpensesMapped({
          page: 1,
          pageSize: 200,
          status: "AwaitingPayment",
          myOnly,
        }),
        getExpensesMapped({
          page: 1,
          pageSize: 200,
          status: "PartiallyPaid",
          myOnly,
        }),
      ]);
      const byId = new Map<string, (typeof awaiting.items)[0]>();
      for (const e of [...awaiting.items, ...partial.items]) {
        byId.set(e.id, e);
      }
      setExps((prev) => {
        const rest = prev.filter(
          (e) =>
            !(
              (e.status === EXP_S.AWAITING_PAYMENT || e.status === EXP_S.PARTIALLY_PAID) &&
              (e.documents.length > 0 || e.file)
            ),
        );
        return [...rest, ...byId.values()];
      });
    } catch {
      // keep existing list on failure
    } finally {
      setLoading(false);
    }
  }, [myOnly, setExps]);

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>Expense payments</h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <ListRefreshButton loading={loading} onRefresh={refreshPayable} />
        </div>
        {payableExp.length === 0 ? (
          <Empty icon="✓" title="All caught up" sub="" />
        ) : (
          payableExp.map((e) => {
            const hasBill = e.documents.length > 0 || !!e.file;
            return (
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
                {hasBill ? (
                  <span style={{ fontSize: "10px", color: C.success }}>📎 Bill</span>
                ) : (
                  <span style={{ fontSize: "10px", color: C.warning }}>⚠ No bill</span>
                )}
              </div>
              <Btn
                sm
                v="info"
                onClick={() => setMdl({ t: "pay", d: e, it: "expense" })}
                disabled={!hasBill}
                title={!hasBill ? EXPENSE_PAY_DISABLED_NO_BILL_TOOLTIP : undefined}
              >
                Pay
              </Btn>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
