import assert from "assert";

import { Decimal } from "./Decimal";

import {
  MINIMUM_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
  RUSD_LIQUIDATION_RESERVE,
  MINIMUM_BORROWING_RATE,
} from "./constants";

const invalidTroveCreation = (invalidTrove, error) => ({
  type: "invalidCreation",
  invalidTrove,
  error,
});

const troveCreation = (params) => ({
  type: "creation",
  params,
});

const troveClosure = (params) => ({
  type: "closure",
  params,
});

const troveAdjustment = (params, setToZero) => ({
  type: "adjustment",
  params,
  setToZero,
});

const valueIsDefined = (entry) => entry[1] !== undefined;

const allowedTroveCreationKeys = ["depositCollateral", "borrowRUSD"];

function checkAllowedTroveCreationKeys(entries) {
  const badKeys = entries
    .filter(([k]) => !allowedTroveCreationKeys.includes(k))
    .map(([k]) => `'${k}'`);

  if (badKeys.length > 0) {
    throw new Error(
      `TroveCreationParams: property ${badKeys.join(", ")} not allowed`
    );
  }
}

const troveCreationParamsFromEntries = (entries) => {
  const params = Object.fromEntries(entries);
  const missingKeys = allowedTroveCreationKeys
    .filter((k) => !(k in params))
    .map((k) => `'${k}'`);

  if (missingKeys.length > 0) {
    throw new Error(
      `TroveCreationParams: property ${missingKeys.join(", ")} missing`
    );
  }

  return params;
};

const decimalize = ([k, v]) => [k, Decimal.from(v)];
const nonZero = ([, v]) => !v.isZero;

/** @internal */
export const _normalizeTroveCreation = (params) => {
  const definedEntries = Object.entries(params).filter(valueIsDefined);
  checkAllowedTroveCreationKeys(definedEntries);
  const nonZeroEntries = definedEntries.map(decimalize);

  return troveCreationParamsFromEntries(nonZeroEntries);
};

const allowedTroveAdjustmentKeys = [
  "depositCollateral",
  "withdrawCollateral",
  "borrowRUSD",
  "repayRUSD",
];

function checkAllowedTroveAdjustmentKeys(entries) {
  const badKeys = entries
    .filter(([k]) => !allowedTroveAdjustmentKeys.includes(k))
    .map(([k]) => `'${k}'`);

  if (badKeys.length > 0) {
    throw new Error(
      `TroveAdjustmentParams: property ${badKeys.join(", ")} not allowed`
    );
  }
}

const collateralChangeFrom = ({ depositCollateral, withdrawCollateral }) => {
  if (depositCollateral !== undefined && withdrawCollateral !== undefined) {
    throw new Error(
      "TroveAdjustmentParams: 'depositCollateral' and 'withdrawCollateral' " +
        "can't be present at the same time"
    );
  }

  if (depositCollateral !== undefined) {
    return { depositCollateral };
  }

  if (withdrawCollateral !== undefined) {
    return { withdrawCollateral };
  }
};

const debtChangeFrom = ({ borrowRUSD, repayRUSD }) => {
  if (borrowRUSD !== undefined && repayRUSD !== undefined) {
    throw new Error(
      "TroveAdjustmentParams: 'borrowRUSD' and 'repayRUSD' can't be present at the same time"
    );
  }

  if (borrowRUSD !== undefined) {
    return { borrowRUSD };
  }

  if (repayRUSD !== undefined) {
    return { repayRUSD };
  }
};

const troveAdjustmentParamsFromEntries = (entries) => {
  const params = Object.fromEntries(entries);

  const collateralChange = collateralChangeFrom(params);
  const debtChange = debtChangeFrom(params);

  if (collateralChange !== undefined && debtChange !== undefined) {
    return { ...collateralChange, ...debtChange };
  }

  if (collateralChange !== undefined) {
    return collateralChange;
  }

  if (debtChange !== undefined) {
    return debtChange;
  }

  throw new Error(
    "TroveAdjustmentParams: must include at least one non-zero parameter"
  );
};

/** @internal */
export const _normalizeTroveAdjustment = (params) => {
  const definedEntries = Object.entries(params).filter(valueIsDefined);
  checkAllowedTroveAdjustmentKeys(definedEntries);
  const nonZeroEntries = definedEntries.map(decimalize).filter(nonZero);

  return troveAdjustmentParamsFromEntries(nonZeroEntries);
};

