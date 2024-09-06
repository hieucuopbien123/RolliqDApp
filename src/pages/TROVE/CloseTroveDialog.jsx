import { useCallback, useEffect, useState } from "react";
import { Flex, Button } from "theme-ui";

import { Decimal, Trove, RUSD_MINIMUM_DEBT } from "../../lib/@rolliq/lib-base";

import { useRolliqReducer, useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { ActionDescription } from "./ActionDescription";
import { useMyTransactionState } from "../../components/Trasaction";

import { TroveEditor } from "./TroveEditor";
import { TroveActionM2 } from "./TroveActionM2";
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

export const CloseTroveDialog = ({ description, openingNewTrove, validChange, maxBorrowingRate }) => {

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

  useEffect(() => {

  }, [])

  return (
    <>
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
        <TroveActionM2
          transactionId={`${transactionIdPrefix}${validChange.type}`}
          change={validChange}
          maxBorrowingRate={maxBorrowingRate}
          borrowingFeeDecayToleranceMinutes={60}
        >
          Close trove
        </TroveActionM2>
      ) : (
        <Button className="w-full fontCustom-bold animationCustom" style={{color: "black", backgroundColor: "transparent", borderRadius: "25px", padding: "8px"}}>Close trove</Button>
      )}
    </>
  );
};
