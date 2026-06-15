import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Ban, Check, Download, Edit, Eye, ReceiptText, Send, Target, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Btn, CLog, Empty, Mdl, IconActionButton, PageShell } from "../ui";
import { C, R } from "../../shared/theme";
import { approveForecast, getForecastById, getForecastDocument, submitForecast } from "../../shared/api/forecast";
import { getExpenseById } from "../../shared/api/expense";
import type { Forecast, UploadedDocument } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { canEditForecastRequest } from "../../shared/expensePermissions";
import { resolveExpenseDeepLink } from "../../shared/deepLinkModal";
import { buildDownloadFilename, downloadFromSasUrl } from "../../shared/utils";

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}

export default function ForecastDetailPageContent() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/forecasts");
    }
  };
  const { t, is, user, exps, setMdl } = useAppContext();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [viewDocName, setViewDocName] = useState<string | null>(null);
  const [viewLoadingDocId, setViewLoadingDocId] = useState<string | null>(null);
  const [downloadLoadingDocId, setDownloadLoadingDocId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getForecastById(id);
      setForecast(data);
    } catch {
      setError("Could not load forecast");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener(EVENTS.FORECASTS_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.FORECASTS_REFRESH, handler);
  }, [load]);

  const isSubmitter = !!forecast && forecast.createdByEmployeeId === user?.id;
  const canReview = (is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) && !isSubmitter;
  const canCancel = forecast?.status === "Submitted" && isSubmitter;
  const canEdit = !!forecast && canEditForecastRequest(forecast, user);

  const viewDocument = async (document: UploadedDocument) => {
    if (!forecast) return;
    setViewLoadingDocId(document.id);
    try {
      const url = await getForecastDocument(forecast.id, document.id);
      if (!url) {
        t("Could not load document", "error");
        return;
      }
      setViewDocName(document.name);
      setViewDocUrl(`${url}#toolbar=0&navpanes=0&zoom=page-width`);
    } catch {
      t("Could not load document", "error");
    } finally {
      setViewLoadingDocId(null);
    }
  };

  const downloadDocument = async (document: UploadedDocument) => {
    if (!forecast) return;
    setDownloadLoadingDocId(document.id);
    try {
      const url = await getForecastDocument(forecast.id, document.id);
      if (!url) {
        t("Could not download document", "error");
        return;
      }
      await downloadFromSasUrl(
        url,
        buildDownloadFilename(forecast.id, document.name),
        () => t("Could not download document", "error"),
      );
    } catch {
      t("Could not download document", "error");
    } finally {
      setDownloadLoadingDocId(null);
    }
  };

  const submit = async () => {
    if (!forecast) return;
    setActionLoading("submit");
    try {
      await submitForecast(forecast.id);
      t("Forecast submitted");
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const approve = async () => {
    if (!forecast) return;
    setActionLoading("approve");
    try {
      await approveForecast(forecast.id);
      t("Forecast approved");
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const openRelatedExpense = async (expenseId: string, expenseCode: string) => {
    const existing = exps.find((expense) => expense.apiId === expenseId || expense.id === expenseCode || expense.id === expenseId);
    if (existing) {
      setMdl(resolveExpenseDeepLink(existing, user, "detail"));
      return;
    }

    const fetched = await getExpenseById(expenseId);
    if (fetched) {
      setMdl(resolveExpenseDeepLink(fetched, user, "detail"));
      return;
    }

    t("Could not open expense details", "error");
    navigate("/expenses");
  };

  if (error) {
    return (
      <PageShell>
        <Alert>{error}</Alert>
      </PageShell>
    );
  }
  if (!forecast) {
    return (
      <PageShell>
        <Empty icon={<Target />} title={loading ? "Loading forecast..." : "Forecast not found"} sub="Open a forecast from the list." />
      </PageShell>
    );
  }

  return (
    <PageShell
      header={
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ width: "38px", height: "38px", borderRadius: R.control, background: C.successBg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Target size={20} color={C.success} strokeWidth={1.8} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ color: C.text, fontSize: "24px", fontWeight: 700, margin: "0 0 6px", lineHeight: 1.15 }}>
                {forecast.title}
              </h1>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn v="secondary" onClick={goBack} sx={{ borderRadius: R.control }}>
            <ArrowLeft size={14} />
            Back
          </Btn>
          {canEdit && (
            <Btn v="secondary" onClick={() => navigate(`/forecasts/${forecast.id}/edit`)} sx={{ borderRadius: R.control }} disabled={!!actionLoading}>
              <Edit size={14} />
              Edit
            </Btn>
          )}
          {forecast.status === "Draft" && (
            <>
              <Btn onClick={submit} sx={{ borderRadius: R.control }} disabled={!!actionLoading}>
                <Send size={14} />
                {actionLoading === "submit" ? "Submitting..." : "Submit"}
              </Btn>
            </>
          )}
          {canCancel && (
            <Btn
              v="danger"
              onClick={() => setMdl({ t: MODAL_T.FORECAST_CANCEL_CONFIRM, d: forecast })}
              sx={{ borderRadius: R.control }}
              disabled={!!actionLoading}
            >
              <Ban size={14} />
              Cancel
            </Btn>
          )}
          {canReview && forecast.status === "Submitted" && (
            <>
              <Btn v="success" onClick={approve} sx={{ borderRadius: R.control }} disabled={!!actionLoading}>
                <Check size={14} />
                {actionLoading === "approve" ? "Approving..." : "Approve"}
              </Btn>
              <Btn
                v="danger"
                onClick={() => setMdl({ t: MODAL_T.REJECT, d: forecast, it: ITEM_T.FORECAST })}
                sx={{ borderRadius: R.control }}
                disabled={!!actionLoading}
              >
                <X size={14} />
                Reject
              </Btn>
            </>
          )}
        </div>
      </div>
      }
    >
      <div style={{ position: "relative", background: "#fff", borderRadius: R.control, padding: "20px", boxShadow: "0px 2px 3px 0px #253EA70A", border: `1px solid ${C.border}`, marginBottom: "16px" }}>
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <Badge s={forecast.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "18px" }}>
          <Field label="Purpose" value={forecast.purpose} />
          <Field label="Description" value={forecast.description} />
          <Field label="Expected amount" value={formatMoney(forecast.expectedAmount)} />
          <Field label="Expected expense date" value={forecast.expectedExpenseDate} />
          <Field label="Notes" value={forecast.notes} />
          <Field label="Created by" value={`${forecast.createdBy} on ${forecast.createdAt}`} />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: R.control, padding: "20px", boxShadow: "0px 2px 3px 0px #253EA70A", border: `1px solid ${C.border}`, marginBottom: "16px" }}>
        <h2 style={{ fontSize: "14px", margin: "0 0 12px", color: C.primary }}>Supporting documents</h2>
        {forecast.documents.length === 0 ? (
          <div style={{ fontSize: "12px", color: C.muted }}>No documents uploaded.</div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {forecast.documents.map((doc) => (
              <div
                key={doc.id}
                style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: R.control, padding: "14px", display: "grid", gap: "10px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <Download size={15} color={C.accent} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "5px" }}>{doc.name}</span>
                      <span style={{ display: "block", fontSize: "10px", color: C.muted }}>{doc.sizeLabel} · {doc.uploadedAt}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <IconActionButton
                      label="View document"
                      onClick={() => void viewDocument(doc)}
                      disabled={viewLoadingDocId === doc.id}
                    >
                      <Eye size={14} />
                    </IconActionButton>
                    <IconActionButton
                      label="Download document"
                      onClick={() => void downloadDocument(doc)}
                      disabled={downloadLoadingDocId === doc.id}
                    >
                      <Download size={14} />
                    </IconActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: R.control, padding: "20px", boxShadow: "0px 2px 3px 0px #253EA70A", border: `1px solid ${C.border}`, marginBottom: "16px" }}>
        <h2 style={{ fontSize: "15px", margin: "0 0 14px", color: C.primary, fontWeight: 700 }}>Related expenses</h2>
        {forecast.relatedExpenses.length === 0 ? (
          <div style={{ fontSize: "12px", color: C.muted }}>No expenses raised against this forecast.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
            {forecast.relatedExpenses.map((expense) => (
              <button
                key={expense.id}
                type="button"
                onClick={() => void openRelatedExpense(expense.id, expense.expenseCode)}
                style={{ position: "relative", minHeight: "148px", border: `1px solid ${C.border}`, borderLeft: `5px solid ${C.success}`, background: "#fff", borderRadius: R.control, padding: "18px 18px 16px", cursor: "pointer", textAlign: "left", boxShadow: "0 10px 26px rgba(27,42,74,0.06)" }}
              >
                <div style={{ position: "absolute", top: "14px", right: "14px" }}>
                  <Badge s={expense.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "110px", marginBottom: "18px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: R.control, background: C.successBg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ReceiptText size={17} color={C.success} />
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: C.primary }}>{expense.expenseCode}</span>
                </div>
                <div style={{ fontSize: "24px", color: C.primary, fontWeight: 800, marginBottom: "12px" }}>{formatMoney(expense.amount)}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "11px", color: C.muted }}>
                  <Field label="Bill date" value={expense.billDate} />
                  <Field label="Created" value={expense.createdAt} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "16px", fontSize: "11px", color: C.muted }}>
                  <span>{expense.submittedBy}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: C.success, fontWeight: 700 }}>
                    <Eye size={13} />
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: R.control, padding: "20px", boxShadow: "0px 2px 3px 0px #253EA70A", border: `1px solid ${C.border}` }}>
        <CLog comments={forecast.comments} />
      </div>

      <Mdl
        open={!!viewDocUrl}
        close={() => {
          setViewDocUrl(null);
          setViewDocName(null);
        }}
        title={viewDocName ?? "Document preview"}
        w
      >
        {viewDocUrl ? (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: R.control, overflow: "hidden", background: "#fff", minHeight: 520 }}>
            <iframe
              title={viewDocName ?? "Document preview"}
              src={viewDocUrl}
              style={{ width: "100%", height: "min(70vh, 640px)", border: "none", display: "block" }}
            />
          </div>
        ) : (
          <div style={{ padding: 20, fontSize: 13, color: C.muted }}>Loading preview…</div>
        )}
      </Mdl>
    </PageShell>
  );
}