const applyFee = (borrowingRate, debtIncrease) =>
  debtIncrease.mul(Decimal.ONE.add(borrowingRate));

const unapplyFee = (borrowingRate, debtIncrease) =>
  debtIncrease._divCeil(Decimal.ONE.add(borrowingRate));

const NOMINAL_COLLATERAL_RATIO_PRECISION = Decimal.from(100);

/**
 * A combination of collateral and debt.
 *
 * @public
 */
export class Trove {
  /** @internal */
  constructor(collateral = Decimal.ZERO, debt = Decimal.ZERO) {
    this.collateral = collateral;
    this.debt = debt;
  }

  get isEmpty() {
    return this.collateral.isZero && this.debt.isZero;
  }

  /**
   * Amount of RUSD that must be repaid to close this Trove.
   *
   * @remarks
   * This doesn't include the liquidation reserve, which is refunded in case of normal closure.
   */
  get netDebt() {
    if (this.debt.lt(RUSD_LIQUIDATION_RESERVE)) {
      throw new Error(
        `netDebt should not be used when debt < ${RUSD_LIQUIDATION_RESERVE}`
      );
    }

    return this.debt.sub(RUSD_LIQUIDATION_RESERVE);
  }

  /** @internal */
  get _nominalCollateralRatio() {
    return this.collateral.mulDiv(
      NOMINAL_COLLATERAL_RATIO_PRECISION,
      this.debt
    );
  }

  /** Calculate the Trove's collateralization ratio at a given price. */
  collateralRatio(price) {
    return this.collateral.mulDiv(price, this.debt);
  }

  /**
   * Whether the Trove is undercollateralized at a given price.
   *
   * @returns
   * `true` if the Trove's collateralization ratio is less than the
   * {@link MINIMUM_COLLATERAL_RATIO}.
   */
  collateralRatioIsBelowMinimum(price) {
    return this.collateralRatio(price).lt(MINIMUM_COLLATERAL_RATIO);
  }

  /**
   * Whether the collateralization ratio is less than the {@link CRITICAL_COLLATERAL_RATIO} at a
   * given price.
   *
   * @example
   * Can be used to check whether the Rolliq protocol is in recovery mode by using it on the return
   * value of {@link ReadableRolliq.getTotal | getTotal()}. For example:
   *
   * ```typescript
   * const total = await rolliq.getTotal();
   * const price = await rolliq.getPrice();
   *
   * if (total.collateralRatioIsBelowCritical(price)) {
   *   // Recovery mode is active
   * }
   * ```
   */
  collateralRatioIsBelowCritical(price) {
    return this.collateralRatio(price).lt(CRITICAL_COLLATERAL_RATIO);
  }

  /** Whether the Trove is sufficiently collateralized to be opened during recovery mode. */
  isOpenableInRecoveryMode(price) {
    return this.collateralRatio(price).gte(CRITICAL_COLLATERAL_RATIO);
  }

  /** @internal */
  toString() {
    return `{ collateral: ${this.collateral}, debt: ${this.debt} }`;
  }

  equals(that) {
    return this.collateral.eq(that.collateral) && this.debt.eq(that.debt);
  }

  add(that) {
    return new Trove(
      this.collateral.add(that.collateral),
      this.debt.add(that.debt)
    );
  }

  addCollateral(collateral) {
    return new Trove(this.collateral.add(collateral), this.debt);
  }

  addDebt(debt) {
    return new Trove(this.collateral, this.debt.add(debt));
  }

  subtract(that) {
    const { collateral, debt } = that;

    return new Trove(
      this.collateral.gt(collateral)
        ? this.collateral.sub(collateral)
        : Decimal.ZERO,
      this.debt.gt(debt) ? this.debt.sub(debt) : Decimal.ZERO
    );
  }

  subtractCollateral(collateral) {
    return new Trove(
      this.collateral.gt(collateral)
        ? this.collateral.sub(collateral)
        : Decimal.ZERO,
      this.debt
    );
  }

  subtractDebt(debt) {
    return new Trove(
      this.collateral,
      this.debt.gt(debt) ? this.debt.sub(debt) : Decimal.ZERO
    );
  }

