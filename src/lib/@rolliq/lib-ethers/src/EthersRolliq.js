import { TransactionFailedError } from "../../lib-base/index";

import { _connect, _usingStore } from "./EthersRolliqConnection";

import { PopulatableEthersRolliq } from "./PopulatableEthersRolliq";
import { ReadableEthersRolliq } from "./ReadableEthersRolliq";
import { SendableEthersRolliq } from "./SendableEthersRolliq";

/**
 * Thrown by {@link EthersRolliq} in case of transaction failure.
 *
 * @public
 */
export class EthersTransactionFailedError extends TransactionFailedError {
  constructor(message, failedReceipt) {
    super("EthersTransactionFailedError", message, failedReceipt);
  }
}

const waitForSuccess = async (tx) => {
  const receipt = await tx.waitForReceipt();

  if (receipt.status !== "succeeded") {
    throw new EthersTransactionFailedError("Transaction failed", receipt);
  }

  return receipt.details;
};

/**
 * Convenience class that combines multiple interfaces of the library in one object.
 *
 * @public
 */
export class EthersRolliq {
  /** @internal */
  constructor(readable) {
    this._readable = readable;
    this.connection = readable.connection;
    this.populate = new PopulatableEthersRolliq(readable);
    this.send = new SendableEthersRolliq(this.populate);
  }

  /** @internal */
  static _from(connection) {
    if (_usingStore(connection)) {
      return new _EthersRolliqWithStore(ReadableEthersRolliq._from(connection));
    } else {
      return new EthersRolliq(ReadableEthersRolliq._from(connection));
    }
  }

  static async connect(signerOrProvider, optionalParams) {
    return EthersRolliq._from(await _connect(signerOrProvider, optionalParams));
  }

