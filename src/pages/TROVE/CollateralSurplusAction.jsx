import React, { useEffect } from "react";
import { Button, Flex, Spinner } from "theme-ui";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { useRolliq } from "../../hooks/RolliqContext";

import { Transaction, useMyTransactionState } from "../../components/Trasaction";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";

const select = ({ collateralSurplusBalance }) => ({
  collateralSurplusBalance
});

export const CollateralSurplusAction = () => {
  const { collateralSurplusBalance } = useRolliqSelector(select);
  const {
    rolliq: { send: rolliq }
  } = useRolliq();

  const myTransactionId = "claim-coll-surplus";
  const myTransactionState = useMyTransactionState(myTransactionId);

  const { dispatchEvent } = useTroveView();

  useEffect(() => {
    if (myTransactionState.type === "confirmedOneShot") {
      dispatchEvent("TROVE_SURPLUS_COLLATERAL_CLAIMED");
    }
  }, [myTransactionState.type, dispatchEvent]);

  return myTransactionState.type === "waitingForApproval" ? (
    <Flex variant="layout.actions">
      <Button disabled sx={{ mx: 2 }}  className="fontCustom-bold">
        <Spinner sx={{ mr: 2, color: "white" }} size={20} />
        Waiting for your approval
      </Button>
    </Flex>
  ) : myTransactionState.type !== "waitingForConfirmation" &&
    myTransactionState.type !== "confirmed" ? (
    <Flex variant="layout.actions">
      <Transaction
        id={myTransactionId}
        send={rolliq.claimCollateralSurplus.bind(rolliq, undefined)} tooltip={undefined} tooltipPlacement={undefined} showFailure={undefined} requires={undefined}
      >
        <Button sx={{ mx: 2 }} className="fontCustom-bold animationCustom">Claim {collateralSurplusBalance.prettify()} ETH</Button>
      </Transaction>
    </Flex>
  ) : null;
};