  multiply(multiplier) {
    return new Trove(
      this.collateral.mul(multiplier),
      this.debt.mul(multiplier)
    );
  }

  setCollateral(collateral) {
    return new Trove(Decimal.from(collateral), this.debt);
  }

  setDebt(debt) {
    return new Trove(this.collateral, Decimal.from(debt));
  }

  _debtChange({ debt }, borrowingRate) {
    return debt.gt(this.debt)
      ? { borrowRUSD: unapplyFee(borrowingRate, debt.sub(this.debt)) }
      : { repayRUSD: this.debt.sub(debt) };
  }

  _collateralChange({ collateral }) {
    return collateral.gt(this.collateral)
      ? { depositCollateral: collateral.sub(this.collateral) }
      : { withdrawCollateral: this.collateral.sub(collateral) };
  }

  /**
   * Calculate the difference between this Trove and another.
   *
   * @param that - The other Trove.
   * @param borrowingRate - Borrowing rate to use when calculating a borrowed amount.
   *
   * @returns
   * An object representing the change, or `undefined` if the Troves are equal.
   */
  whatChanged(that, borrowingRate = MINIMUM_BORROWING_RATE) {
    if (this.collateral.eq(that.collateral) && this.debt.eq(that.debt)) {
      return undefined;
    }

    if (this.isEmpty) {
      if (that.debt.lt(RUSD_LIQUIDATION_RESERVE)) {
        return invalidTroveCreation(that, "missingLiquidationReserve");
      }

      return troveCreation({
        depositCollateral: that.collateral,
        borrowRUSD: unapplyFee(borrowingRate, that.netDebt),
      });
    }

    if (that.isEmpty) {
      return troveClosure(
        this.netDebt.nonZero
          ? { withdrawCollateral: this.collateral, repayRUSD: this.netDebt }
          : { withdrawCollateral: this.collateral }
      );
    }

    return this.collateral.eq(that.collateral)
    ? troveAdjustment(this._debtChange(that, borrowingRate), that.debt.zero && "debt")
    : this.debt.eq(that.debt)
      ? troveAdjustment(this._collateralChange(that), that.collateral.zero && "collateral")
      : troveAdjustment({
          ...this._debtChange(that, borrowingRate),
          ...this._collateralChange(that)
      }, (_a = (that.debt.zero && "debt")) !== null && _a !== void 0 ? _a : (that.collateral.zero && "collateral"));
  }

  /**
   * Make a new Trove by applying a {@link TroveChange} to this Trove.
   *
   * @param change - The change to apply.
   * @param borrowingRate - Borrowing rate to use when adding a borrowed amount to the Trove's debt.
   */
  apply(change, borrowingRate = MINIMUM_BORROWING_RATE) {
    if (!change) {
      return this;
    }

    switch (change.type) {
      case "invalidCreation":
        if (!this.isEmpty) {
          throw new Error("Can't create onto existing Trove");
        }

        return change.invalidTrove;

      case "creation": {
        if (!this.isEmpty) {
          throw new Error("Can't create onto existing Trove");
        }

        const { depositCollateral, borrowRUSD } = change.params;

        return new Trove(
          depositCollateral,
          RUSD_LIQUIDATION_RESERVE.add(applyFee(borrowingRate, borrowRUSD))
        );
      }

      case "closure":
        if (this.isEmpty) {
          throw new Error("Can't close empty Trove");
        }

        return _emptyTrove;

      case "adjustment": {
        const {
          setToZero,
          params: {
            depositCollateral,
            withdrawCollateral,
            borrowRUSD,
            repayRUSD,
          },
        } = change;

        const collateralDecrease = withdrawCollateral ?? Decimal.ZERO;
        const collateralIncrease = depositCollateral ?? Decimal.ZERO;
        const debtDecrease = repayRUSD ?? Decimal.ZERO;
        const debtIncrease = borrowRUSD
          ? applyFee(borrowingRate, borrowRUSD)
          : Decimal.ZERO;

        return setToZero === "collateral"
          ? this.setCollateral(Decimal.ZERO)
              .addDebt(debtIncrease)
              .subtractDebt(debtDecrease)
          : setToZero === "debt"
          ? this.setDebt(Decimal.ZERO)
              .addCollateral(collateralIncrease)
              .subtractCollateral(collateralDecrease)
          : this.add(new Trove(collateralIncrease, debtIncrease)).subtract(
              new Trove(collateralDecrease, debtDecrease)
            );
      }
    }
  }

