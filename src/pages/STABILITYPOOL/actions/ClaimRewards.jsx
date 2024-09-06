import React from "react";
import { Button } from "theme-ui";

import { useRolliq } from "../../../hooks/RolliqContext";
import { useTransactionFunction } from "../../../components/Trasaction";

export const ClaimRewards = ({ disabled, children }) => {
  const { rolliq } = useRolliq();

  const [sendTransaction] = useTransactionFunction(
    "stability-deposit",
    rolliq.send.withdrawGainsFromStabilityPool.bind(rolliq.send),
    "Confirm claim pool rewards"
  );

  return (
    <Button disabled={disabled} className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px"}} onClick={sendTransaction}>{children}</Button>
  );
};
