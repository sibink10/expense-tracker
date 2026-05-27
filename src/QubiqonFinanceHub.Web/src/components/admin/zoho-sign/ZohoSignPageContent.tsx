import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Download,
  FileSignature,
  FileText,
  RefreshCw,
  Search,
  Send,
  Signature,
} from "lucide-react";
import { C } from "../../../shared/theme";
import { Btn, Empty, Inp, Mdl, Spinner, Tbl, type TblCol } from "../../ui";
import { useAppContext } from "../../../context/AppContext";
import { getInvoices } from "../../../shared/api/invoice";
import {
  downloadZohoSignPdf,
  getZohoIntegrationSetup,
  getZohoSignRequests,
  getZohoTemplates,
  parseZohoSignRequests,
  parseZohoTemplates,
  sendZohoDocument,
  type ZohoIntegrationSetup,
} from "../../../shared/api/zoho";

type ZohoSignRequest = { id: string; name: string; status: string; createdTime?: string };

const PAGE_SIZE = 10;
const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };

const workflowActionStyle = (fg: string, bg: string) => ({
  borderRadius: "4px",
  background: bg,
  color: fg,
  padding: "6px 8px",
  minHeight: 26,
});

const statusPillStyle = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("signed") || normalized.includes("success")) {
    return { color: C.success, background: C.successBg };
  }
  if (normalized.includes("decline") || normalized.includes("fail") || normalized.includes("reject")) {
    return { color: C.danger, background: C.dangerBg };
  }
  if (normalized.includes("progress") || normalized.includes("sent") || normalized.includes("pending")) {
    return { color: C.invoiceActionSent, background: C.invoiceActionSentBg };
  }
  return { color: C.warning, background: C.warningBg };
};

