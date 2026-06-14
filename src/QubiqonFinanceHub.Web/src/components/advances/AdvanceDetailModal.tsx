import { useState } from "react";
import { C } from "../../shared/theme";
import { ADV_S, EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur } from "../../shared/utils";
import { advanceRaisedByCurrentUser, canCancelAdvanceRequest, canEditAdvanceRequest } from "../../shared/expensePermissions";
import { Btn, Badge, Mdl, CLog } from "../ui";
import { getApiErrorMessage } from "../../shared/api/client";
import { cancelAdvance } from "../../shared/api/advance";
import { useAppContext } from "../../context/AppContext";
import type { Advance } from "../../types";
import {
  DetailField,
  DetailGrid,
  DetailModalSurface,
  DetailSection,
  DetailTable,
} from "../shared/EntityDetailModalParts";

interface Props {
  advance: Advance;
  previousAdvances: Advance[];
}

export default function AdvanceDetailModal({ advance: a, previousAdvances: hist }: Props) {
  const { setMdl, is, t, user } = useAppContext();
  const [cancelLoading, setCancelLoading] = useState(false);
  const isCancelled = a.status === ADV_S.CANCELLED;
  const canCancelAdvance = !isCancelled && canCancelAdvanceRequest(a, user);
  const canEditAdvance = canEditAdvanceRequest(a, user);

  const openEdit = () => {
    setMdl(null);
    setTimeout(() => setMdl({ t: MODAL_T.ADV_EDIT, d: a }), 50);
  };

  return (
    <Mdl
      open
      close={() => setMdl(null)}
      title={a.id}
      subtitle="Advance"
      w
      onEdit={canEditAdvance ? openEdit : undefined}
    >
      <DetailModalSurface>
      <DetailSection title="General information">
        <DetailGrid>
          <DetailField label="Employee" value={`${a.empName} · ${a.dept}`} />
          <DetailField label="Amount" value={fmtCur(a.amt)} />
          {(a.paidAmount ?? 0) > 0 && (
            <DetailField label="Paid" value={fmtCur(a.paidAmount ?? 0)} />
          )}
        </DetailGrid>
        <div style={{ marginTop: "12px" }}>
          <Badge s={a.status} />
        </div>
      </DetailSection>

      <DetailSection title="Purpose">
        <div className="detail-purpose-block">{a.purpose || "—"}</div>
      </DetailSection>

      <CLog comments={a.comments} />

      {(is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) && hist.length > 0 && (
        <DetailSection title="Previous advances">
          <DetailTable
            columns={["ID", "Amount", "Status"]}
            rows={hist.map((h) => [
              <span key={`${h.id}-id`} style={{ color: C.advance, fontWeight: 600 }}>
                {h.id}
              </span>,
              fmtCur(h.amt),
              <Badge key={`${h.id}-s`} s={h.status} />,
            ])}
          />
        </DetailSection>
      )}

      </DetailModalSurface>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end", padding: "16px 0 8px" }}>
        {canCancelAdvance && (
          <Btn
            v="secondary"
            disabled={cancelLoading}
            onClick={async () => {
              const id = a.apiId ?? a.id;
              setCancelLoading(true);
              try {
                await cancelAdvance(id);
                t("Advance request cancelled");
                setMdl(null);
                window.dispatchEvent(new CustomEvent(EVENTS.ADVANCES_REFRESH));
              } catch (err) {
                t(getApiErrorMessage(err, "Could not cancel advance"));
              } finally {
                setCancelLoading(false);
              }
            }}
          >
            {cancelLoading ? "Cancelling…" : "Cancel request"}
          </Btn>
        )}
        {(is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
          !advanceRaisedByCurrentUser(a, user) &&
          !isCancelled &&
          a.status === ADV_S.PENDING && (
          <>
            <Btn v="success" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: MODAL_T.ADV_APPROVE, d: a }), 50); }}>Approve</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE }), 50); }}>Reject</Btn>
          </>
        )}
        {(is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
          !isCancelled &&
          (a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED) && (
          <>
            <Btn v="advance" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: MODAL_T.ADV_DISBURSE, d: a }), 50); }}>Disburse</Btn>
            <Btn v="danger" onClick={() => { setMdl(null); setTimeout(() => setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE }), 50); }}>Reject</Btn>
          </>
        )}
      </div>
    </Mdl>
  );
}
