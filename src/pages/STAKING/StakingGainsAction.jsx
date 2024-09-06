import { Button } from "theme-ui";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { useRolliq } from "../../hooks/RolliqContext";
import { useTransactionFunction } from "../../components/Trasaction";
import React from "react";

const selectRIQStake = ({ riqStake }) => riqStake;

export const StakingGainsAction = () => {
  const { rolliq } = useRolliq();
  const { collateralGain, rusdGain } = useRolliqSelector(selectRIQStake);

  const [sendTransaction] = useTransactionFunction(
    "stake",
    rolliq.send.withdrawGainsFromStaking.bind(rolliq.send),
    "Confirm claim staking"
  );

  return (
    <Button className="w-full fontCustom-bold animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px", color: "white"}} onClick={sendTransaction} disabled={collateralGain.isZero && rusdGain.isZero}>Claim</Button>
  );
};
