import assert from "assert";

import { AddressZero } from "@ethersproject/constants";
import { ErrorCode } from "@ethersproject/logger";

import {
  Decimal,
  RUSD_MINIMUM_DEBT,
  RUSD_MINIMUM_NET_DEBT,
  Trove,
  TroveWithPendingRedistribution,
  _failedReceipt,
  _normalizeTroveAdjustment,
  _normalizeTroveCreation,
  _pendingReceipt,
  _successfulReceipt,
} from "../../lib-base/index";

import {
  _getContracts,
  _requireAddress,
  _requireSigner,
} from "./EthersRolliqConnection";

import { decimalify, promiseAllValues } from "./_utils";
import { _priceFeedIsTestnet, _uniTokenIsMock } from "./contracts";
import { logsToString } from "./parseLogs";

const bigNumberMax = (a, b) => (b?.gt(a) ? b : a);

// With 70 iterations redemption costs about ~10M gas, and each iteration accounts for ~138k more
/** @internal */
export const _redeemMaxIterations = 70;

const defaultBorrowingRateSlippageTolerance = Decimal.from(0.005); // 0.5%
const defaultRedemptionRateSlippageTolerance = Decimal.from(0.001); // 0.1%
const defaultBorrowingFeeDecayToleranceMinutes = 10;

const noDetails = () => undefined;

const compose = (f, g) => (_) => f(g(_));

const id = (t) => t;

// Takes ~6-7K (use 10K to be safe) to update lastFeeOperationTime, but the cost of calculating the
// decayed baseRate increases logarithmically with time elapsed since the last update.
const addGasForBaseRateUpdate =
  (maxMinutesSinceLastUpdate = 10) =>
  (gas) =>
    gas.add(10000 + 1414 * Math.ceil(Math.log2(maxMinutesSinceLastUpdate + 1)));

// First traversal in ascending direction takes ~50K, then ~13.5K per extra step.
// 80K should be enough for 3 steps, plus some extra to be safe.
const addGasForPotentialListTraversal = (gas) => gas.add(80000);

const addGasForRIQIssuance = (gas) => gas.add(50000);

const addGasForUnipoolRewardUpdate = (gas) => gas.add(20000);

// To get the best entropy available, we'd do something like:
//
// const bigRandomNumber = () =>
//   BigNumber.from(
//     `0x${Array.from(crypto.getRandomValues(new Uint32Array(8)))
//       .map(u32 => u32.toString(16).padStart(8, "0"))
//       .join("")}`
//   );
//
// However, Window.crypto is browser-specific. Since we only use this for randomly picking Troves
// during the search for hints, Math.random() will do fine, too.
//
// This returns a random integer between 0 and Number.MAX_SAFE_INTEGER
const randomInteger = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

// Maximum number of trials to perform in a single getApproxHint() call. If the number of trials
// required to get a statistically "good" hint is larger than this, the search for the hint will
// be broken up into multiple getApproxHint() calls.
//
// This should be low enough to work with popular public Ethereum providers like Infura without
// triggering any fair use limits.
const maxNumberOfTrialsAtOnce = 2500;

function* generateTrials(totalNumberOfTrials) {
  assert(Number.isInteger(totalNumberOfTrials) && totalNumberOfTrials > 0);

  while (totalNumberOfTrials) {
    const numberOfTrials = Math.min(
      totalNumberOfTrials,
      maxNumberOfTrialsAtOnce
    );
    yield numberOfTrials;

    totalNumberOfTrials -= numberOfTrials;
  }
}

const _RawErrorReason = {};
_RawErrorReason["TRANSACTION_FAILED"] = "transaction failed";
_RawErrorReason["TRANSACTION_CANCELLED"] = "cancelled";
_RawErrorReason["TRANSACTION_REPLACED"] = "replaced";
_RawErrorReason["TRANSACTION_REPRICED"] = "repriced";

export { _RawErrorReason };

const transactionReplacementReasons = [
  _RawErrorReason.TRANSACTION_CANCELLED,
  _RawErrorReason.TRANSACTION_REPLACED,
  _RawErrorReason.TRANSACTION_REPRICED,
];

const hasProp = (o, p) => p in o;

const isTransactionFailedError = (error) =>
  hasProp(error, "code") &&
  error.code === ErrorCode.CALL_EXCEPTION &&
  hasProp(error, "reason") &&
  error.reason === _RawErrorReason.TRANSACTION_FAILED;

