import {
  Decimal,
  Fees,
  RIQStake,
  StabilityDeposit,
  Trove,
  TroveWithPendingRedistribution,
} from "../../lib-base/index";

import { decimalify, numberify, panic } from "./_utils";

import {
  _connect,
  _getBlockTimestamp,
  _getContracts,
  _requireAddress,
  _requireFrontendAddress,
} from "./EthersRolliqConnection";

import { BlockPolledRolliqStore } from "./BlockPolledRolliqStore";

// TODO: these are constant in the contracts, so it doesn't make sense to make a call for them,
// but to avoid having to update them here when we change them in the contracts, we could read
// them once after deployment and save them to RolliqDeployment.
const MINUTE_DECAY_FACTOR = Decimal.from("0.999037758833783000");
const BETA = Decimal.from(2);

var BackendTroveStatus;
(function (BackendTroveStatus) {
  BackendTroveStatus[(BackendTroveStatus["nonExistent"] = 0)] = "nonExistent";
  BackendTroveStatus[(BackendTroveStatus["active"] = 1)] = "active";
  BackendTroveStatus[(BackendTroveStatus["closedByOwner"] = 2)] =
    "closedByOwner";
  BackendTroveStatus[(BackendTroveStatus["closedByLiquidation"] = 3)] =
    "closedByLiquidation";
  BackendTroveStatus[(BackendTroveStatus["closedByRedemption"] = 4)] =
    "closedByRedemption";
})(BackendTroveStatus || (BackendTroveStatus = {}));

const userTroveStatusFrom = (backendStatus) =>
  backendStatus === BackendTroveStatus.nonExistent
    ? "nonExistent"
    : backendStatus === BackendTroveStatus.active
    ? "open"
    : backendStatus === BackendTroveStatus.closedByOwner
    ? "closedByOwner"
    : backendStatus === BackendTroveStatus.closedByLiquidation
    ? "closedByLiquidation"
    : backendStatus === BackendTroveStatus.closedByRedemption
    ? "closedByRedemption"
    : panic(new Error(`invalid backendStatus ${backendStatus}`));

const convertToDate = (timestamp) => new Date(timestamp * 1000);

const validSortingOptions = [
  "ascendingCollateralRatio",
  "descendingCollateralRatio",
];

const expectPositiveInt = (obj, key) => {
  if (obj[key] !== undefined) {
    if (!Number.isInteger(obj[key])) {
      throw new Error(`${key} must be an integer`);
    }

    if (obj[key] < 0) {
      throw new Error(`${key} must not be negative`);
    }
  }
};

/**
 * Ethers-based implementation of {@link @rolliq/lib-base#ReadableRolliq}.
 *
 * @public
 */
export class ReadableEthersRolliq {
  /** @internal */
  constructor(connection) {
    this.connection = connection;
  }

  /** @internal */
  static _from(connection) {
    const readable = new ReadableEthersRolliq(connection);

    return connection.useStore === "blockPolled"
      ? new _BlockPolledReadableEthersRolliq(readable)
      : readable;
  }

  /**
   * Connect to the Rolliq protocol and create a `ReadableEthersRolliq` object.
   *
   * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
   *                           network.
   * @param optionalParams - Optional parameters that can be used to customize the connection.
   */
  static async connect(signerOrProvider, optionalParams) {
    return ReadableEthersRolliq._from(
      await _connect(signerOrProvider, optionalParams)
    );
  }

