import React, { useEffect } from "react";

import { Decimal } from "../../lib/@rolliq/lib-base";

import { useRolliq } from "../../hooks/RolliqContext";
import { Warning } from "./Warning";

export const ExpensiveTroveChangeWarning = ({
  troveChange,
  maxBorrowingRate,
  borrowingFeeDecayToleranceMinutes,
  gasEstimationState,
  setGasEstimationState
}) => {
  const { rolliq } = useRolliq();

  useEffect(() => {
    if (troveChange && troveChange.type !== "closure") {
      // console.log("Waiting");
      setGasEstimationState({ type: "inProgress" });

      let cancelled = false;

      const timeoutId = setTimeout(async () => {
        const populatedTx = await (troveChange.type === "creation"
          ? rolliq.populate.openTrove(troveChange.params, {
              maxBorrowingRate,
              borrowingFeeDecayToleranceMinutes
            })
          : rolliq.populate.adjustTrove(troveChange.params, {
              maxBorrowingRate,
              borrowingFeeDecayToleranceMinutes
            }));

            // console.log("Complete")
        if (!cancelled) {
          setGasEstimationState({ type: "complete", populatedTx });
          // console.log(
            // "Estimated TX cost: " +
              // Decimal.from(`${populatedTx.rawPopulatedTransaction.gasLimit}`).prettify(0)
          // );
        }
      }, 333);
      
      // console.log("After");

      return () => {
        clearTimeout(timeoutId);
        cancelled = true;
      };
    } else {
      setGasEstimationState({ type: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [troveChange]);

  if (
    troveChange &&
    gasEstimationState.type === "complete" &&
    gasEstimationState.populatedTx.gasHeadroom !== undefined &&
    gasEstimationState.populatedTx.gasHeadroom >= 200000
  ) {
    return troveChange.type === "creation" ? (
      <Warning>
        The cost of opening a Trove in this collateral ratio range is rather high. To lower it,
        choose a slightly different collateral ratio.
      </Warning>
    ) : (
      <Warning>
        The cost of adjusting a Trove into this collateral ratio range is rather high. To lower it,
        choose a slightly different collateral ratio.
      </Warning>
    );
  }

  return null;
};
