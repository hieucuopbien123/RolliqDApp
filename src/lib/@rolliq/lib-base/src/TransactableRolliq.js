/**
 * Thrown by {@link TransactableRolliq} functions in case of transaction failure.
 *
 * @public
 */
export class TransactionFailedError extends Error {
  /** @internal */
  constructor(name, message, failedReceipt) {
    super(message);
    this.name = name;
    this.failedReceipt = failedReceipt;
  }
}
