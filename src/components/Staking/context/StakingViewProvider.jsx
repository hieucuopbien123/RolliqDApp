import { useEffect } from "react";
import { useRolliqReducer } from "../../../lib/@rolliq/lib-react";
import { useMyTransactionState } from "../../Trasaction";
import { StakingViewContext } from "./StakingViewContext";

const init = ({ riqStake }) => ({
  riqStake,
  changePending: false,
  adjusting: false
});

const reduce = (
  state,
  action
) => {
  switch (action.type) {
    case "startAdjusting":
      return { ...state, adjusting: true };

    case "cancelAdjusting":
      return { ...state, adjusting: false };

    case "startChange":
      return { ...state, changePending: true };

    case "abortChange":
      return { ...state, changePending: false };

    case "updateStore": {
      const {
        oldState: { riqStake: oldStake },
        stateChange: { riqStake: updatedStake }
      } = action;

      if (updatedStake) {
        const changeCommitted =
          !updatedStake.stakedRIQ.eq(oldStake.stakedRIQ) ||
          updatedStake.collateralGain.lt(oldStake.collateralGain) ||
          updatedStake.rusdGain.lt(oldStake.rusdGain);

        return {
          ...state,
          riqStake: updatedStake,
          adjusting: false,
          changePending: changeCommitted ? false : state.changePending
        };
      }
    }
  }

  return state;
};

export const StakingViewProvider = ({ children }) => {
  const stakingTransactionState = useMyTransactionState("stake");
  const [{ adjusting, changePending, riqStake }, dispatch] = useRolliqReducer(reduce, init);

  useEffect(() => {
    if (
      stakingTransactionState.type === "waitingForApproval" ||
      stakingTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (
      stakingTransactionState.type === "failed" ||
      stakingTransactionState.type === "cancelled"
    ) {
      dispatch({ type: "abortChange" });
    }
  }, [stakingTransactionState.type, dispatch]);

  return (
    <StakingViewContext.Provider
      value={{
        view: adjusting ? "ADJUSTING" : riqStake.isEmpty ? "NONE" : "ACTIVE",
        changePending,
        dispatch
      }}
    >
      {children}
    </StakingViewContext.Provider>
  );
};
