import { useCallback, useEffect, useState } from "react";
import { C } from "../shared/theme";
import { Btn, Inp, Mdl, Tbl, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getInvoices } from "../shared/api/invoice";
import {
  downloadZohoSignPdf,
  getZohoIntegrationSetup,
  getZohoSignRequests,
  getZohoTemplates,
  parseZohoSignRequests,
  parseZohoTemplates,
  sendZohoDocument,
  type ZohoIntegrationSetup,
} from "../shared/api/zoho";

export default function ZohoSignPage() {
  const { t, is } = useAppContext();
  const [setup, setSetup] = useState<ZohoIntegrationSetup | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [requests, setRequests] = useState<
    { id: string; name: string; status: string; createdTime?: string }[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState<{ id: string; label: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const canAccess = is("admin") || is("finance");

  const loadSetup = useCallback(async () => {
    setSetupLoading(true);
    try {
      setSetup(await getZohoIntegrationSetup());
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not load Zoho setup", "error");
    } finally {
      setSetupLoading(false);
    }
  }, [t]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await getZohoTemplates();
      const parsed = parseZohoTemplates(data);
      setTemplates(parsed);
      if (parsed.length > 0 && !selectedTemplateId) setSelectedTemplateId(parsed[0].id);
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not load templates", "error");
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedTemplateId, t]);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await getZohoSignRequests({ rowCount: 20, startIndex: 1 });
      setRequests(parseZohoSignRequests(data));
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Could not load sign requests", "error");
    } finally {
      setLoadingRequests(false);
    }
  }, [t]);

  useEffect(() => {
    if (!canAccess) return;
    void loadSetup();
    void loadTemplates();
    void loadRequests();
    void getInvoices({ page: 1, pageSize: 50 })
      .then((res) => {
        setInvoiceOptions(
          res.items
            .filter((inv) => inv.apiId)
            .map((inv) => ({
              id: inv.apiId!,
              label: `${inv.id} — ${inv.cName}`,
            }))
        );
      })
      .catch(() => setInvoiceOptions([]));
  }, [canAccess, loadSetup, loadTemplates, loadRequests]);

  const handleSend = async () => {
    if (!selectedInvoiceId || !selectedTemplateId) {
      t("Select an invoice and template", "error");
      return;
    }
    setSending(true);
    try {
      const result = await sendZohoDocument({
        type: "Invoice",
        sourceId: selectedInvoiceId,
        templateId: selectedTemplateId,
        notes: notes.trim() || undefined,
      });
      t(result.requestId ? `Sent for signature (${result.requestId})` : "Document sent for signature");
      setNotes("");
      void loadRequests();
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPdf = async (requestId: string) => {
    setDownloadingId(requestId);
    try {
      const blob = await downloadZohoSignPdf(requestId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zoho-sign-${requestId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      t(err instanceof Error ? err.message : "PDF download failed", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!canAccess) {
    return (
      <div style={{ padding: 24, color: C.muted }}>
        You need Finance or Admin access to use Zoho Sign.
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>
        ✍ Zoho Sign
      </h1>

      <section
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Integration</h2>
        {setupLoading ? (
          <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p>
        ) : setup ? (
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div>
              Status:{" "}
              <strong style={{ color: setup.isConfigured && !setup.tokenError ? C.success : C.danger }}>
                {setup.isConfigured && !setup.tokenError ? "Connected" : "Not configured"}
              </strong>
            </div>
            {setup.tokenError && (
              <div style={{ color: C.danger, marginTop: 4 }}>{setup.tokenError}</div>
            )}
            {setup.authorizationUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={setup.authorizationUrl} target="_blank" rel="noreferrer" style={{ color: C.info }}>
                  Open OAuth authorization URL
                </a>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Sign requests</h2>
          <Btn sm v="secondary" onClick={() => void loadRequests()} disabled={loadingRequests}>
            Refresh
          </Btn>
        </div>
        {loadingRequests ? (
          <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p>
        ) : requests.length === 0 ? (
          <Empty icon="✍" title="No sign requests" sub="" />
        ) : (
          <Tbl
            cols={["Request", "Status", "Created", "Action"]}
            rows={requests.map((r) => ({
              ...r,
              _cells: [
                { v: <span style={{ fontSize: 11, fontWeight: 600 }}>{r.name}</span> },
                { v: <span style={{ fontSize: 11 }}>{r.status}</span> },
                { v: <span style={{ fontSize: 11, color: C.muted }}>{r.createdTime ?? "—"}</span> },
                {
                  v: (
                    <Btn
                      sm
                      v="secondary"
                      onClick={() => void handleDownloadPdf(r.id)}
                      disabled={downloadingId === r.id}
                    >
                      {downloadingId === r.id ? "…" : "PDF"}
                    </Btn>
                  ),
                },
              ],
            }))}
          />
        )}
      </section>
    </div>
  );
}
