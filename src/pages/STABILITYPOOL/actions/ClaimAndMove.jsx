import React from "react";
import { Button } from "theme-ui";
import { useRolliq } from "../../../hooks/RolliqContext";
import { useTransactionFunction } from "../../../components/Trasaction";

export const ClaimAndMove = ({ disabled, children }) => {
  const { rolliq } = useRolliq();

  const [sendTransaction] = useTransactionFunction(
    "stability-deposit",
    rolliq.send.transferCollateralGainToTrove.bind(rolliq.send),
    "Confirm claim and move ETH to trove"
  );

  return (
    <Button disabled={disabled} className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px"}} onClick={sendTransaction}>{children}</Button>
  );
};