  /**
   * Calculate the result of an {@link TransactableRolliq.openTrove | openTrove()} transaction.
   *
   * @param params - Parameters of the transaction.
   * @param borrowingRate - Borrowing rate to use when calculating the Trove's debt.
   */
  static create(params, borrowingRate) {
    return _emptyTrove.apply(
      troveCreation(_normalizeTroveCreation(params)),
      borrowingRate
    );
  }

  /**
   * Calculate the parameters of an {@link TransactableRolliq.openTrove | openTrove()} transaction
   * that will result in the given Trove.
   *
   * @param that - The Trove to recreate.
   * @param borrowingRate - Current borrowing rate.
   */
  static recreate(that, borrowingRate) {
    const change = _emptyTrove.whatChanged(that, borrowingRate);
    assert(change?.type === "creation");
    return change.params;
  }

  /**
   * Calculate the result of an {@link TransactableRolliq.adjustTrove | adjustTrove()} transaction
   * on this Trove.
   *
   * @param params - Parameters of the transaction.
   * @param borrowingRate - Borrowing rate to use when adding to the Trove's debt.
   */
  adjust(params, borrowingRate) {
    return this.apply(
      troveAdjustment(_normalizeTroveAdjustment(params)),
      borrowingRate
    );
  }

  /**
   * Calculate the parameters of an {@link TransactableRolliq.adjustTrove | adjustTrove()}
   * transaction that will change this Trove into the given Trove.
   *
   * @param that - The desired result of the transaction.
   * @param borrowingRate - Current borrowing rate.
   */
  adjustTo(that, borrowingRate) {
    const change = this.whatChanged(that, borrowingRate);
    assert(change?.type === "adjustment");
    return change.params;
  }
}

/** @internal */
export const _emptyTrove = new Trove();

/**
 * A Trove that is associated with a single owner.
 *
 * @remarks
 * The SDK uses the base {@link Trove} class as a generic container of collateral and debt, for
 * example to represent the {@link ReadableRolliq.getTotal | total collateral and debt} locked up
 * in the protocol.
 *
 * The `UserTrove` class extends `Trove` with extra information that's only available for Troves
 * that are associated with a single owner (such as the owner's address, or the Trove's status).
 *
 * @public
 */
export class UserTrove extends Trove {
  /** @internal */
  constructor(ownerAddress, status, collateral, debt) {
    super(collateral, debt);

    this.ownerAddress = ownerAddress;
    this.status = status;
  }

  equals(that) {
    return (
      super.equals(that) &&
      this.ownerAddress === that.ownerAddress &&
      this.status === that.status
    );
  }

  /** @internal */
  toString() {
    return (
      `{ ownerAddress: "${this.ownerAddress}"` +
      `, collateral: ${this.collateral}` +
      `, debt: ${this.debt}` +
      `, status: "${this.status}" }`
    );
  }
}

/**
 * A Trove in its state after the last direct modification.
 *
 * @remarks
 * The Trove may have received collateral and debt shares from liquidations since then.
 * Use {@link TroveWithPendingRedistribution.applyRedistribution | applyRedistribution()} to
 * calculate the Trove's most up-to-date state.
 *
 * @public
 */
export class TroveWithPendingRedistribution extends UserTrove {
  /** @internal */
  constructor(
    ownerAddress,
    status,
    collateral,
    debt,
    stake = Decimal.ZERO,
    snapshotOfTotalRedistributed = _emptyTrove
  ) {
    super(ownerAddress, status, collateral, debt);

    this.stake = stake;
    this.snapshotOfTotalRedistributed = snapshotOfTotalRedistributed;
  }

  applyRedistribution(totalRedistributed) {
    const afterRedistribution = this.add(
      totalRedistributed
        .subtract(this.snapshotOfTotalRedistributed)
        .multiply(this.stake)
    );

    return new UserTrove(
      this.ownerAddress,
      this.status,
      afterRedistribution.collateral,
      afterRedistribution.debt
    );
  }

  equals(that) {
    return (
      super.equals(that) &&
      this.stake.eq(that.stake) &&
      this.snapshotOfTotalRedistributed.equals(
        that.snapshotOfTotalRedistributed
      )
    );
  }
}