export default function ZohoSignPage() {
  const { t, is } = useAppContext();
  const [setup, setSetup] = useState<ZohoIntegrationSetup | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [requests, setRequests] = useState<ZohoSignRequest[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState<{ id: string; label: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<ZohoSignRequest | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
      const data = await getZohoSignRequests({ rowCount: 100, startIndex: 1 });
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
              label: `${inv.id} - ${inv.cName}`,
            }))
        );
      })
      .catch(() => setInvoiceOptions([]));
  }, [canAccess, loadSetup, loadTemplates, loadRequests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

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
      setSendModalOpen(false);
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

  const filteredRequests = useMemo(() => {
    if (!debouncedSearch) return requests;
    return requests.filter((request) =>
      [request.name, request.status, request.createdTime, request.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(debouncedSearch))
    );
  }, [debouncedSearch, requests]);

  const totalCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalCount);
  const pageRequests = filteredRequests.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const cols: TblCol[] = [
    { label: "Request", sx: { textAlign: "left" } },
    { label: "Status", sx: centeredColSx },
    { label: "Created", sx: centeredColSx },
    { label: "Action", sx: centeredColSx },
  ];

  const rows = pageRequests.map((request) => {
    const statusStyle = statusPillStyle(request.status);
    return {
      request,
      _cells: [
        {
          v: <span style={{ fontWeight: 600, color: C.primary }}>{request.name}</span>,
          sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
        },
        {
          v: (
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                ...statusStyle,
              }}
            >
              {request.status}
            </span>
          ),
          sx: centeredColSx,
        },
        { v: <span style={{ color: C.muted }}>{request.createdTime ?? "NA"}</span>, sx: centeredColSx },
        {
          v: (
            <span
              onClick={(event) => event.stopPropagation()}
              style={{
                minHeight: 36,
                display: "inline-flex",
                gap: "6px",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
              }}
            >
              <Btn
                sm
                v="ghost"
                sx={workflowActionStyle(C.actionDownloadIcon, C.actionDownloadBg)}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDownloadPdf(request.id);
                }}
                disabled={downloadingId === request.id}
              >
                <Download size={13} strokeWidth={1.9} />
                {downloadingId === request.id ? "Downloading" : "PDF"}
              </Btn>
            </span>
          ),
          sx: centeredColSx,
        },
      ],
    };
  });

  if (!canAccess) {
    return (
      <div style={{ color: C.muted, fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>
        You need Finance or Admin access to use Zoho Sign.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .zoho-sign-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .zoho-sign-add-label {
            display: none;
          }

          .zoho-sign-table-card {
            margin-top: 20px;
          }

          .zoho-sign-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .zoho-sign-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="zoho-sign-page-header"
        style={{
          position: "sticky",
          top: "-17px",
          background: "#f1f2f6",
          padding: "10px 2px",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.primary,
            fontFamily: "'Manrope', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "-0.02em",
          }}
        >
          <Signature size={24} strokeWidth={1.8} color={C.primary} />
          Zoho Sign
        </h1>
        <Btn
          v="primary"
          onClick={() => setSendModalOpen(true)}
          disabled={setupLoading || loadingTemplates || !setup?.isConfigured || !!setup?.tokenError}
          sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
        >
          <CirclePlus size={15} strokeWidth={1.8} />
          <span className="zoho-sign-add-label">Send document</span>
        </Btn>
      </div>

      <section
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: C.cardShadow,
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            margin: "0 0 12px",
            color: C.primary,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          Integration
        </h2>
        {setupLoading ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: C.muted, fontSize: "13px" }}>
            <Spinner size={16} />
            Loading setup...
          </div>
        ) : setup ? (
          <div style={{ fontSize: "13px", lineHeight: 1.6, fontFamily: "'Inter', sans-serif", color: C.muted }}>
            <div>
              Status:{" "}
              <strong style={{ color: setup.isConfigured && !setup.tokenError ? C.success : C.danger }}>
                {setup.isConfigured && !setup.tokenError ? "Connected" : "Not configured"}
              </strong>
            </div>
            {setup.tokenError && <div style={{ color: C.danger, marginTop: 4 }}>{setup.tokenError}</div>}
            <div style={{ marginTop: 4 }}>OAuth authorization is managed under Admin → Organization.</div>
          </div>
        ) : null}
      </section>

      <div
        className="zoho-sign-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="zoho-sign-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="zoho-sign-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search sign requests..."
              style={{
                width: "100%",
                padding: "7px 12px 7px 34px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                background: C.white,
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Search size={16} strokeWidth={2} />
            </span>
          </div>
          <button
            type="button"
            aria-label="Refresh sign requests"
            title="Refresh sign requests"
            onClick={() => void loadRequests()}
            disabled={loadingRequests}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: "4px",
              background: "transparent",
              color: C.primary,
              cursor: loadingRequests ? "not-allowed" : "pointer",
              opacity: loadingRequests ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <RefreshCw size={20} strokeWidth={1.9} />
          </button>
        </div>

        <Tbl
          cols={cols}
          rows={loadingRequests ? [] : rows}
          onRow={(row) => setDetailRequest((row as (typeof rows)[number]).request)}
          bodyFallback={
            loadingRequests ? (
              <div
                style={{
                  minHeight: "460px",
                  padding: "42px 16px",
                  textAlign: "center",
                  color: C.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <Spinner size={28} />
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: C.primary }}>
                  Loading sign requests...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching Zoho Sign requests.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<FileSignature size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No sign requests found" : "No sign requests"}
                sub={debouncedSearch ? "Try a different search term." : "Send a document for signature to get started."}
              />
            ) : null
          }
          headerSx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
            verticalAlign: "middle",
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
            verticalAlign: "middle",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
            Showing {totalCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCount}
          </span>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              disabled={loadingRequests || page <= 1}
              onClick={() => {
                if (loadingRequests || page <= 1) return;
                setPage((current) => Math.max(1, current - 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loadingRequests || page <= 1 ? 0.45 : 1,
                cursor: loadingRequests || page <= 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              Prev
            </button>
            <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={loadingRequests || page >= totalPages}
              onClick={() => {
                if (loadingRequests || page >= totalPages) return;
                setPage((current) => Math.min(totalPages, current + 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loadingRequests || page >= totalPages ? 0.45 : 1,
                cursor: loadingRequests || page >= totalPages ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Next
              <ChevronRight size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>

      <Mdl
        open={sendModalOpen}
        close={() => {
          if (!sending) setSendModalOpen(false);
        }}
        title="Send for signature"
      >
        <Inp
          label="Invoice"
          type="select"
          value={selectedInvoiceId}
          onChange={(event) => setSelectedInvoiceId(event.target.value)}
          opts={invoiceOptions.map((invoice) => ({ v: invoice.id, l: invoice.label }))}
          req
        />
        <Inp
          label="Template"
          type="select"
          value={selectedTemplateId}
          onChange={(event) => setSelectedTemplateId(event.target.value)}
          opts={templates.map((template) => ({ v: template.id, l: template.name }))}
          req
        />
        <Inp
          label="Notes"
          type="textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          ph="Optional signing note"
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Btn v="secondary" onClick={() => setSendModalOpen(false)} disabled={sending}>
            Cancel
          </Btn>
          <Btn v="primary" onClick={handleSend} disabled={sending || !selectedInvoiceId || !selectedTemplateId}>
            <Send size={14} strokeWidth={1.9} />
            {sending ? "Sending..." : "Send"}
          </Btn>
        </div>
      </Mdl>

      <Mdl open={!!detailRequest} close={() => setDetailRequest(null)} title={detailRequest?.name ?? "Sign request"}>
        {detailRequest && (
          <div style={{ display: "grid", gap: "10px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: C.muted }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.primary, fontWeight: 600 }}>
              <FileText size={16} strokeWidth={1.8} />
              {detailRequest.name}
            </div>
            <div>Request ID: {detailRequest.id}</div>
            <div>Status: {detailRequest.status}</div>
            <div>Created: {detailRequest.createdTime ?? "NA"}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
              <Btn v="secondary" onClick={() => setDetailRequest(null)}>
                Close
              </Btn>
              <Btn
                v="ghost"
                sx={workflowActionStyle(C.actionDownloadIcon, C.actionDownloadBg)}
                onClick={() => void handleDownloadPdf(detailRequest.id)}
                disabled={downloadingId === detailRequest.id}
              >
                <Download size={13} strokeWidth={1.9} />
                {downloadingId === detailRequest.id ? "Downloading" : "Download PDF"}
              </Btn>
            </div>
          </div>
        )}
      </Mdl>
    </div>
  );
}
