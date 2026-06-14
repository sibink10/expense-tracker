import { useState } from "react";
import { Btn, Mdl, Alert } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { cancelExpense } from "../../shared/api/expense";
import { cancelAdvance } from "../../shared/api/advance";
import { cancelForecast } from "../../shared/api/forecast";
import { getApiErrorMessage } from "../../shared/api/client";
import { canCancelAdvanceRequest, canCancelExpenseRequest } from "../../shared/expensePermissions";
import type { Expense, Advance, Forecast } from "../../types";
import { EVENTS, MODAL_T } from "../../shared/constants";

function canCancelForecastRequest(forecast: Forecast, user: { id: string } | null | undefined) {
  return forecast.status === "Submitted" && forecast.createdByEmployeeId === user?.id;
}

export default function CancelRequestConfirmModal() {
  const { mdl, setMdl, t, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mdl?.d) return null;
  if (
    mdl.t !== MODAL_T.EXP_CANCEL_CONFIRM &&
    mdl.t !== MODAL_T.ADV_CANCEL_CONFIRM &&
    mdl.t !== MODAL_T.FORECAST_CANCEL_CONFIRM
  ) {
    return null;
  }

  const isExpense = mdl.t === MODAL_T.EXP_CANCEL_CONFIRM;
  const isForecast = mdl.t === MODAL_T.FORECAST_CANCEL_CONFIRM;
  const item = mdl.d as Expense | Advance | Forecast;
  const allowed = isForecast
    ? canCancelForecastRequest(item as Forecast, user)
    : isExpense
      ? canCancelExpenseRequest(item as Expense, user)
      : canCancelAdvanceRequest(item as Advance, user);
  const title = isForecast
    ? `Cancel forecast "${(item as Forecast).title}"?`
    : isExpense
      ? `Cancel expense ${item.id}?`
      : `Cancel advance ${item.id}?`;
  const detail = isForecast
    ? "This will mark the forecast as cancelled. It cannot be approved or rejected after that."
    : isExpense
      ? "This will mark the expense as cancelled. It cannot be edited, approved, rejected, or paid after that."
      : "This will mark the advance as cancelled. It cannot be approved, rejected, or disbursed after that.";

  const handleConfirm = async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);
    try {
      if (isForecast) await cancelForecast((item as Forecast).id);
      else if (isExpense) await cancelExpense((item as Expense).apiId ?? item.id);
      else await cancelAdvance((item as Advance).apiId ?? item.id);
      t(
        isForecast
          ? "Forecast cancelled"
          : isExpense
            ? "Expense request cancelled"
            : "Advance request cancelled",
      );
      setMdl(null);
      window.dispatchEvent(
        new CustomEvent(
          isForecast ? EVENTS.FORECASTS_REFRESH : isExpense ? EVENTS.EXPENSES_REFRESH : EVENTS.ADVANCES_REFRESH,
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not cancel"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => !loading && setMdl(null)} title={title}>
      {error && <Alert sx={{ marginBottom: "12px" }}>{error}</Alert>}
      {!allowed && (
        <Alert sx={{ marginBottom: "12px" }}>
          {isForecast
            ? "Only the person who submitted this forecast can cancel it, and only while it is awaiting approval."
            : isExpense
              ? "Only the person who raised this expense can cancel it, and only while it is pending approval."
              : "Only the person who raised this advance can cancel it, and only while it is pending."}
        </Alert>
      )}
      <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#495057", margin: 0 }}>{detail}</p>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Keep request
        </Btn>
        <Btn v="danger" onClick={handleConfirm} disabled={loading || !allowed}>
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Btn>
      </div>
    </Mdl>
  );
}