  hasStore() {
    return false;
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalRedistributed} */
  async getTotalRedistributed(overrides) {
    const { troveManager } = _getContracts(this.connection);

    const [collateral, debt] = await Promise.all([
      troveManager.L_ETH({ ...overrides }).then(decimalify),
      troveManager.L_RUSDDebt({ ...overrides }).then(decimalify),
    ]);

    return new Trove(collateral, debt);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTroveBeforeRedistribution} */
  async getTroveBeforeRedistribution(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { troveManager } = _getContracts(this.connection);

    const [trove, snapshot] = await Promise.all([
      troveManager.Troves(address, { ...overrides }),
      troveManager.rewardSnapshots(address, { ...overrides }),
    ]);

    if (trove.status === BackendTroveStatus.active) {
      return new TroveWithPendingRedistribution(
        address,
        userTroveStatusFrom(trove.status),
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(decimalify(snapshot.ETH), decimalify(snapshot.RUSDDebt))
      );
    } else {
      return new TroveWithPendingRedistribution(
        address,
        userTroveStatusFrom(trove.status)
      );
    }
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTrove} */
  async getTrove(address, overrides) {
    const [trove, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, overrides),
      this.getTotalRedistributed(overrides),
    ]);

    return trove.applyRedistribution(totalRedistributed);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getNumberOfTroves} */
  async getNumberOfTroves(overrides) {
    const { troveManager } = _getContracts(this.connection);

    return (
      await troveManager.getTroveOwnersCount({ ...overrides })
    ).toNumber();
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getPrice} */
  getPrice(overrides) {
    const { priceFeed } = _getContracts(this.connection);

    return priceFeed.callStatic.fetchPrice({ ...overrides }).then(decimalify);
  }

  /** @internal */
  async _getActivePool(overrides) {
    const { activePool } = _getContracts(this.connection);

    const [activeCollateral, activeDebt] = await Promise.all(
      [
        activePool.getETH({ ...overrides }),
        activePool.getRUSDDebt({ ...overrides }),
      ].map((getBigNumber) => getBigNumber.then(decimalify))
    );

    return new Trove(activeCollateral, activeDebt);
  }

  /** @internal */
  async _getDefaultPool(overrides) {
    const { defaultPool } = _getContracts(this.connection);

    const [liquidatedCollateral, closedDebt] = await Promise.all(
      [
        defaultPool.getETH({ ...overrides }),
        defaultPool.getRUSDDebt({ ...overrides }),
      ].map((getBigNumber) => getBigNumber.then(decimalify))
    );

    return new Trove(liquidatedCollateral, closedDebt);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotal} */
  async getTotal(overrides) {
    const [activePool, defaultPool] = await Promise.all([
      this._getActivePool(overrides),
      this._getDefaultPool(overrides),
    ]);

    return activePool.add(defaultPool);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getStabilityDeposit} */
  async getStabilityDeposit(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const [
      { frontEndTag, initialValue },
      currentRUSD,
      collateralGain,
      riqReward,
    ] = await Promise.all([
      stabilityPool.deposits(address, { ...overrides }),
      stabilityPool.getCompoundedRUSDDeposit(address, { ...overrides }),
      stabilityPool.getDepositorETHGain(address, { ...overrides }),
      stabilityPool.getDepositorRIQGain(address, { ...overrides }),
    ]);

    return new StabilityDeposit(
      decimalify(initialValue),
      decimalify(currentRUSD),
      decimalify(collateralGain),
      decimalify(riqReward),
      frontEndTag
    );
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRemainingStabilityPoolRIQReward} */
  async getRemainingStabilityPoolRIQReward(overrides) {
    const { communityIssuance } = _getContracts(this.connection);

    const issuanceCap = this.connection.totalStabilityPoolRIQReward;
    const totalRIQIssued = decimalify(
      await communityIssuance.totalRIQIssued({ ...overrides })
    );

    // totalRIQIssued approaches but never reaches issuanceCap
    return issuanceCap.sub(totalRIQIssued);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRUSDInStabilityPool} */
  getRUSDInStabilityPool(overrides) {
    const { stabilityPool } = _getContracts(this.connection);

    return stabilityPool
      .getTotalRUSDDeposits({ ...overrides })
      .then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRUSDBalance} */
  getRUSDBalance(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { rusdToken } = _getContracts(this.connection);

    return rusdToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRIQBalance} */
  getRIQBalance(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { riqToken } = _getContracts(this.connection);

    return riqToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getUniTokenBalance} */
  getUniTokenBalance(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { uniToken } = _getContracts(this.connection);

    return uniToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getUniTokenAllowance} */
  getUniTokenAllowance(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { uniToken, unipool } = _getContracts(this.connection);

    return uniToken
      .allowance(address, unipool.address, { ...overrides })
      .then(decimalify);
  }

  /** @internal */
  async _getRemainingLiquidityMiningRIQRewardCalculator(overrides) {
    const { unipool } = _getContracts(this.connection);

    const [totalSupply, rewardRate, periodFinish, lastUpdateTime] =
      await Promise.all([
        unipool.totalSupply({ ...overrides }),
        unipool.rewardRate({ ...overrides }).then(decimalify),
        unipool.periodFinish({ ...overrides }).then(numberify),
        unipool.lastUpdateTime({ ...overrides }).then(numberify),
      ]);

    return (blockTimestamp) =>
      rewardRate.mul(
        Math.max(
          0,
          periodFinish -
            (totalSupply.isZero() ? lastUpdateTime : blockTimestamp)
        )
      );
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRemainingLiquidityMiningRIQReward} */
  async getRemainingLiquidityMiningRIQReward(overrides) {
    const [calculateRemainingRIQ, blockTimestamp] = await Promise.all([
      this._getRemainingLiquidityMiningRIQRewardCalculator(overrides),
      this._getBlockTimestamp(overrides?.blockTag),
    ]);

    return calculateRemainingRIQ(blockTimestamp);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getLiquidityMiningStake} */
  getLiquidityMiningStake(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { unipool } = _getContracts(this.connection);

    return unipool.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalStakedUniTokens} */
  getTotalStakedUniTokens(overrides) {
    const { unipool } = _getContracts(this.connection);

    return unipool.totalSupply({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getLiquidityMiningRIQReward} */
  getLiquidityMiningRIQReward(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { unipool } = _getContracts(this.connection);

    return unipool.earned(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getCollateralSurplusBalance} */
  getCollateralSurplusBalance(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { collSurplusPool } = _getContracts(this.connection);

    return collSurplusPool
      .getCollateral(address, { ...overrides })
      .then(decimalify);
  }

  async getTroves(params, overrides) {
    const { multiTroveGetter } = _getContracts(this.connection);

    expectPositiveInt(params, "first");
    expectPositiveInt(params, "startingAt");

    if (!validSortingOptions.includes(params.sortedBy)) {
      throw new Error(
        `sortedBy must be one of: ${validSortingOptions
          .map((x) => `"${x}"`)
          .join(", ")}`
      );
    }

    const [totalRedistributed, backendTroves] = await Promise.all([
      params.beforeRedistribution
        ? undefined
        : this.getTotalRedistributed({ ...overrides }),
      multiTroveGetter.getMultipleSortedTroves(
        params.sortedBy === "descendingCollateralRatio"
          ? params.startingAt ?? 0
          : -((params.startingAt ?? 0) + 1),
        params.first,
        { ...overrides }
      ),
    ]);

    const troves = mapBackendTroves(backendTroves);

    if (totalRedistributed) {
      return troves.map((trove) =>
        trove.applyRedistribution(totalRedistributed)
      );
    } else {
      return troves;
    }
  }

  /** @internal */
  _getBlockTimestamp(blockTag) {
    return _getBlockTimestamp(this.connection, blockTag);
  }

  /** @internal */
  async _getFeesFactory(overrides) {
    const { troveManager } = _getContracts(this.connection);

    const [lastFeeOperationTime, baseRateWithoutDecay] = await Promise.all([
      troveManager.lastFeeOperationTime({ ...overrides }),
      troveManager.baseRate({ ...overrides }).then(decimalify),
    ]);

    return (blockTimestamp, recoveryMode) =>
      new Fees(
        baseRateWithoutDecay,
        MINUTE_DECAY_FACTOR,
        BETA,
        convertToDate(lastFeeOperationTime.toNumber()),
        convertToDate(blockTimestamp),
        recoveryMode
      );
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getFees} */
  async getFees(overrides) {
    const [createFees, total, price, blockTimestamp] = await Promise.all([
      this._getFeesFactory(overrides),
      this.getTotal(overrides),
      this.getPrice(overrides),
      this._getBlockTimestamp(overrides?.blockTag),
    ]);

    return createFees(
      blockTimestamp,
      total.collateralRatioIsBelowCritical(price)
    );
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getRIQStake} */
  async getRIQStake(address, overrides) {
    address ??= _requireAddress(this.connection);
    const { riqStaking } = _getContracts(this.connection);

    const [stakedRIQ, collateralGain, rusdGain] = await Promise.all(
      [
        riqStaking.stakes(address, { ...overrides }),
        riqStaking.getPendingETHGain(address, { ...overrides }),
        riqStaking.getPendingRUSDGain(address, { ...overrides }),
      ].map((getBigNumber) => getBigNumber.then(decimalify))
    );

    return new RIQStake(stakedRIQ, collateralGain, rusdGain);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getTotalStakedRIQ} */
  async getTotalStakedRIQ(overrides) {
    const { riqStaking } = _getContracts(this.connection);

    return riqStaking.totalRIQStaked({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc @rolliq/lib-base#ReadableRolliq.getFrontendStatus} */
  async getFrontendStatus(address, overrides) {
    address ??= _requireFrontendAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const { registered, kickbackRate } = await stabilityPool.frontEnds(
      address,
      { ...overrides }
    );

    return registered
      ? { status: "registered", kickbackRate: decimalify(kickbackRate) }
      : { status: "unregistered" };
  }
}

const mapBackendTroves = (troves) =>
  troves.map(
    (trove) =>
      new TroveWithPendingRedistribution(
        trove.owner,
        "open", // These Troves are coming from the SortedTroves list, so they must be open
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(
          decimalify(trove.snapshotETH),
          decimalify(trove.snapshotRUSDDebt)
        )
      )
  );

class _BlockPolledReadableEthersRolliq {
  constructor(readable) {
    const store = new BlockPolledRolliqStore(readable);

    this.store = store;
    this.connection = readable.connection;
    this._readable = readable;
  }

  _blockHit(overrides) {
    return (
      !overrides ||
      overrides.blockTag === undefined ||
      overrides.blockTag === this.store.state.blockTag
    );
  }

  _userHit(address, overrides) {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.userAddress)
    );
  }

  _frontendHit(address, overrides) {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.frontendTag)
    );
  }

  hasStore(store) {
    return store === undefined || store === "blockPolled";
  }

  async getTotalRedistributed(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.totalRedistributed
      : this._readable.getTotalRedistributed(overrides);
  }

  async getTroveBeforeRedistribution(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.troveBeforeRedistribution
      : this._readable.getTroveBeforeRedistribution(address, overrides);
  }

  async getTrove(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.trove
      : this._readable.getTrove(address, overrides);
  }

  async getNumberOfTroves(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.numberOfTroves
      : this._readable.getNumberOfTroves(overrides);
  }

  async getPrice(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.price
      : this._readable.getPrice(overrides);
  }

  async getTotal(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.total
      : this._readable.getTotal(overrides);
  }

  async getStabilityDeposit(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.stabilityDeposit
      : this._readable.getStabilityDeposit(address, overrides);
  }

  async getRemainingStabilityPoolRIQReward(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.remainingStabilityPoolRIQReward
      : this._readable.getRemainingStabilityPoolRIQReward(overrides);
  }

  async getRUSDInStabilityPool(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.rusdInStabilityPool
      : this._readable.getRUSDInStabilityPool(overrides);
  }

  async getRUSDBalance(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.rusdBalance
      : this._readable.getRUSDBalance(address, overrides);
  }

  async getRIQBalance(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.riqBalance
      : this._readable.getRIQBalance(address, overrides);
  }

  async getUniTokenBalance(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.uniTokenBalance
      : this._readable.getUniTokenBalance(address, overrides);
  }

  async getUniTokenAllowance(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.uniTokenAllowance
      : this._readable.getUniTokenAllowance(address, overrides);
  }

  async getRemainingLiquidityMiningRIQReward(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.remainingLiquidityMiningRIQReward
      : this._readable.getRemainingLiquidityMiningRIQReward(overrides);
  }

  async getLiquidityMiningStake(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningStake
      : this._readable.getLiquidityMiningStake(address, overrides);
  }

  async getTotalStakedUniTokens(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedUniTokens
      : this._readable.getTotalStakedUniTokens(overrides);
  }

  async getLiquidityMiningRIQReward(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningRIQReward
      : this._readable.getLiquidityMiningRIQReward(address, overrides);
  }

  async getCollateralSurplusBalance(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.collateralSurplusBalance
      : this._readable.getCollateralSurplusBalance(address, overrides);
  }

  async _getBlockTimestamp(blockTag) {
    return this._blockHit({ blockTag })
      ? this.store.state.blockTimestamp
      : this._readable._getBlockTimestamp(blockTag);
  }

  async _getFeesFactory(overrides) {
    return this._blockHit(overrides)
      ? this.store.state._feesFactory
      : this._readable._getFeesFactory(overrides);
  }

  async getFees(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.fees
      : this._readable.getFees(overrides);
  }

  async getRIQStake(address, overrides) {
    return this._userHit(address, overrides)
      ? this.store.state.riqStake
      : this._readable.getRIQStake(address, overrides);
  }

  async getTotalStakedRIQ(overrides) {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedRIQ
      : this._readable.getTotalStakedRIQ(overrides);
  }

  async getFrontendStatus(address, overrides) {
    return this._frontendHit(address, overrides)
      ? this.store.state.frontend
      : this._readable.getFrontendStatus(address, overrides);
  }

  getTroves(params, overrides) {
    return this._readable.getTroves(params, overrides);
  }

  _getActivePool() {
    throw new Error("Method not implemented.");
  }

  _getDefaultPool() {
    throw new Error("Method not implemented.");
  }

  _getRemainingLiquidityMiningRIQRewardCalculator() {
    throw new Error("Method not implemented.");
  }
}