const isTransactionReplacedError = (error) =>
  hasProp(error, "code") &&
  error.code === ErrorCode.TRANSACTION_REPLACED &&
  hasProp(error, "reason") &&
  transactionReplacementReasons.includes(error.reason);

/**
 * Thrown when a transaction is cancelled or replaced by a different transaction.
 *
 * @public
 */
export class EthersTransactionCancelledError extends Error {
  /** @internal */
  constructor(rawError) {
    assert(rawError.reason !== _RawErrorReason.TRANSACTION_REPRICED);

    super(`Transaction ${rawError.reason}`);
    this.name = "TransactionCancelledError";
    this.rawReplacementReceipt = rawError.receipt;
    this.rawError = rawError;
  }
}

/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Returned by {@link SendableEthersRolliq} functions.
 *
 * @public
 */
export class SentEthersRolliqTransaction {
  /** @internal */
  constructor(rawSentTransaction, connection, parse) {
    this.rawSentTransaction = rawSentTransaction;
    this._connection = connection;
    this._parse = parse;
  }

  _receiptFrom(rawReceipt) {
    return rawReceipt
      ? rawReceipt.status
        ? _successfulReceipt(rawReceipt, this._parse(rawReceipt), () =>
            logsToString(rawReceipt, _getContracts(this._connection))
          )
        : _failedReceipt(rawReceipt)
      : _pendingReceipt;
  }

  async _waitForRawReceipt(confirmations) {
    try {
      return await this.rawSentTransaction.wait(confirmations);
    } catch (error) {
      if (error instanceof Error) {
        if (isTransactionFailedError(error)) {
          return error.receipt;
        }

        if (isTransactionReplacedError(error)) {
          if (error.cancelled) {
            throw new EthersTransactionCancelledError(error);
          } else {
            return error.receipt;
          }
        }
      }

      throw error;
    }
  }

  /** {@inheritDoc @rolliq/lib-base#SentRolliqTransaction.getReceipt} */
  async getReceipt() {
    return this._receiptFrom(await this._waitForRawReceipt(0));
  }

  /**
   * {@inheritDoc @rolliq/lib-base#SentRolliqTransaction.waitForReceipt}
   *
   * @throws
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  async waitForReceipt() {
    const receipt = this._receiptFrom(await this._waitForRawReceipt());

    assert(receipt.status !== "pending");
    return receipt;
  }
}

const normalizeBorrowingOperationOptionalParams = (
  maxBorrowingRateOrOptionalParams,
  currentBorrowingRate
) => {
  if (maxBorrowingRateOrOptionalParams === undefined) {
    return {
      maxBorrowingRate:
        currentBorrowingRate?.add(defaultBorrowingRateSlippageTolerance) ??
        Decimal.ZERO,
      borrowingFeeDecayToleranceMinutes:
        defaultBorrowingFeeDecayToleranceMinutes,
    };
  } else if (
    typeof maxBorrowingRateOrOptionalParams === "number" ||
    typeof maxBorrowingRateOrOptionalParams === "string" ||
    maxBorrowingRateOrOptionalParams instanceof Decimal
  ) {
    return {
      maxBorrowingRate: Decimal.from(maxBorrowingRateOrOptionalParams),
      borrowingFeeDecayToleranceMinutes:
        defaultBorrowingFeeDecayToleranceMinutes,
    };
  } else {
    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } =
      maxBorrowingRateOrOptionalParams;

    return {
      maxBorrowingRate:
        maxBorrowingRate !== undefined
          ? Decimal.from(maxBorrowingRate)
          : currentBorrowingRate?.add(defaultBorrowingRateSlippageTolerance) ??
            Decimal.ZERO,

      borrowingFeeDecayToleranceMinutes:
        borrowingFeeDecayToleranceMinutes ??
        defaultBorrowingFeeDecayToleranceMinutes,
    };
  }
};

/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Returned by {@link PopulatableEthersRolliq} functions.
 *
 * @public
 */
export class PopulatedEthersRolliqTransaction {
  /** @internal */
  constructor(rawPopulatedTransaction, connection, parse, gasHeadroom) {
    this.rawPopulatedTransaction = rawPopulatedTransaction;
    this._connection = connection;
    this._parse = parse;

    if (gasHeadroom !== undefined) {
      this.gasHeadroom = gasHeadroom;
    }
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatedRolliqTransaction.send} */
  async send() {
    return new SentEthersRolliqTransaction(
      await _requireSigner(this._connection).sendTransaction(
        this.rawPopulatedTransaction
      ),
      this._connection,
      this._parse
    );
  }
}

/**
 * {@inheritDoc @rolliq/lib-base#PopulatedRedemption}
 *
 * @public
 */
export class PopulatedEthersRedemption extends PopulatedEthersRolliqTransaction {
  /** @internal */
  constructor(
    rawPopulatedTransaction,
    connection,
    attemptedRUSDAmount,
    redeemableRUSDAmount,
    increaseAmountByMinimumNetDebt
  ) {
    const { troveManager } = _getContracts(connection);

    super(
      rawPopulatedTransaction,
      connection,

      ({ logs }) =>
        troveManager
          .extractEvents(logs, "Redemption")
          .map(
            ({
              args: {
                _ETHSent,
                _ETHFee,
                _actualRUSDAmount,
                _attemptedRUSDAmount,
              },
            }) => ({
              attemptedRUSDAmount: decimalify(_attemptedRUSDAmount),
              actualRUSDAmount: decimalify(_actualRUSDAmount),
              collateralTaken: decimalify(_ETHSent),
              fee: decimalify(_ETHFee),
            })
          )[0]
    );

    this.attemptedRUSDAmount = attemptedRUSDAmount;
    this.redeemableRUSDAmount = redeemableRUSDAmount;
    this.isTruncated = redeemableRUSDAmount.lt(attemptedRUSDAmount);
    this._increaseAmountByMinimumNetDebt = increaseAmountByMinimumNetDebt;
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatedRedemption.increaseAmountByMinimumNetDebt} */
  increaseAmountByMinimumNetDebt(maxRedemptionRate) {
    if (!this._increaseAmountByMinimumNetDebt) {
      throw new Error(
        "PopulatedEthersRedemption: increaseAmountByMinimumNetDebt() can " +
          "only be called when amount is truncated"
      );
    }

    return this._increaseAmountByMinimumNetDebt(maxRedemptionRate);
  }
}

/**
 * Ethers-based implementation of {@link @rolliq/lib-base#PopulatableRolliq}.
 *
 * @public
 */
export class PopulatableEthersRolliq {
  constructor(readable) {
    this._readable = readable;
  }

