import React from "react";

import { COIN } from "../../../strings";
import { Amount } from "../../TROVE/ActionDescription";
import { ErrorDescription } from "../../TROVE/ErrorDescription";
import { StabilityActionDescription } from "../StabilityActionDescription";

export const selectForStabilityDepositChangeValidation = ({
  trove,
  rusdBalance,
  ownFrontend,
  haveUndercollateralizedTroves
}) => ({
  trove,
  rusdBalance,
  haveOwnFrontend: ownFrontend.status === "registered",
  haveUndercollateralizedTroves
});

export const validateStabilityDepositChange = (
  originalDeposit,
  editedRUSD,
  {
    rusdBalance,
    haveOwnFrontend,
    haveUndercollateralizedTroves
  }
) => {
  const change = originalDeposit.whatChanged(editedRUSD);

  if (haveOwnFrontend) {
    return [
      undefined,
      <ErrorDescription>
        You can’t deposit using a wallet address that is registered as a frontend.
      </ErrorDescription>
    ];
  }

  if (!change) {
    return [undefined, undefined];
  }

  if (change.depositRUSD?.gt(rusdBalance)) {
    return [
      undefined,
      <ErrorDescription>
        The amount you're trying to deposit exceeds your balance by{" "}
        <Amount>
          {change.depositRUSD.sub(rusdBalance).prettify()} {COIN}
        </Amount>
        .
      </ErrorDescription>
    ];
  }

  if (change.withdrawRUSD && haveUndercollateralizedTroves) {
    return [
      undefined,
      <ErrorDescription>
        You're not allowed to withdraw RUSD from your Stability Deposit when there are
        undercollateralized Troves. Please liquidate those Troves or try again later.
      </ErrorDescription>
    ];
  }

  return [change, <StabilityActionDescription originalDeposit={originalDeposit} change={change} />];
};
