import assert from "assert";

import { Decimal } from "./Decimal";

import {
  MAXIMUM_BORROWING_RATE,
  MINIMUM_BORROWING_RATE,
  MINIMUM_REDEMPTION_RATE,
} from "./constants";

/**
 * Calculator for fees.
 *
 * @remarks
 * Returned by the {@link ReadableRolliq.getFees | getFees()} function.
 *
 * @public
 */
export class Fees {
  /** @internal */
  constructor(
    baseRateWithoutDecay,
    minuteDecayFactor,
    beta,
    lastFeeOperation,
    timeOfLatestBlock,
    recoveryMode
  ) {
    this._baseRateWithoutDecay = Decimal.from(baseRateWithoutDecay);
    this._minuteDecayFactor = Decimal.from(minuteDecayFactor);
    this._beta = Decimal.from(beta);
    this._lastFeeOperation = lastFeeOperation;
    this._timeOfLatestBlock = timeOfLatestBlock;
    this._recoveryMode = recoveryMode;

    assert(this._minuteDecayFactor.lt(1));
  }

  /** @internal */
  _setRecoveryMode(recoveryMode) {
    return new Fees(
      this._baseRateWithoutDecay,
      this._minuteDecayFactor,
      this._beta,
      this._lastFeeOperation,
      this._timeOfLatestBlock,
      recoveryMode
    );
  }

  /**
   * Compare to another instance of `Fees`.
   */
  equals(that) {
    return (
      this._baseRateWithoutDecay.eq(that._baseRateWithoutDecay) &&
      this._minuteDecayFactor.eq(that._minuteDecayFactor) &&
      this._beta.eq(that._beta) &&
      this._lastFeeOperation.getTime() === that._lastFeeOperation.getTime() &&
      this._timeOfLatestBlock.getTime() === that._timeOfLatestBlock.getTime() &&
      this._recoveryMode === that._recoveryMode
    );
  }

  /** @internal */
  toString() {
    return (
      `{ baseRateWithoutDecay: ${this._baseRateWithoutDecay}` +
      `, lastFeeOperation: "${this._lastFeeOperation.toLocaleString()}"` +
      `, recoveryMode: ${this._recoveryMode} } `
    );
  }

  /** @internal */
  baseRate(when = this._timeOfLatestBlock) {
    const millisecondsSinceLastFeeOperation = Math.max(
      when.getTime() - this._lastFeeOperation.getTime(),
      0 // Clamp negative elapsed time to 0, in case the client's time is in the past.
      // We will calculate slightly higher than actual fees, which is fine.
    );

    const minutesSinceLastFeeOperation = Math.floor(
      millisecondsSinceLastFeeOperation / 60000
    );

    return this._minuteDecayFactor
      .pow(minutesSinceLastFeeOperation)
      .mul(this._baseRateWithoutDecay);
  }

  /**
   * Calculate the current borrowing rate.
   *
   * @param when - Optional timestamp that can be used to calculate what the borrowing rate would
   *               decay to at a point of time in the future.
   *
   * @remarks
   * By default, the fee is calculated at the time of the latest block. This can be overridden using
   * the `when` parameter.
   *
   * To calculate the borrowing fee in RUSD, multiply the borrowed RUSD amount by the borrowing rate.
   *
   * @example
   * ```typescript
   * const fees = await rolliq.getFees();
   *
   * const borrowedRUSDAmount = 100;
   * const borrowingRate = fees.borrowingRate();
   * const borrowingFeeRUSD = borrowingRate.mul(borrowedRUSDAmount);
   * ```
   */
  borrowingRate(when) {
    return this._recoveryMode
      ? Decimal.ZERO
      : Decimal.min(
          MINIMUM_BORROWING_RATE.add(this.baseRate(when)),
          MAXIMUM_BORROWING_RATE
        );
  }

  /**
   * Calculate the current redemption rate.
   *
   * @param redeemedFractionOfSupply - The amount of RUSD being redeemed divided by the total supply.
   * @param when - Optional timestamp that can be used to calculate what the redemption rate would
   *               decay to at a point of time in the future.
   *
   * @remarks
   * By default, the fee is calculated at the time of the latest block. This can be overridden using
   * the `when` parameter.

   * Unlike the borrowing rate, the redemption rate depends on the amount being redeemed. To be more
   * precise, it depends on the fraction of the redeemed amount compared to the total RUSD supply,
   * which must be passed as a parameter.
   *
   * To calculate the redemption fee in RUSD, multiply the redeemed RUSD amount with the redemption
   * rate.
   *
   * @example
   * ```typescript
   * const fees = await rolliq.getFees();
   * const total = await rolliq.getTotal();
   *
   * const redeemedRUSDAmount = Decimal.from(100);
   * const redeemedFractionOfSupply = redeemedRUSDAmount.div(total.debt);
   * const redemptionRate = fees.redemptionRate(redeemedFractionOfSupply);
   * const redemptionFeeRUSD = redemptionRate.mul(redeemedRUSDAmount);
   * ```
   */
  redemptionRate(redeemedFractionOfSupply = Decimal.ZERO, when) {
    redeemedFractionOfSupply = Decimal.from(redeemedFractionOfSupply);
    let baseRate = this.baseRate(when);

    if (redeemedFractionOfSupply.nonZero) {
      baseRate = redeemedFractionOfSupply.div(this._beta).add(baseRate);
    }

    return Decimal.min(MINIMUM_REDEMPTION_RATE.add(baseRate), Decimal.ONE);
  }
}