  _wrapSimpleTransaction(rawPopulatedTransaction) {
    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,
      noDetails
    );
  }

  _wrapTroveChangeWithFees(params, rawPopulatedTransaction, gasHeadroom) {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const [newTrove] = borrowerOperations
          .extractEvents(logs, "TroveUpdated")
          .map(
            ({ args: { _coll, _debt } }) =>
              new Trove(decimalify(_coll), decimalify(_debt))
          );

        const [fee] = borrowerOperations
          .extractEvents(logs, "RUSDBorrowingFeePaid")
          .map(({ args: { _RUSDFee } }) => decimalify(_RUSDFee));

        return {
          params,
          newTrove,
          fee,
        };
      },

      gasHeadroom
    );
  }

  async _wrapTroveClosure(rawPopulatedTransaction) {
    const { activePool, rusdToken } = _getContracts(this._readable.connection);

    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs, from: userAddress }) => {
        const [repayRUSD] = rusdToken
          .extractEvents(logs, "Transfer")
          .filter(
            ({ args: { from, to } }) =>
              from === userAddress && to === AddressZero
          )
          .map(({ args: { value } }) => decimalify(value));

        const [withdrawCollateral] = activePool
          .extractEvents(logs, "EtherSent")
          .filter(({ args: { _to } }) => _to === userAddress)
          .map(({ args: { _amount } }) => decimalify(_amount));

        return {
          params: repayRUSD.nonZero
            ? { withdrawCollateral, repayRUSD }
            : { withdrawCollateral },
        };
      }
    );
  }

  _wrapLiquidation(rawPopulatedTransaction) {
    const { troveManager } = _getContracts(this._readable.connection);

    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const liquidatedAddresses = troveManager
          .extractEvents(logs, "TroveLiquidated")
          .map(({ args: { _borrower } }) => _borrower);

        const [totals] = troveManager
          .extractEvents(logs, "Liquidation")
          .map(
            ({
              args: {
                _RUSDGasCompensation,
                _collGasCompensation,
                _liquidatedColl,
                _liquidatedDebt,
              },
            }) => ({
              collateralGasCompensation: decimalify(_collGasCompensation),
              rusdGasCompensation: decimalify(_RUSDGasCompensation),
              totalLiquidated: new Trove(
                decimalify(_liquidatedColl),
                decimalify(_liquidatedDebt)
              ),
            })
          );

        return {
          liquidatedAddresses,
          ...totals,
        };
      }
    );
  }

  _extractStabilityPoolGainsWithdrawalDetails(logs) {
    const { stabilityPool } = _getContracts(this._readable.connection);

    const [newRUSDDeposit] = stabilityPool
      .extractEvents(logs, "UserDepositChanged")
      .map(({ args: { _newDeposit } }) => decimalify(_newDeposit));

    const [[collateralGain, rusdLoss]] = stabilityPool
      .extractEvents(logs, "ETHGainWithdrawn")
      .map(({ args: { _ETH, _RUSDLoss } }) => [
        decimalify(_ETH),
        decimalify(_RUSDLoss),
      ]);

    const [riqReward] = stabilityPool
      .extractEvents(logs, "RIQPaidToDepositor")
      .map(({ args: { _RIQ } }) => decimalify(_RIQ));

    return {
      rusdLoss,
      newRUSDDeposit,
      collateralGain,
      riqReward,
    };
  }

  _wrapStabilityPoolGainsWithdrawal(rawPopulatedTransaction) {
    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,
      ({ logs }) => this._extractStabilityPoolGainsWithdrawalDetails(logs)
    );
  }

  _wrapStabilityDepositTopup(change, rawPopulatedTransaction) {
    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => ({
        ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
        change,
      })
    );
  }

  async _wrapStabilityDepositWithdrawal(rawPopulatedTransaction) {
    const { stabilityPool, rusdToken } = _getContracts(
      this._readable.connection
    );

    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs, from: userAddress }) => {
        const gainsWithdrawalDetails =
          this._extractStabilityPoolGainsWithdrawalDetails(logs);

        const [withdrawRUSD] = rusdToken
          .extractEvents(logs, "Transfer")
          .filter(
            ({ args: { from, to } }) =>
              from === stabilityPool.address && to === userAddress
          )
          .map(({ args: { value } }) => decimalify(value));

        return {
          ...gainsWithdrawalDetails,
          change: {
            withdrawRUSD,
            withdrawAllRUSD: gainsWithdrawalDetails.newRUSDDeposit.isZero,
          },
        };
      }
    );
  }

  _wrapCollateralGainTransfer(rawPopulatedTransaction) {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return new PopulatedEthersRolliqTransaction(
      rawPopulatedTransaction,
      this._readable.connection,

      ({ logs }) => {
        const [newTrove] = borrowerOperations
          .extractEvents(logs, "TroveUpdated")
          .map(
            ({ args: { _coll, _debt } }) =>
              new Trove(decimalify(_coll), decimalify(_debt))
          );

        return {
          ...this._extractStabilityPoolGainsWithdrawalDetails(logs),
          newTrove,
        };
      }
    );
  }

  async _findHintsForNominalCollateralRatio(
    nominalCollateralRatio,
    ownAddress
  ) {
    const { sortedTroves, hintHelpers } = _getContracts(
      this._readable.connection
    );
    const numberOfTroves = await this._readable.getNumberOfTroves();

    if (!numberOfTroves) {
      return [AddressZero, AddressZero];
    }

    if (nominalCollateralRatio.infinite) {
      return [AddressZero, await sortedTroves.getFirst()];
    }

    const totalNumberOfTrials = Math.ceil(10 * Math.sqrt(numberOfTroves));
    const [firstTrials, ...restOfTrials] = generateTrials(totalNumberOfTrials);

    const collectApproxHint = ({ latestRandomSeed, results }, numberOfTrials) =>
      hintHelpers
        .getApproxHint(
          nominalCollateralRatio.hex,
          numberOfTrials,
          latestRandomSeed
        )
        .then(({ latestRandomSeed, ...result }) => ({
          latestRandomSeed,
          results: [...results, result],
        }));

    const { results } = await restOfTrials.reduce(
      (p, numberOfTrials) =>
        p.then((state) => collectApproxHint(state, numberOfTrials)),
      collectApproxHint(
        { latestRandomSeed: randomInteger(), results: [] },
        firstTrials
      )
    );

    const { hintAddress } = results.reduce((a, b) =>
      a.diff.lt(b.diff) ? a : b
    );

    let [prev, next] = await sortedTroves.findInsertPosition(
      nominalCollateralRatio.hex,
      hintAddress,
      hintAddress
    );

    if (ownAddress) {
      // In the case of reinsertion, the address of the Trove being reinserted is not a usable hint,
      // because it is deleted from the list before the reinsertion.
      // "Jump over" the Trove to get the proper hint.
      if (prev === ownAddress) {
        prev = await sortedTroves.getPrev(prev);
      } else if (next === ownAddress) {
        next = await sortedTroves.getNext(next);
      }
    }

    // Don't use `address(0)` as hint as it can result in huge gas cost.
    // (See https://github.com/rolliq/dev/issues/600).
    if (prev === AddressZero) {
      prev = next;
    } else if (next === AddressZero) {
      next = prev;
    }

    return [prev, next];
  }

  async _findHints(trove, ownAddress) {
    if (trove instanceof TroveWithPendingRedistribution) {
      throw new Error("Rewards must be applied to this Trove");
    }

    return this._findHintsForNominalCollateralRatio(
      trove._nominalCollateralRatio,
      ownAddress
    );
  }

  async _findRedemptionHints(amount) {
    const { hintHelpers } = _getContracts(this._readable.connection);
    const price = await this._readable.getPrice();

    const {
      firstRedemptionHint,
      partialRedemptionHintNICR,
      truncatedRUSDamount,
    } = await hintHelpers.getRedemptionHints(
      amount.hex,
      price.hex,
      _redeemMaxIterations
    );

    const [partialRedemptionUpperHint, partialRedemptionLowerHint] =
      partialRedemptionHintNICR.isZero()
        ? [AddressZero, AddressZero]
        : await this._findHintsForNominalCollateralRatio(
            decimalify(partialRedemptionHintNICR)
            // XXX: if we knew the partially redeemed Trove's address, we'd pass it here
          );

    return [
      decimalify(truncatedRUSDamount),
      firstRedemptionHint,
      partialRedemptionUpperHint,
      partialRedemptionLowerHint,
      partialRedemptionHintNICR,
    ];
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.openTrove} */
  async openTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    const normalizedParams = _normalizeTroveCreation(params);
    const { depositCollateral, borrowRUSD } = normalizedParams;

    const [fees, blockTimestamp, total, price] = await Promise.all([
      this._readable._getFeesFactory(),
      this._readable._getBlockTimestamp(),
      this._readable.getTotal(),
      this._readable.getPrice(),
    ]);

    const recoveryMode = total.collateralRatioIsBelowCritical(price);

    const decayBorrowingRate = (seconds) =>
      fees(blockTimestamp + seconds, recoveryMode).borrowingRate();

    const currentBorrowingRate = decayBorrowingRate(0);
    const newTrove = Trove.create(normalizedParams, currentBorrowingRate);
    const hints = await this._findHints(newTrove);

    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } =
      normalizeBorrowingOperationOptionalParams(
        maxBorrowingRateOrOptionalParams,
        currentBorrowingRate
      );

    const txParams = (borrowRUSD) => [
      maxBorrowingRate.hex,
      borrowRUSD.hex,
      ...hints,
      { value: depositCollateral.hex, ...overrides },
    ];

    let gasHeadroom;

    if (overrides?.gasLimit === undefined) {
      const decayedBorrowingRate = decayBorrowingRate(
        60 * borrowingFeeDecayToleranceMinutes
      );
      const decayedTrove = Trove.create(normalizedParams, decayedBorrowingRate);
      const { borrowRUSD: borrowRUSDSimulatingDecay } = Trove.recreate(
        decayedTrove,
        currentBorrowingRate
      );

      if (decayedTrove.debt.lt(RUSD_MINIMUM_DEBT)) {
        throw new Error(
          `Trove's debt might fall below ${RUSD_MINIMUM_DEBT} ` +
            `within ${borrowingFeeDecayToleranceMinutes} minutes`
        );
      }

      const [gasNow, gasLater] = await Promise.all([
        borrowerOperations.estimateGas.openTrove(...txParams(borrowRUSD)),
        borrowerOperations.estimateGas.openTrove(
          ...txParams(borrowRUSDSimulatingDecay)
        ),
      ]);

      const gasLimit = addGasForBaseRateUpdate(
        borrowingFeeDecayToleranceMinutes
      )(bigNumberMax(addGasForPotentialListTraversal(gasNow), gasLater));

      gasHeadroom = gasLimit.sub(gasNow).toNumber();
      overrides = { ...overrides, gasLimit };
    }

    return this._wrapTroveChangeWithFees(
      normalizedParams,
      await borrowerOperations.populateTransaction.openTrove(
        ...txParams(borrowRUSD)
      ),
      gasHeadroom
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.closeTrove} */
  async closeTrove(overrides) {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return this._wrapTroveClosure(
      await borrowerOperations.estimateAndPopulate.closeTrove(
        { ...overrides },
        id
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.depositCollateral} */
  depositCollateral(amount, overrides) {
    return this.adjustTrove(
      { depositCollateral: amount },
      undefined,
      overrides
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.withdrawCollateral} */
  withdrawCollateral(amount, overrides) {
    return this.adjustTrove(
      { withdrawCollateral: amount },
      undefined,
      overrides
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.borrowRUSD} */
  borrowRUSD(amount, maxBorrowingRate, overrides) {
    return this.adjustTrove(
      { borrowRUSD: amount },
      maxBorrowingRate,
      overrides
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.repayRUSD} */
  repayRUSD(amount, overrides) {
    return this.adjustTrove({ repayRUSD: amount }, undefined, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.adjustTrove} */
  async adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    const address = _requireAddress(this._readable.connection, overrides);
    const { borrowerOperations } = _getContracts(this._readable.connection);

    const normalizedParams = _normalizeTroveAdjustment(params);
    const { depositCollateral, withdrawCollateral, borrowRUSD, repayRUSD } =
      normalizedParams;

    const [trove, feeVars] = await Promise.all([
      this._readable.getTrove(address),
      borrowRUSD &&
        promiseAllValues({
          fees: this._readable._getFeesFactory(),
          blockTimestamp: this._readable._getBlockTimestamp(),
          total: this._readable.getTotal(),
          price: this._readable.getPrice(),
        }),
    ]);

    const decayBorrowingRate = (seconds) =>
      feeVars
        ?.fees(
          feeVars.blockTimestamp + seconds,
          feeVars.total.collateralRatioIsBelowCritical(feeVars.price)
        )
        .borrowingRate();

    const currentBorrowingRate = decayBorrowingRate(0);
    const adjustedTrove = trove.adjust(normalizedParams, currentBorrowingRate);
    const hints = await this._findHints(adjustedTrove, address);

    const { maxBorrowingRate, borrowingFeeDecayToleranceMinutes } =
      normalizeBorrowingOperationOptionalParams(
        maxBorrowingRateOrOptionalParams,
        currentBorrowingRate
      );

    const txParams = (borrowRUSD) => [
      maxBorrowingRate.hex,
      (withdrawCollateral ?? Decimal.ZERO).hex,
      (borrowRUSD ?? repayRUSD ?? Decimal.ZERO).hex,
      !!borrowRUSD,
      ...hints,
      { value: depositCollateral?.hex, ...overrides },
    ];

    let gasHeadroom;

    if (overrides?.gasLimit === undefined) {
      const decayedBorrowingRate = decayBorrowingRate(
        60 * borrowingFeeDecayToleranceMinutes
      );
      const decayedTrove = trove.adjust(normalizedParams, decayedBorrowingRate);
      const { borrowRUSD: borrowRUSDSimulatingDecay } = trove.adjustTo(
        decayedTrove,
        currentBorrowingRate
      );

      if (decayedTrove.debt.lt(RUSD_MINIMUM_DEBT)) {
        throw new Error(
          `Trove's debt might fall below ${RUSD_MINIMUM_DEBT} ` +
            `within ${borrowingFeeDecayToleranceMinutes} minutes`
        );
      }

      const [gasNow, gasLater] = await Promise.all([
        borrowerOperations.estimateGas.adjustTrove(...txParams(borrowRUSD)),
        borrowRUSD &&
          borrowerOperations.estimateGas.adjustTrove(
            ...txParams(borrowRUSDSimulatingDecay)
          ),
      ]);

      let gasLimit = bigNumberMax(
        addGasForPotentialListTraversal(gasNow),
        gasLater
      );

      if (borrowRUSD) {
        gasLimit = addGasForBaseRateUpdate(borrowingFeeDecayToleranceMinutes)(
          gasLimit
        );
      }

      gasHeadroom = gasLimit.sub(gasNow).toNumber();
      overrides = { ...overrides, gasLimit };
    }

    return this._wrapTroveChangeWithFees(
      normalizedParams,
      await borrowerOperations.populateTransaction.adjustTrove(
        ...txParams(borrowRUSD)
      ),
      gasHeadroom
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.claimCollateralSurplus} */
  async claimCollateralSurplus(overrides) {
    const { borrowerOperations } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await borrowerOperations.estimateAndPopulate.claimCollateral(
        { ...overrides },
        id
      )
    );
  }

  /** @internal */
  async setPrice(price, overrides) {
    const { priceFeed } = _getContracts(this._readable.connection);

    if (!_priceFeedIsTestnet(priceFeed)) {
      throw new Error("setPrice() unavailable on this deployment of Rolliq");
    }

    return this._wrapSimpleTransaction(
      await priceFeed.estimateAndPopulate.setPrice(
        { ...overrides },
        id,
        Decimal.from(price).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.liquidate} */
  async liquidate(address, overrides) {
    const { troveManager } = _getContracts(this._readable.connection);

    if (Array.isArray(address)) {
      return this._wrapLiquidation(
        await troveManager.estimateAndPopulate.batchLiquidateTroves(
          { ...overrides },
          addGasForRIQIssuance,
          address
        )
      );
    } else {
      return this._wrapLiquidation(
        await troveManager.estimateAndPopulate.liquidate(
          { ...overrides },
          addGasForRIQIssuance,
          address
        )
      );
    }
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.liquidateUpTo} */
  async liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
    const { troveManager } = _getContracts(this._readable.connection);

    return this._wrapLiquidation(
      await troveManager.estimateAndPopulate.liquidateTroves(
        { ...overrides },
        addGasForRIQIssuance,
        maximumNumberOfTrovesToLiquidate
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.depositRUSDInStabilityPool} */
  async depositRUSDInStabilityPool(amount, frontendTag, overrides) {
    const { stabilityPool } = _getContracts(this._readable.connection);
    const depositRUSD = Decimal.from(amount);

    return this._wrapStabilityDepositTopup(
      { depositRUSD },
      await stabilityPool.estimateAndPopulate.provideToSP(
        { ...overrides },
        addGasForRIQIssuance,
        depositRUSD.hex,
        frontendTag ?? this._readable.connection.frontendTag ?? AddressZero
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.withdrawRUSDFromStabilityPool} */
  async withdrawRUSDFromStabilityPool(amount, overrides) {
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapStabilityDepositWithdrawal(
      await stabilityPool.estimateAndPopulate.withdrawFromSP(
        { ...overrides },
        addGasForRIQIssuance,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.withdrawGainsFromStabilityPool} */
  async withdrawGainsFromStabilityPool(overrides) {
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapStabilityPoolGainsWithdrawal(
      await stabilityPool.estimateAndPopulate.withdrawFromSP(
        { ...overrides },
        addGasForRIQIssuance,
        Decimal.ZERO.hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.transferCollateralGainToTrove} */
  async transferCollateralGainToTrove(overrides) {
    const address = _requireAddress(this._readable.connection, overrides);
    const { stabilityPool } = _getContracts(this._readable.connection);

    const [initialTrove, stabilityDeposit] = await Promise.all([
      this._readable.getTrove(address),
      this._readable.getStabilityDeposit(address),
    ]);

    const finalTrove = initialTrove.addCollateral(
      stabilityDeposit.collateralGain
    );

    return this._wrapCollateralGainTransfer(
      await stabilityPool.estimateAndPopulate.withdrawETHGainToTrove(
        { ...overrides },
        compose(addGasForPotentialListTraversal, addGasForRIQIssuance),
        ...(await this._findHints(finalTrove, address))
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.sendRUSD} */
  async sendRUSD(toAddress, amount, overrides) {
    const { rusdToken } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await rusdToken.estimateAndPopulate.transfer(
        { ...overrides },
        id,
        toAddress,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.sendRIQ} */
  async sendRIQ(toAddress, amount, overrides) {
    const { riqToken } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await riqToken.estimateAndPopulate.transfer(
        { ...overrides },
        id,
        toAddress,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.redeemRUSD} */
  async redeemRUSD(amount, maxRedemptionRate, overrides) {
    const { troveManager } = _getContracts(this._readable.connection);
    const attemptedRUSDAmount = Decimal.from(amount);

    const [
      fees,
      total,
      [truncatedAmount, firstRedemptionHint, ...partialHints],
    ] = await Promise.all([
      this._readable.getFees(),
      this._readable.getTotal(),
      this._findRedemptionHints(attemptedRUSDAmount),
    ]);

    if (truncatedAmount.isZero) {
      throw new Error(
        `redeemRUSD: amount too low to redeem (try at least ${RUSD_MINIMUM_NET_DEBT})`
      );
    }

    const defaultMaxRedemptionRate = (amount) =>
      Decimal.min(
        fees
          .redemptionRate(amount.div(total.debt))
          .add(defaultRedemptionRateSlippageTolerance),
        Decimal.ONE
      );

    const populateRedemption = async (
      attemptedRUSDAmount,
      maxRedemptionRate,
      truncatedAmount = attemptedRUSDAmount,
      partialHints = [AddressZero, AddressZero, 0]
    ) => {
      const maxRedemptionRateOrDefault =
        maxRedemptionRate !== undefined
          ? Decimal.from(maxRedemptionRate)
          : defaultMaxRedemptionRate(truncatedAmount);

      return new PopulatedEthersRedemption(
        await troveManager.estimateAndPopulate.redeemCollateral(
          { ...overrides },
          addGasForBaseRateUpdate(),
          truncatedAmount.hex,
          firstRedemptionHint,
          ...partialHints,
          _redeemMaxIterations,
          maxRedemptionRateOrDefault.hex
        ),

        this._readable.connection,
        attemptedRUSDAmount,
        truncatedAmount,

        truncatedAmount.lt(attemptedRUSDAmount)
          ? (newMaxRedemptionRate) =>
              populateRedemption(
                truncatedAmount.add(RUSD_MINIMUM_NET_DEBT),
                newMaxRedemptionRate ?? maxRedemptionRate
              )
          : undefined
      );
    };

    return populateRedemption(
      attemptedRUSDAmount,
      maxRedemptionRate,
      truncatedAmount,
      partialHints
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.stakeRIQ} */
  async stakeRIQ(amount, overrides) {
    const { riqStaking } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await riqStaking.estimateAndPopulate.stake(
        { ...overrides },
        id,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.unstakeRIQ} */
  async unstakeRIQ(amount, overrides) {
    const { riqStaking } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await riqStaking.estimateAndPopulate.unstake(
        { ...overrides },
        id,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(overrides) {
    return this.unstakeRIQ(Decimal.ZERO, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.registerFrontend} */
  async registerFrontend(kickbackRate, overrides) {
    const { stabilityPool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await stabilityPool.estimateAndPopulate.registerFrontEnd(
        { ...overrides },
        id,
        Decimal.from(kickbackRate).hex
      )
    );
  }

  /** @internal */
  async _mintUniToken(amount, address, overrides) {
    address ??= _requireAddress(this._readable.connection, overrides);
    const { uniToken } = _getContracts(this._readable.connection);

    if (!_uniTokenIsMock(uniToken)) {
      throw new Error(
        "_mintUniToken() unavailable on this deployment of Rolliq"
      );
    }

    return this._wrapSimpleTransaction(
      await uniToken.estimateAndPopulate.mint(
        { ...overrides },
        id,
        address,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.approveUniTokens} */
  async approveUniTokens(allowance, overrides) {
    const { uniToken, unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await uniToken.estimateAndPopulate.approve(
        { ...overrides },
        id,
        unipool.address,
        Decimal.from(allowance ?? Decimal.INFINITY).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.stakeUniTokens} */
  async stakeUniTokens(amount, overrides) {
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.stake(
        { ...overrides },
        addGasForUnipoolRewardUpdate,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.unstakeUniTokens} */
  async unstakeUniTokens(amount, overrides) {
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.withdraw(
        { ...overrides },
        addGasForUnipoolRewardUpdate,
        Decimal.from(amount).hex
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.withdrawRIQRewardFromLiquidityMining} */
  async withdrawRIQRewardFromLiquidityMining(overrides) {
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.claimReward(
        { ...overrides },
        addGasForUnipoolRewardUpdate
      )
    );
  }

  /** {@inheritDoc @rolliq/lib-base#PopulatableRolliq.exitLiquidityMining} */
  async exitLiquidityMining(overrides) {
    const { unipool } = _getContracts(this._readable.connection);

    return this._wrapSimpleTransaction(
      await unipool.estimateAndPopulate.withdrawAndClaim(
        { ...overrides },
        addGasForUnipoolRewardUpdate
      )
    );
  }
}
