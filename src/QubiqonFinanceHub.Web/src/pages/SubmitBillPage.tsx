import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { PAY_TERMS } from "../shared/constants";
import { genCode, addDays, fmtCur } from "../shared/utils";
import { Inp, Btn, FileUp } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { createBill } from "../shared/api/bill";
import { getVendors } from "../shared/api/vendor";
import { getTaxConfigs } from "../shared/api/taxConfig";
import type { Vendor, TaxConfig } from "../types";

export default function SubmitBillPage() {
  const navigate = useNavigate();
  const { cfg, setCfg, t } = useAppContext();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tdsOptions, setTdsOptions] = useState<TaxConfig[]>([]);
  const [vId, setVId] = useState("");
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [bd, setBd] = useState("");
  const [trm, setTrm] = useState("net30");
  const [tds, setTds] = useState("none");
  const [tdsLoading, setTdsLoading] = useState(true);
  const [fi, setFi] = useState<{ n: string; s: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cc, setCc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  useEffect(() => {
    getVendors()
      .then(setVendors)
      .catch(() => setVendors([]))
      .finally(() => setVendorsLoading(false));
  }, []);

  useEffect(() => {
    getTaxConfigs()
      .then((configs) => setTdsOptions(configs.filter((c) => c.type === "TDS" && c.isActive)))
      .catch(() => setTdsOptions([]))
      .finally(() => setTdsLoading(false));
  }, []);

  const due = bd ? addDays(bd, PAY_TERMS.find((x) => x.v === trm)?.d || 30) : "";
  const tx = tdsOptions.find((x) => x.id === tds);
  const tdsRate = tx?.rate || 0;
  const a = parseFloat(amt) || 0;
  const tdsA = Math.round((a * tdsRate) / 100);
  const nextCode = genCode(cfg.billFmt, cfg.billSeq + 1);

  const handleSubmit = async () => {
    if (!vId || !amt || !desc || !bd || !file) return;
    setLoading(true);
    setError(null);
    try {
      const billDate = new Date(bd).toISOString();
      const dueDate = new Date(due).toISOString();
      await createBill(
        {
          vendorId: vId,
          amount: a,
          taxConfigId: tds === "none" ? "" : tds,
          description: desc,
          billDate,
          dueDate,
          paymentTerms: trm,
          ccEmails: cc,
        },
        file,
      );
      setCfg((c) => ({ ...c, billSeq: c.billSeq + 1 }));
      window.dispatchEvent(new CustomEvent("bills-refresh"));
      t("Bill submitted");
      navigate("/bills");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 2px" }}>
        <span style={{ color: C.vendor }}>📋</span> Submit vendor bill
      </h1>
      <p style={{ color: C.muted, margin: "0 0 20px", fontSize: "12px" }}>
        Auto # <span style={{ color: C.vendor, fontWeight: 600 }}>{nextCode}</span>
      </p>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <Inp
          label="Vendor"
          type="select"
          value={vId}
          onChange={(e) => setVId(e.target.value)}
          req
          opts={[
            { v: "", l: vendorsLoading ? "Loading..." : "Select..." },
            ...vendors.map((v) => ({ v: v.id, l: `${v.name} (${v.gstin})` })),
          ]}
        />
        <Inp
          label="Bill amount (₹)"
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          req
          min="1"
          ph="Total before TDS"
        />
        <Inp
          label="TDS"
          type="select"
          value={tds}
          onChange={(e) => setTds(e.target.value)}
          disabled={tdsLoading}
          opts={[
            { v: "none", l: tdsLoading ? "Loading..." : "No TDS" },
            ...tdsOptions.map((x) => ({
              v: x.id,
              l: `${x.name} (${x.rate}%) — ${x.section}`,
            })),
          ]}
        />
        {a > 0 && (
          <div
            style={{
              padding: "12px 14px",
              background: `${C.vendor}06`,
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: C.muted }}>Sub total</span>
              <span style={{ fontWeight: 600 }}>{fmtCur(a)}</span>
            </div>
            {tdsRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: C.danger }}>
                  TDS ({tx?.section} @ {tdsRate}%)
                </span>
                <span style={{ color: C.danger, fontWeight: 600 }}>-{fmtCur(tdsA)}</span>
              </div>
            )}
            <div
              style={{
                borderTop: `1px solid ${C.vendor}20`,
                paddingTop: "4px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: 700, color: C.vendor }}>Payable</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: C.vendor }}>
                {fmtCur(a - tdsA)}
              </span>
            </div>
          </div>
        )}
        <Inp
          label="Description"
          type="textarea"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          req
          ph="Goods/services..."
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <Inp
            label="Bill date"
            type="date"
            value={bd}
            onChange={(e) => setBd(e.target.value)}
            req
            style={{ flex: 1 }}
          />
          <Inp
            label="Terms"
            type="select"
            value={trm}
            onChange={(e) => setTrm(e.target.value)}
            opts={PAY_TERMS.map((x) => ({ v: x.v, l: x.l }))}
            style={{ flex: 1 }}
          />
        </div>
        {due && (
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "14px" }}>
            📅 Due: <strong>{due}</strong>
          </div>
        )}
        <Inp
          label="CC emails"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          ph="comma-separated"
          hint="CC'd on payment email to vendor"
        />
        <FileUp
          file={fi}
          onChange={setFi}
          onFileSelect={setFile}
          req
        />
        {error && (
          <div style={{ color: C.danger, fontSize: "12px", marginBottom: "12px" }}>{error}</div>
        )}
        <Btn
          v="vendor"
          onClick={handleSubmit}
          disabled={!vId || !amt || !desc || !bd || !file || loading}
        >
          {loading ? "Submitting..." : "Submit bill"}
        </Btn>
      </div>
    </div>
  );
}
