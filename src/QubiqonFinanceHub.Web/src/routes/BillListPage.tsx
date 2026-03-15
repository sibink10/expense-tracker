import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Bill } from "../types";
import { C } from "../shared/theme";
import { BILL_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Av, Btn, Badge, Tbl, Filter, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getBills } from "../shared/api/bill";

export default function BillListPage() {
  const navigate = useNavigate();
  const { search, setSearch, sf, setSf, fil, is, setMdl } = useAppContext();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("bills-refresh", handler);
    return () => window.removeEventListener("bills-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getBills()
      .then(setBills)
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const f = fil(bills);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.vendor }}>📋</span> Vendor bills
        </h1>
        {(is("finance") || is("admin")) && (
          <Btn v="vendor" onClick={() => navigate("/bills/add")}>
            ＋ Submit bill
          </Btn>
        )}
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
        }}
      >
        <Filter
          search={search}
          onSearch={setSearch}
          status={sf}
          onStatus={setSf}
          opts={[
            "all",
            BILL_S.SUBMITTED,
            BILL_S.APPROVED,
            BILL_S.PAID,
            BILL_S.OVERDUE,
            BILL_S.REJECTED,
          ]}
        />
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : f.length === 0 ? (
          <Empty icon="📋" title="No bills" sub="" />
        ) : (
          <Tbl
            cols={[
              "Bill #",
              "Vendor",
              "Amount",
              "TDS",
              "Payable",
              "Due",
              "Status",
              (is("approver") || is("finance")) && "Action",
            ].filter(Boolean) as string[]}
            rows={f.map((b) => ({
              ...b,
              _cells: [
                { v: <span style={{ fontWeight: 600, color: C.vendor, fontSize: "11px" }}>{b.id}</span> },
                {
                  v: (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Av n={b.vName} sz={24} v />
                      <span style={{ fontSize: "11px", fontWeight: 600 }}>{b.vName}</span>
                    </div>
                  ),
                },
                { v: <span style={{ fontWeight: 600 }}>{fmtCur(b.amt)}</span> },
                { v: <span style={{ fontSize: "11px", color: C.danger }}>-{fmtCur(b.tdsAmt)}</span> },
                { v: <span style={{ fontWeight: 700 }}>{fmtCur(b.pay)}</span> },
                { v: <span style={{ fontSize: "11px", color: C.muted }}>{b.due}</span> },
                { v: <Badge s={b.status} /> },
                ...(is("approver") || is("finance")
                  ? [
                      {
                        v: (
                          <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px" }}>
                            {is("approver") && b.status === BILL_S.SUBMITTED && (
                              <>
                                <Btn sm v="success" onClick={() => setMdl({ t: "bill-approve", d: b, it: "bill" })}>✓</Btn>
                                <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: b, it: "bill" })}>✕</Btn>
                              </>
                            )}
                            {is("finance") && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE) && (
                              <Btn sm v="vendor" onClick={() => setMdl({ t: "pay", d: b, it: "bill" })}>Pay</Btn>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ],
            }))}
            onRow={(row) => setMdl({ t: "bill-detail", d: row as unknown as Bill })}
          />
        )}
      </div>
    </div>
  );
}
