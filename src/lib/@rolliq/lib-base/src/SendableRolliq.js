/** @internal */
export const _pendingReceipt = { status: "pending" };

/** @internal */
export const _failedReceipt = (rawReceipt) => ({
  status: "failed",
  rawReceipt,
});

/** @internal */
export const _successfulReceipt = (rawReceipt, details, toString) => ({
  status: "succeeded",
  rawReceipt,
  details,
  ...(toString ? { toString } : {}),
});
