const sendTransaction = (tx) => tx.send();

/**
 * Ethers-based implementation of {@link @rolliq/lib-base#SendableRolliq}.
 *
 * @public
 */
export class SendableEthersRolliq {
  constructor(populatable) {
    this._populate = populatable;
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.openTrove} */
  async openTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    return this._populate
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.closeTrove} */
  closeTrove(overrides) {
    return this._populate.closeTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.adjustTrove} */
  adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides) {
    return this._populate
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.depositCollateral} */
  depositCollateral(amount, overrides) {
    return this._populate
      .depositCollateral(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.withdrawCollateral} */
  withdrawCollateral(amount, overrides) {
    return this._populate
      .withdrawCollateral(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.borrowRUSD} */
  borrowRUSD(amount, maxBorrowingRate, overrides) {
    return this._populate
      .borrowRUSD(amount, maxBorrowingRate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.repayRUSD} */
  repayRUSD(amount, overrides) {
    return this._populate.repayRUSD(amount, overrides).then(sendTransaction);
  }

  /** @internal */
  setPrice(price, overrides) {
    return this._populate.setPrice(price, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.liquidate} */
  liquidate(address, overrides) {
    return this._populate.liquidate(address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.liquidateUpTo} */
  liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides) {
    return this._populate
      .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.depositRUSDInStabilityPool} */
  depositRUSDInStabilityPool(amount, frontendTag, overrides) {
    return this._populate
      .depositRUSDInStabilityPool(amount, frontendTag, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.withdrawRUSDFromStabilityPool} */
  withdrawRUSDFromStabilityPool(amount, overrides) {
    return this._populate
      .withdrawRUSDFromStabilityPool(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(overrides) {
    return this._populate
      .withdrawGainsFromStabilityPool(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(overrides) {
    return this._populate
      .transferCollateralGainToTrove(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.sendRUSD} */
  sendRUSD(toAddress, amount, overrides) {
    return this._populate
      .sendRUSD(toAddress, amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.sendRIQ} */
  sendRIQ(toAddress, amount, overrides) {
    return this._populate
      .sendRIQ(toAddress, amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.redeemRUSD} */
  redeemRUSD(amount, maxRedemptionRate, overrides) {
    return this._populate
      .redeemRUSD(amount, maxRedemptionRate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.claimCollateralSurplus} */
  claimCollateralSurplus(overrides) {
    return this._populate
      .claimCollateralSurplus(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.stakeRIQ} */
  stakeRIQ(amount, overrides) {
    return this._populate.stakeRIQ(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.unstakeRIQ} */
  unstakeRIQ(amount, overrides) {
    return this._populate.unstakeRIQ(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(overrides) {
    return this._populate
      .withdrawGainsFromStaking(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.registerFrontend} */
  registerFrontend(kickbackRate, overrides) {
    return this._populate
      .registerFrontend(kickbackRate, overrides)
      .then(sendTransaction);
  }

  /** @internal */
  _mintUniToken(amount, address, overrides) {
    return this._populate
      ._mintUniToken(amount, address, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.approveUniTokens} */
  approveUniTokens(allowance, overrides) {
    return this._populate
      .approveUniTokens(allowance, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.stakeUniTokens} */
  stakeUniTokens(amount, overrides) {
    return this._populate
      .stakeUniTokens(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.unstakeUniTokens} */
  unstakeUniTokens(amount, overrides) {
    return this._populate
      .unstakeUniTokens(amount, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.withdrawRIQRewardFromLiquidityMining} */
  withdrawRIQRewardFromLiquidityMining(overrides) {
    return this._populate
      .withdrawRIQRewardFromLiquidityMining(overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc @rolliq/lib-base#SendableRolliq.exitLiquidityMining} */
  exitLiquidityMining(overrides) {
    return this._populate.exitLiquidityMining(overrides).then(sendTransaction);
  }
}
