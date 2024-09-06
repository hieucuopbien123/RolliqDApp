import { Decimal } from "./Decimal";

/**
 * A Stability Deposit and its accrued gains.
 *
 * @public
 */
export class StabilityDeposit {
  /** @internal */
  constructor(
    initialRUSD,
    currentRUSD,
    collateralGain,
    riqReward,
    frontendTag
  ) {
    this.initialRUSD = initialRUSD;
    this.currentRUSD = currentRUSD;
    this.collateralGain = collateralGain;
    this.riqReward = riqReward;
    this.frontendTag = frontendTag;

    if (this.currentRUSD.gt(this.initialRUSD)) {
      throw new Error("currentRUSD can't be greater than initialRUSD");
    }
  }

  get isEmpty() {
    return (
      this.initialRUSD.isZero &&
      this.currentRUSD.isZero &&
      this.collateralGain.isZero &&
      this.riqReward.isZero
    );
  }

  /** @internal */
  toString() {
    return (
      `{ initialRUSD: ${this.initialRUSD}` +
      `, currentRUSD: ${this.currentRUSD}` +
      `, collateralGain: ${this.collateralGain}` +
      `, riqReward: ${this.riqReward}` +
      `, frontendTag: "${this.frontendTag}" }`
    );
  }

  /**
   * Compare to another instance of `StabilityDeposit`.
   */
  equals(that) {
    return (
      this.initialRUSD.eq(that.initialRUSD) &&
      this.currentRUSD.eq(that.currentRUSD) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.riqReward.eq(that.riqReward) &&
      this.frontendTag === that.frontendTag
    );
  }

  /**
   * Calculate the difference between the `currentRUSD` in this Stability Deposit and `thatRUSD`.
   *
   * @returns An object representing the change, or `undefined` if the deposited amounts are equal.
   */
  whatChanged(thatRUSD) {
    thatRUSD = Decimal.from(thatRUSD);

    if (thatRUSD.lt(this.currentRUSD)) {
      return {
        withdrawRUSD: this.currentRUSD.sub(thatRUSD),
        withdrawAllRUSD: thatRUSD.isZero,
      };
    }

    if (thatRUSD.gt(this.currentRUSD)) {
      return { depositRUSD: thatRUSD.sub(this.currentRUSD) };
    }
  }

  /**
   * Apply a {@link StabilityDepositChange} to this Stability Deposit.
   *
   * @returns The new deposited RUSD amount.
   */
  apply(change) {
    if (!change) {
      return this.currentRUSD;
    }

    if (change.withdrawRUSD !== undefined) {
      return change.withdrawAllRUSD || this.currentRUSD.lte(change.withdrawRUSD)
        ? Decimal.ZERO
        : this.currentRUSD.sub(change.withdrawRUSD);
    } else {
      return this.currentRUSD.add(change.depositRUSD);
    }
  }
}
