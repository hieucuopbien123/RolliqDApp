import { Button } from "theme-ui";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { useRolliq } from "../../hooks/RolliqContext";
import { useTransactionFunction } from "../../components/Trasaction";
import { AddressZero } from "@ethersproject/constants";

const selectFrontendRegistered = ({ frontend }) =>
  frontend.status === "registered";

export const StabilityDepositAction = ({
  children,
  transactionId,
  change, topmessage
}) => {
  const { config, rolliq } = useRolliq();
  const frontendRegistered = useRolliqSelector(selectFrontendRegistered);

  const frontendTag = frontendRegistered ? config.frontendTag : undefined;

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.depositRUSD
      ? rolliq.send.depositRUSDInStabilityPool.bind(rolliq.send, change.depositRUSD, AddressZero)
      : rolliq.send.withdrawRUSDFromStabilityPool.bind(rolliq.send, change.withdrawRUSD),
      topmessage
  );

  return <Button className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px"}} onClick={sendTransaction}>{children}</Button>
};
