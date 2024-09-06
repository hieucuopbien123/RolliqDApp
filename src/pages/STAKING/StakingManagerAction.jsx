import { Button } from "theme-ui";

import { useRolliq } from "../../hooks/RolliqContext";
import { useTransactionFunction } from "../../components/Trasaction";
import React from "react";

export const StakingManagerAction = ({ change, children }) => {
  const { rolliq } = useRolliq();

  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeRIQ
      ? rolliq.send.stakeRIQ.bind(rolliq.send, change.stakeRIQ)
      : rolliq.send.unstakeRIQ.bind(rolliq.send, change.unstakeRIQ),
    change.stakeRIQ
      ? `Staking ${change.stakeRIQ.prettify(2)} RIQ`
      : `Unstaking ${change.unstakeRIQ.prettify(2)} RIQ`
  );

  return <Button className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px", fontSize: "18px"}} onClick={sendTransaction}>{children}</Button>
};
