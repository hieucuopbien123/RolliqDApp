import { Trove } from "../lib/@rolliq/lib-base";

export const calcLiquidationPrice = (trove: Trove) =>
  trove.debt.mul(1.1).div(trove.collateral);
export const calcLiquidationPriceInRecoveryMode = (trove: Trove) =>
  trove.debt.mul(1.5).div(trove.collateral);
