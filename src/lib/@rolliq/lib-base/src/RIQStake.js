import { Decimal } from "./Decimal";

/** 
 * Represents a user's RIQ stake and accrued gains.
 * 
 * @remarks
 * Returned by the {@link ReadableRolliq.getRIQStake | getRIQStake()} function.

 * @public
 */
export class RIQStake {
  /** @internal */
  constructor(
    stakedRIQ = Decimal.ZERO,
    collateralGain = Decimal.ZERO,
    rusdGain = Decimal.ZERO
  ) {
    this.stakedRIQ = stakedRIQ;
    this.collateralGain = collateralGain;
    this.rusdGain = rusdGain;
  }

  get isEmpty() {
    return (
      this.stakedRIQ.isZero &&
      this.collateralGain.isZero &&
      this.rusdGain.isZero
    );
  }

  /** @internal */
  toString() {
    return (
      `{ stakedRIQ: ${this.stakedRIQ}` +
      `, collateralGain: ${this.collateralGain}` +
      `, rusdGain: ${this.rusdGain} }`
    );
  }

  /**
   * Compare to another instance of `RIQStake`.
   */
  equals(that) {
    return (
      this.stakedRIQ.eq(that.stakedRIQ) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.rusdGain.eq(that.rusdGain)
    );
  }

  /**
   * Calculate the difference between this `RIQStake` and `thatStakedRIQ`.
   *
   * @returns An object representing the change, or `undefined` if the staked amounts are equal.
   */
  whatChanged(thatStakedRIQ) {
    thatStakedRIQ = Decimal.from(thatStakedRIQ);

    if (thatStakedRIQ.lt(this.stakedRIQ)) {
      return {
        unstakeRIQ: this.stakedRIQ.sub(thatStakedRIQ),
        unstakeAllRIQ: thatStakedRIQ.isZero,
      };
    }

    if (thatStakedRIQ.gt(this.stakedRIQ)) {
      return { stakeRIQ: thatStakedRIQ.sub(this.stakedRIQ) };
    }
  }

  /**
   * Apply a {@link RIQStakeChange} to this `RIQStake`.
   *
   * @returns The new staked RIQ amount.
   */
  apply(change) {
    if (!change) {
      return this.stakedRIQ;
    }

    if (change.unstakeRIQ !== undefined) {
      return change.unstakeAllRIQ || this.stakedRIQ.lte(change.unstakeRIQ)
        ? Decimal.ZERO
        : this.stakedRIQ.sub(change.unstakeRIQ);
    } else {
      return this.stakedRIQ.add(change.stakeRIQ);
    }
  }
}
