import { Button } from "theme-ui";
import { useRolliq } from "../../hooks/RolliqContext";
import { useTransactionFunction } from "../../components/Trasaction";
import React from "react";

export const TroveAction = ({
  children,
  transactionId,
  change,
  maxBorrowingRate,
  borrowingFeeDecayToleranceMinutes,
  topmessage
}) => {
  const { rolliq } = useRolliq();

  // console.log(change.type);
  // console.log(change.params);
  // console.log(maxBorrowingRate);
  // console.log(borrowingFeeDecayToleranceMinutes);
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
  return <Button className="w-full animationCustom fontCustom-bold text-[18px animationCustom]" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px", color: "white"}} onClick={sendTransaction}>{children}</Button>;
};