  hasStore() {
    return false;
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalRedistributed} */
  getTotalRedistributed(overrides) {
    return this._readable.getTotalRedistributed(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTroveBeforeRedistribution} */
  getTroveBeforeRedistribution(address, overrides) {
    return this._readable.getTroveBeforeRedistribution(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTrove} */
  getTrove(address, overrides) {
    return this._readable.getTrove(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getNumberOfTroves} */
  getNumberOfTroves(overrides) {
    return this._readable.getNumberOfTroves(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getPrice} */
  getPrice(overrides) {
    return this._readable.getPrice(overrides);
  }

  /** @internal */
  _getActivePool(overrides) {
    return this._readable._getActivePool(overrides);
  }

  /** @internal */
  _getDefaultPool(overrides) {
    return this._readable._getDefaultPool(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotal} */
  getTotal(overrides) {
    return this._readable.getTotal(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getStabilityDeposit} */
  getStabilityDeposit(address, overrides) {
    return this._readable.getStabilityDeposit(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRemainingStabilityPoolRIQReward} */
  getRemainingStabilityPoolRIQReward(overrides) {
    return this._readable.getRemainingStabilityPoolRIQReward(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRUSDInStabilityPool} */
  getRUSDInStabilityPool(overrides) {
    return this._readable.getRUSDInStabilityPool(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRUSDBalance} */
  getRUSDBalance(address, overrides) {
    return this._readable.getRUSDBalance(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRIQBalance} */
  getRIQBalance(address, overrides) {
    return this._readable.getRIQBalance(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getUniTokenBalance} */
  getUniTokenBalance(address, overrides) {
    return this._readable.getUniTokenBalance(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getUniTokenAllowance} */
  getUniTokenAllowance(address, overrides) {
    return this._readable.getUniTokenAllowance(address, overrides);
  }

  /** @internal */
  _getRemainingLiquidityMiningRIQRewardCalculator(overrides) {
    return this._readable._getRemainingLiquidityMiningRIQRewardCalculator(
      overrides
    );
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRemainingLiquidityMiningRIQReward} */
  getRemainingLiquidityMiningRIQReward(overrides) {
    return this._readable.getRemainingLiquidityMiningRIQReward(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getLiquidityMiningStake} */
  getLiquidityMiningStake(address, overrides) {
    return this._readable.getLiquidityMiningStake(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalStakedUniTokens} */
  getTotalStakedUniTokens(overrides) {
    return this._readable.getTotalStakedUniTokens(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getLiquidityMiningRIQReward} */
  getLiquidityMiningRIQReward(address, overrides) {
    return this._readable.getLiquidityMiningRIQReward(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getCollateralSurplusBalance} */
  getCollateralSurplusBalance(address, overrides) {
    return this._readable.getCollateralSurplusBalance(address, overrides);
  }

  getTroves(params, overrides) {
    return this._readable.getTroves(params, overrides);
  }

  /** @internal */
  _getBlockTimestamp(blockTag) {
    return this._readable._getBlockTimestamp(blockTag);
  }

  /** @internal */
  _getFeesFactory(overrides) {
    return this._readable._getFeesFactory(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getFees} */
  getFees(overrides) {
    return this._readable.getFees(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRIQStake} */
  getRIQStake(address, overrides) {
    return this._readable.getRIQStake(address, overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalStakedRIQ} */
  getTotalStakedRIQ(overrides) {
    return this._readable.getTotalStakedRIQ(overrides);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getFrontendStatus} */
  getFrontendStatus(address, overrides) {
    return this._readable.getFrontendStatus(address, overrides);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.openTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  openTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    return this.send
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.closeTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  closeTrove(overrides) {
    return this.send.closeTrove(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.adjustTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    return this.send
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.depositCollateral}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  depositCollateral(amount, overrides) {
    return this.send.depositCollateral(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.withdrawCollateral}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawCollateral(amount, overrides) {
    return this.send.withdrawCollateral(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.borrowRUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  borrowRUSD(amount, maxBorrowingRate, overrides) {
    return this.send
      .borrowRUSD(amount, maxBorrowingRate, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.repayRUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  repayRUSD(amount, overrides) {
    return this.send.repayRUSD(amount, overrides).then(waitForSuccess);
  }

  /** @internal */
  setPrice(price, overrides) {
    return this.send.setPrice(price, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.liquidate}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  liquidate(address, overrides) {
    return this.send.liquidate(address, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.liquidateUpTo}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
    return this.send
      .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.depositRUSDInStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  depositRUSDInStabilityPool(amount, frontendTag, overrides) {
    return this.send
      .depositRUSDInStabilityPool(amount, frontendTag, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.withdrawRUSDFromStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawRUSDFromStabilityPool(amount, overrides) {
    return this.send
      .withdrawRUSDFromStabilityPool(amount, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.withdrawGainsFromStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGainsFromStabilityPool(overrides) {
    return this.send
      .withdrawGainsFromStabilityPool(overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.transferCollateralGainToTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  transferCollateralGainToTrove(overrides) {
    return this.send
      .transferCollateralGainToTrove(overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.sendRUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  sendRUSD(toAddress, amount, overrides) {
    return this.send
      .sendRUSD(toAddress, amount, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.sendRIQ}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  sendRIQ(toAddress, amount, overrides) {
    return this.send.sendRIQ(toAddress, amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.redeemRUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  redeemRUSD(amount, maxRedemptionRate, overrides) {
    return this.send
      .redeemRUSD(amount, maxRedemptionRate, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.claimCollateralSurplus}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  claimCollateralSurplus(overrides) {
    return this.send.claimCollateralSurplus(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.stakeRIQ}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  stakeRIQ(amount, overrides) {
    return this.send.stakeRIQ(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.unstakeRIQ}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  unstakeRIQ(amount, overrides) {
    return this.send.unstakeRIQ(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.withdrawGainsFromStaking}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGainsFromStaking(overrides) {
    return this.send.withdrawGainsFromStaking(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.registerFrontend}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  registerFrontend(kickbackRate, overrides) {
    return this.send
      .registerFrontend(kickbackRate, overrides)
      .then(waitForSuccess);
  }

  /** @internal */
  _mintUniToken(amount, address, overrides) {
    return this.send
      ._mintUniToken(amount, address, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.approveUniTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  approveUniTokens(allowance, overrides) {
    return this.send
      .approveUniTokens(allowance, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.stakeUniTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  stakeUniTokens(amount, overrides) {
    return this.send.stakeUniTokens(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.unstakeUniTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  unstakeUniTokens(amount, overrides) {
    return this.send.unstakeUniTokens(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.withdrawRIQRewardFromLiquidityMining}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawRIQRewardFromLiquidityMining(overrides) {
    return this.send
      .withdrawRIQRewardFromLiquidityMining(overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc @rolliq/lib-base#TransactableRolliq.exitLiquidityMining}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  exitLiquidityMining(overrides) {
    return this.send.exitLiquidityMining(overrides).then(waitForSuccess);
  }
}

class _EthersRolliqWithStore extends EthersRolliq {
  constructor(readable) {
    super(readable);

    this.store = readable.store;
  }

  hasStore(store) {
    return store === undefined || store === this.connection.useStore;
  }
}
