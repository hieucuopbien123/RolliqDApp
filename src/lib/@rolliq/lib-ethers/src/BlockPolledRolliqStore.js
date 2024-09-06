import { AddressZero } from "@ethersproject/constants";

import {
  Decimal,
  TroveWithPendingRedistribution,
  StabilityDeposit,
  RIQStake,
  RolliqStore,
} from "../../lib-base/index";

import { decimalify, promiseAllValues } from "./_utils";
import { _getProvider } from "./EthersRolliqConnection";

/**
 * Ethers-based {@link @rolliq/lib-base#RolliqStore} that updates state whenever there's a new
 * block.
 *
 * @public
 */
export class BlockPolledRolliqStore extends RolliqStore {
  constructor(readable) {
    super();

    this.connection = readable.connection;
    this._readable = readable;
    this._provider = _getProvider(readable.connection);
  }

  async _getRiskiestTroveBeforeRedistribution(overrides) {
    const riskiestTroves = await this._readable.getTroves(
      {
        first: 1,
        sortedBy: "ascendingCollateralRatio",
        beforeRedistribution: true,
      },
      overrides
    );

    if (riskiestTroves.length === 0) {
      return new TroveWithPendingRedistribution(AddressZero, "nonExistent");
    }

    return riskiestTroves[0];
  }

  async _get(blockTag) {
    const { userAddress, frontendTag } = this.connection;

    const {
      blockTimestamp,
      _feesFactory,
      calculateRemainingRIQ,
      ...baseState
    } = await promiseAllValues({
      blockTimestamp: this._readable._getBlockTimestamp(blockTag),
      _feesFactory: this._readable._getFeesFactory({ blockTag }),
      calculateRemainingRIQ:
        this._readable._getRemainingLiquidityMiningRIQRewardCalculator({
          blockTag,
        }),

      price: this._readable.getPrice({ blockTag }),
      numberOfTroves: this._readable.getNumberOfTroves({ blockTag }),
      totalRedistributed: this._readable.getTotalRedistributed({ blockTag }),
      total: this._readable.getTotal({ blockTag }),
      rusdInStabilityPool: this._readable.getRUSDInStabilityPool({ blockTag }),
      totalStakedRIQ: this._readable.getTotalStakedRIQ({ blockTag }),
      _riskiestTroveBeforeRedistribution:
        this._getRiskiestTroveBeforeRedistribution({ blockTag }),
      totalStakedUniTokens: this._readable.getTotalStakedUniTokens({
        blockTag,
      }),
      remainingStabilityPoolRIQReward:
        this._readable.getRemainingStabilityPoolRIQReward({
          blockTag,
        }),

      frontend: frontendTag
        ? this._readable.getFrontendStatus(frontendTag, { blockTag })
        : { status: "unregistered" },

      ...(userAddress
        ? {
            accountBalance: this._provider
              .getBalance(userAddress, blockTag)
              .then(decimalify),
            rusdBalance: this._readable.getRUSDBalance(userAddress, {
              blockTag,
            }),
            riqBalance: this._readable.getRIQBalance(userAddress, {
              blockTag,
            }),
            uniTokenBalance: this._readable.getUniTokenBalance(userAddress, {
              blockTag,
            }),
            uniTokenAllowance: this._readable.getUniTokenAllowance(
              userAddress,
              { blockTag }
            ),
            liquidityMiningStake: this._readable.getLiquidityMiningStake(
              userAddress,
              { blockTag }
            ),
            liquidityMiningRIQReward:
              this._readable.getLiquidityMiningRIQReward(userAddress, {
                blockTag,
              }),
            collateralSurplusBalance:
              this._readable.getCollateralSurplusBalance(userAddress, {
                blockTag,
              }),
            troveBeforeRedistribution:
              this._readable.getTroveBeforeRedistribution(userAddress, {
                blockTag,
              }),
            stabilityDeposit: this._readable.getStabilityDeposit(userAddress, {
              blockTag,
            }),
            riqStake: this._readable.getRIQStake(userAddress, { blockTag }),
            ownFrontend: this._readable.getFrontendStatus(userAddress, {
              blockTag,
            }),
          }
        : {
            accountBalance: Decimal.ZERO,
            rusdBalance: Decimal.ZERO,
            riqBalance: Decimal.ZERO,
            uniTokenBalance: Decimal.ZERO,
            uniTokenAllowance: Decimal.ZERO,
            liquidityMiningStake: Decimal.ZERO,
            liquidityMiningRIQReward: Decimal.ZERO,
            collateralSurplusBalance: Decimal.ZERO,
            troveBeforeRedistribution: new TroveWithPendingRedistribution(
              AddressZero,
              "nonExistent"
            ),
            stabilityDeposit: new StabilityDeposit(
              Decimal.ZERO,
              Decimal.ZERO,
              Decimal.ZERO,
              Decimal.ZERO,
              AddressZero
            ),
            riqStake: new RIQStake(),
            ownFrontend: { status: "unregistered" },
          }),
    });

    return [
      {
        ...baseState,
        _feesInNormalMode: _feesFactory(blockTimestamp, false),
        remainingLiquidityMiningRIQReward:
          calculateRemainingRIQ(blockTimestamp),
      },
      {
        blockTag,
        blockTimestamp,
        _feesFactory,
      },
    ];
  }

  /** @internal @override */
  _doStart() {
    this._get().then((state) => {
      if (!this._loaded) {
        this._load(...state);
      }
    });

    const blockListener = async (blockTag) => {
      const state = await this._get(blockTag);

      if (this._loaded) {
        this._update(...state);
      } else {
        this._load(...state);
      }
    };

    this._provider.on("block", blockListener);

    return () => {
      this._provider.off("block", blockListener);
    };
  }

  /** @internal @override */
  _reduceExtra(oldState, stateUpdate) {
    return {
      blockTag: stateUpdate.blockTag ?? oldState.blockTag,
      blockTimestamp: stateUpdate.blockTimestamp ?? oldState.blockTimestamp,
      _feesFactory: stateUpdate._feesFactory ?? oldState._feesFactory,
    };
  }
}
