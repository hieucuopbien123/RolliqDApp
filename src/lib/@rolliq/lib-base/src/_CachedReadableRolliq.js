export class _CachedReadableRolliq {
  constructor(readable, cache) {
    this._readable = readable;
    this._cache = cache;
  }

  async getTotalRedistributed(...extraParams) {
    return (
      this._cache.getTotalRedistributed(...extraParams) ??
      this._readable.getTotalRedistributed(...extraParams)
    );
  }

  async getTroveBeforeRedistribution(address, ...extraParams) {
    return (
      this._cache.getTroveBeforeRedistribution(address, ...extraParams) ??
      this._readable.getTroveBeforeRedistribution(address, ...extraParams)
    );
  }

  async getTrove(address, ...extraParams) {
    const [troveBeforeRedistribution, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, ...extraParams),
      this.getTotalRedistributed(...extraParams),
    ]);

    return troveBeforeRedistribution.applyRedistribution(totalRedistributed);
  }

  async getNumberOfTroves(...extraParams) {
    return (
      this._cache.getNumberOfTroves(...extraParams) ??
      this._readable.getNumberOfTroves(...extraParams)
    );
  }

  async getPrice(...extraParams) {
    return (
      this._cache.getPrice(...extraParams) ??
      this._readable.getPrice(...extraParams)
    );
  }

  async getTotal(...extraParams) {
    return (
      this._cache.getTotal(...extraParams) ??
      this._readable.getTotal(...extraParams)
    );
  }

  async getStabilityDeposit(address, ...extraParams) {
    return (
      this._cache.getStabilityDeposit(address, ...extraParams) ??
      this._readable.getStabilityDeposit(address, ...extraParams)
    );
  }

  async getRemainingStabilityPoolRIQReward(...extraParams) {
    return (
      this._cache.getRemainingStabilityPoolRIQReward(...extraParams) ??
      this._readable.getRemainingStabilityPoolRIQReward(...extraParams)
    );
  }

  async getRUSDInStabilityPool(...extraParams) {
    return (
      this._cache.getRUSDInStabilityPool(...extraParams) ??
      this._readable.getRUSDInStabilityPool(...extraParams)
    );
  }

  async getRUSDBalance(address, ...extraParams) {
    return (
      this._cache.getRUSDBalance(address, ...extraParams) ??
      this._readable.getRUSDBalance(address, ...extraParams)
    );
  }

  async getRIQBalance(address, ...extraParams) {
    return (
      this._cache.getRIQBalance(address, ...extraParams) ??
      this._readable.getRIQBalance(address, ...extraParams)
    );
  }

  async getUniTokenBalance(address, ...extraParams) {
    return (
      this._cache.getUniTokenBalance(address, ...extraParams) ??
      this._readable.getUniTokenBalance(address, ...extraParams)
    );
  }

  async getUniTokenAllowance(address, ...extraParams) {
    return (
      this._cache.getUniTokenAllowance(address, ...extraParams) ??
      this._readable.getUniTokenAllowance(address, ...extraParams)
    );
  }

  async getRemainingLiquidityMiningRIQReward(...extraParams) {
    return (
      this._cache.getRemainingLiquidityMiningRIQReward(...extraParams) ??
      this._readable.getRemainingLiquidityMiningRIQReward(...extraParams)
    );
  }

  async getLiquidityMiningStake(address, ...extraParams) {
    return (
      this._cache.getLiquidityMiningStake(address, ...extraParams) ??
      this._readable.getLiquidityMiningStake(address, ...extraParams)
    );
  }

  async getTotalStakedUniTokens(...extraParams) {
    return (
      this._cache.getTotalStakedUniTokens(...extraParams) ??
      this._readable.getTotalStakedUniTokens(...extraParams)
    );
  }

  async getLiquidityMiningRIQReward(address, ...extraParams) {
    return (
      this._cache.getLiquidityMiningRIQReward(address, ...extraParams) ??
      this._readable.getLiquidityMiningRIQReward(address, ...extraParams)
    );
  }

  async getCollateralSurplusBalance(address, ...extraParams) {
    return (
      this._cache.getCollateralSurplusBalance(address, ...extraParams) ??
      this._readable.getCollateralSurplusBalance(address, ...extraParams)
    );
  }

  async getTroves(params, ...extraParams) {
    const { beforeRedistribution, ...restOfParams } = params;

    const [totalRedistributed, troves] = await Promise.all([
      beforeRedistribution
        ? undefined
        : this.getTotalRedistributed(...extraParams),
      this._cache.getTroves(
        { beforeRedistribution: true, ...restOfParams },
        ...extraParams
      ) ??
        this._readable.getTroves(
          { beforeRedistribution: true, ...restOfParams },
          ...extraParams
        ),
    ]);

    if (totalRedistributed) {
      return troves.map((trove) =>
        trove.applyRedistribution(totalRedistributed)
      );
    } else {
      return troves;
    }
  }

  async getFees(...extraParams) {
    return (
      this._cache.getFees(...extraParams) ??
      this._readable.getFees(...extraParams)
    );
  }

  async getRIQStake(address, ...extraParams) {
    return (
      this._cache.getRIQStake(address, ...extraParams) ??
      this._readable.getRIQStake(address, ...extraParams)
    );
  }

  async getTotalStakedRIQ(...extraParams) {
    return (
      this._cache.getTotalStakedRIQ(...extraParams) ??
      this._readable.getTotalStakedRIQ(...extraParams)
    );
  }

  async getFrontendStatus(address, ...extraParams) {
    return (
      this._cache.getFrontendStatus(address, ...extraParams) ??
      this._readable.getFrontendStatus(address, ...extraParams)
    );
  }
}
