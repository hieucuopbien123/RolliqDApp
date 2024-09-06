import React from "react";

import { COIN, GT } from "../../strings";
import { ActionDescription, Amount } from "../TROVE/ActionDescription";
import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";

export const StabilityActionDescription = ({
  originalDeposit,
  change
}) => {
  const collateralGain = originalDeposit.collateralGain.nonZero?.prettify(4).concat(" ETH");
  const riqReward = originalDeposit.riqReward.nonZero?.prettify().concat(" ", GT);

  return (
    <ActionDescriptionM1>
      {change.depositRUSD ? (
        <>
          You are depositing{" "}
          <Amount>
            {change.depositRUSD.prettify()} {COIN}
          </Amount>{" "}
          in the Stability Pool
        </>
      ) : (
        <>
          You are withdrawing{" "}
          <Amount>
            {change.withdrawRUSD.prettify()} {COIN}
          </Amount>{" "}
          to your wallet
        </>
      )}
      {(collateralGain || riqReward) && (
        <>
          {" "}
          and claiming at least{" "}
          {collateralGain && riqReward ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{riqReward}</Amount>
            </>
          ) : (
            <Amount>{collateralGain ?? riqReward}</Amount>
          )}
        </>
      )}
      .
    </ActionDescriptionM1>
  );
};
