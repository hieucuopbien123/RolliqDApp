import { Button } from "theme-ui";
import { useRolliq } from "../../hooks/RolliqContext";
import { useTransactionFunction } from "../../components/Trasaction";
import React from "react";

export const TroveActionM2 = ({
  children,
  transactionId,
  change,
  maxBorrowingRate,
  borrowingFeeDecayToleranceMinutes,
  topmessage,
  setShowClose
}) => {
  const { rolliq } = useRolliq();

  // console.log(change.params);
  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.type === "creation"
      ? rolliq.send.openTrove.bind(rolliq.send, change.params, {
        maxBorrowingRate,
        borrowingFeeDecayToleranceMinutes
      })
      : change.type === "closure"
      ? rolliq.send.closeTrove.bind(rolliq.send)
      : rolliq.send.adjustTrove.bind(rolliq.send, change.params, {
        maxBorrowingRate,
        borrowingFeeDecayToleranceMinutes
      }),
      topmessage
  );

  return <Button className="w-full fontCustom-bold text-[18px] animationCustom"  style={{color: "black", backgroundColor: "transparent", borderRadius: "25px", padding: "8px"}} onClick={() => {
    setShowClose(true);
    sendTransaction();
  }}>{children}</Button>
};
