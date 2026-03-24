import type { ActivityComment } from "../types";

/** Maps API `CommentActionType` strings to short labels shown in activity log. */
const ACTION_LABELS: Record<string, string> = {
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
  PaymentProcessed: "Payment processed",
  Sent: "Sent",
  General: "Note",
  BillUploaded: "Bill uploaded",
};

export function formatActivityCommentAction(actionType: string | undefined | null): string {
  const raw = actionType?.trim();
  if (!raw) return "";
  if (ACTION_LABELS[raw]) return ACTION_LABELS[raw];
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function mapActionTypeToAccentT(actionType: string): ActivityComment["t"] {
  const s = actionType?.toLowerCase() || "";
  if (s.includes("approv") || s === "ok") return "ok";
  if (s.includes("reject") || s === "no") return "no";
  if (s.includes("pay") || s.includes("disburs")) return "pay";
  return "sent";
}

/** When `status` is missing (e.g. legacy mock rows), derive a label from accent type. */
export function activityCommentStatusFallback(t: ActivityComment["t"]): string {
  switch (t) {
    case "ok":
      return "Approved";
    case "no":
      return "Rejected";
    case "pay":
      return "Payment processed";
    case "sent":
      return "Sent";
    default:
      return "Activity";
  }
}
