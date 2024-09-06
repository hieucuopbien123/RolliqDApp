import React, { useCallback, useEffect } from "react";
import { Box, Button, Flex } from "theme-ui";

import { Decimal } from "../../lib/@rolliq/lib-base";
import {
  useRolliqReducer,
  useRolliqSelector,
} from "../../lib/@rolliq/lib-react";

import { COIN } from "../../strings";

import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";
import { useMyTransactionState } from "../../components/Trasaction";

import { StabilityDepositEditorM3 } from "./StabilityDepositEditorM3";
import { StabilityDepositAction } from "./StabilityDepositAction";
import { useStabilityView } from "../../components/Stability/context/StabilityViewContext";
import {
  selectForStabilityDepositChangeValidation,
  validateStabilityDepositChange,
} from "./validation/validateStabilityDepositChange";

const init = ({ stabilityDeposit }) => ({
  originalDeposit: stabilityDeposit,
  editedRUSD: stabilityDeposit.currentRUSD,
  changePending: false,
});

const reduceWith = (action) => (state) => reduce(state, action);

const finishChange = reduceWith({ type: "finishChange" });
const revert = reduceWith({ type: "revert" });

const reduce = (state, action) => {
  const { originalDeposit, editedRUSD, changePending } = state;

  switch (action.type) {
    case "startChange": {
      return { ...state, changePending: true };
    }

    case "finishChange":
      return { ...state, changePending: false };

    case "setDeposit":
      return { ...state, editedRUSD: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedRUSD: originalDeposit.currentRUSD };

    case "updateStore": {
      const {
        stateChange: { stabilityDeposit: updatedDeposit },
      } = action;

      if (!updatedDeposit) {
        return state;
      }

      const newState = { ...state, originalDeposit: updatedDeposit };

      const changeCommitted =
        !updatedDeposit.initialRUSD.eq(originalDeposit.initialRUSD) ||
        updatedDeposit.currentRUSD.gt(originalDeposit.currentRUSD) ||
        updatedDeposit.collateralGain.lt(originalDeposit.collateralGain) ||
        updatedDeposit.riqReward.lt(originalDeposit.riqReward);

      if (changePending && changeCommitted) {
        return finishChange(revert(newState));
      }

      return {
        ...newState,
        editedRUSD: updatedDeposit.apply(
          originalDeposit.whatChanged(editedRUSD)
        ),
      };
    }
  }
};

const transactionId = "stability-deposit";

export const WithdrawStabilityPool = ({setCurrentPage}) => {
  const [{ originalDeposit, editedRUSD, changePending }, dispatch] =
    useRolliqReducer(reduce, init);
  const validationContext = useRolliqSelector(
    selectForStabilityDepositChangeValidation
  );
  const { dispatchEvent } = useStabilityView();

  const handleCancel = useCallback(() => {
    dispatchEvent("CANCEL_PRESSED");
  }, [dispatchEvent]);

  const [validChange, description] = validateStabilityDepositChange(
    originalDeposit,
    editedRUSD,
    validationContext
  );

  const makingNewDeposit = originalDeposit.isEmpty;

  const myTransactionState = useMyTransactionState(transactionId);

  useEffect(() => {
    if (
      myTransactionState.type === "waitingForApproval" ||
      myTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (
      myTransactionState.type === "failed" ||
      myTransactionState.type === "cancelled"
    ) {
      dispatch({ type: "finishChange" });
    } else if (myTransactionState.type === "confirmedOneShot") {
      dispatchEvent("DEPOSIT_CONFIRMED");
    }
  }, [myTransactionState.type, dispatch, dispatchEvent]);

  return (
    <StabilityDepositEditorM3
      originalDeposit={originalDeposit}
      editedRUSD={editedRUSD}
      changePending={changePending}
      dispatch={dispatch}
      makingNewDeposit={makingNewDeposit}
      setCurrentPage={setCurrentPage}
    >
      <Box className="pb-4">
        {description ??
          (makingNewDeposit ? (
            <ActionDescriptionM1>
              Deposit {COIN} to the Stability Pool and earn ETH liquidation
              bonuses and ABC rewards.
            </ActionDescriptionM1>
          ) : (
            <ActionDescriptionM1>
              Adjust the {COIN} amount to deposit or withdraw.
            </ActionDescriptionM1>
          ))}
      </Box>
      <Flex className="flex-col gap-2">
        {validChange ? (
          <StabilityDepositAction
            transactionId={transactionId}
            change={validChange}
            topmessage={`Withdrawing ${validChange.withdrawRUSD.prettify(2)} rUSD`}
          >
            {makingNewDeposit ? "Withdraw" : "Withdraw"}
          </StabilityDepositAction>
        ) : (
          <Button
            disabled
            className="w-full fontCustom-bold text-[18px] animationCustom"
            style={{
              backgroundColor: "#1E2185",
              borderRadius: "25px",
              padding: "8px",
            }}
          >
            {makingNewDeposit ? "Withdraw" : "Withdraw"}
          </Button>
        )}
        {/* {!makingNewDeposit && (
          <Button
            className="w-full"
            style={{
              backgroundColor: "transparent",
              borderRadius: "25px",
              padding: "7px",
              color: "black",
            }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        )} */}
      </Flex>
    </StabilityDepositEditorM3>
  );
};
