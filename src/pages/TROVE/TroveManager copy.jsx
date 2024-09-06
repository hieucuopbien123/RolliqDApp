import { useCallback, useEffect } from "react";
import { Flex, Button } from "theme-ui";

import { Decimal, Trove, RUSD_MINIMUM_DEBT } from "../../lib/@rolliq/lib-base";

import { useRolliqReducer, useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { ActionDescription } from "./ActionDescription";
import { useMyTransactionState } from "../../components/Trasaction";

import { TroveEditor } from "./TroveEditor";
import { TroveActionM1 } from "./TroveActionM1";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";

import {
  selectForTroveChangeValidation,
  validateTroveChange
} from "./validation/validateTroveChange";

const init = ({ trove }) => ({
  original: trove,
  edited: new Trove(trove.collateral, trove.debt),
  changePending: false,
  debtDirty: false,
  addedMinimumDebt: false
});

const reduceWith = (action) => (state) =>
  reduce(state, action);

const addMinimumDebt = reduceWith({ type: "addMinimumDebt" });
const removeMinimumDebt = reduceWith({ type: "removeMinimumDebt" });
const finishChange = reduceWith({ type: "finishChange" });
const revert = reduceWith({ type: "revert" });

const reduce = (state, action) => {

  const { original, edited, changePending, debtDirty, addedMinimumDebt } = state;

  switch (action.type) {
    case "startChange": {
      // console.log("starting change");
      return { ...state, changePending: true };
    }

    case "finishChange":
      return { ...state, changePending: false };

    case "setCollateral": {
      const newCollateral = Decimal.from(action.newValue);

      const newState = {
        ...state,
        edited: edited.setCollateral(newCollateral)
      };

      if (!debtDirty) {
        if (edited.isEmpty && newCollateral.nonZero) {
          return addMinimumDebt(newState);
        }
        if (addedMinimumDebt && newCollateral.isZero) {
          return removeMinimumDebt(newState);
        }
      }

      return newState;
    }

    case "setDebt":
      return {
        ...state,
        edited: edited.setDebt(action.newValue),
        debtDirty: true
      };

    case "addMinimumDebt":
      return {
        ...state,
        edited: edited.setDebt(RUSD_MINIMUM_DEBT),
        addedMinimumDebt: true
      };

    case "removeMinimumDebt":
      return {
        ...state,
        edited: edited.setDebt(0),
        addedMinimumDebt: false
      };

    case "revert":
      return {
        ...state,
        edited: new Trove(original.collateral, original.debt),
        debtDirty: false,
        addedMinimumDebt: false
      };

    case "updateStore": {
      const {
        newState: { trove },
        stateChange: { troveBeforeRedistribution: changeCommitted }
      } = action;

      const newState = {
        ...state,
        original: trove
      };

      if (changePending && changeCommitted) {
        return finishChange(revert(newState));
      }

      const change = original.whatChanged(edited, 0);

      if (
        (change?.type === "creation" && !trove.isEmpty) ||
        (change?.type === "closure" && trove.isEmpty)
      ) {
        return revert(newState);
      }

      return { ...newState, edited: trove.apply(change, 0) };
    }
  }
};

const feeFrom = (original, edited, borrowingRate) => {
  const change = original.whatChanged(edited, borrowingRate);

  if (change && change.type !== "invalidCreation" && change.params.borrowRUSD) {
    return change.params.borrowRUSD.mul(borrowingRate);
  } else {
    return Decimal.ZERO;
  }
};

const select = (state) => ({
  fees: state.fees,
  validationContext: selectForTroveChangeValidation(state)
});

const transactionIdPrefix = "trove-";
const transactionIdMatcher = new RegExp(`^${transactionIdPrefix}`);

export const TroveManager = ({ collateral, debt }) => {
  const [{ original, edited, changePending }, dispatch] = useRolliqReducer(reduce, init);
  const { fees, validationContext } = useRolliqSelector(select);

  useEffect(() => {
    if (collateral !== undefined) {
      dispatch({ type: "setCollateral", newValue: collateral });
    }
    if (debt !== undefined) {
      dispatch({ type: "setDebt", newValue: debt });
    }
  }, [collateral, debt, dispatch]);

  const borrowingRate = fees.borrowingRate();
  const maxBorrowingRate = borrowingRate.add(0.005); // TODO slippage tolerance

  const [validChange, description] = validateTroveChange(
    original,
    edited,
    borrowingRate,
    validationContext
  );

  const { dispatchEvent } = useTroveView();

  const handleCancel = useCallback(() => {
    dispatchEvent("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);

  const openingNewTrove = original.isEmpty;

  const myTransactionState = useMyTransactionState(transactionIdMatcher);

  useEffect(() => {
    if (
      myTransactionState.type === "waitingForApproval" ||
      myTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (myTransactionState.type === "failed" || myTransactionState.type === "cancelled") {
      dispatch({ type: "finishChange" });
    } else if (myTransactionState.type === "confirmedOneShot") {
      if (myTransactionState.id === `${transactionIdPrefix}closure`) {
        dispatchEvent("TROVE_CLOSED");
      } else {
        dispatchEvent("TROVE_ADJUSTED");
      }
    }
  }, [myTransactionState, dispatch, dispatchEvent]);

  return (
    <TroveEditor
      original={original}
      edited={edited}
      fee={feeFrom(original, edited, borrowingRate)}
      borrowingRate={borrowingRate}
      changePending={changePending}
      dispatch={dispatch}
    >
      {description ??
        (openingNewTrove ? (
          <ActionDescription>
            Start by entering the amount of ETH you'd like to deposit as collateral.
          </ActionDescription>
        ) : (
          <ActionDescription>
            Adjust your Trove by modifying its collateral, debt, or both.
          </ActionDescription>
        ))}

        {validChange ? (
          <TroveActionM1
            transactionId={`${transactionIdPrefix}${validChange.type}`}
            change={validChange}
            maxBorrowingRate={maxBorrowingRate}
            borrowingFeeDecayToleranceMinutes={60}
          >
            Confirm
          </TroveActionM1>
        ) : (
          <Button disabled className="w-full fontCustom-bold animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px"}}>Confirm</Button>
        )}
        <div className="py-1"></div>
        <Button className="w-full animationCustom" style={{backgroundColor: "transparent", borderRadius: "25px", padding: "8px", color: "black"}} onClick={handleCancel}>Cancel</Button>
    </TroveEditor>
  );
};
