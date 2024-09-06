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

export const ButtonCloseTrove = ({showClose, description, openingNewTrove, validChange, transactionIdPrefix, setShowClose, maxBorrowingRate}) => {
  
  return (
    <>
      {
        validChange 
        ? (
          <TroveActionM2
            transactionId={`${transactionIdPrefix}${validChange.type}`}
            change={validChange}
            maxBorrowingRate={maxBorrowingRate}
            borrowingFeeDecayToleranceMinutes={60}
            setShowClose={setShowClose}
            topmessage="Confirm close trove"
          >
            Close trove
          </TroveActionM2>
        )
        : (
          <>
            <Button className="w-full text-[18px] fontCustom-bold animationCustom" animationCustom style={{color: "black", backgroundColor: "transparent", borderRadius: "25px", padding: "8px"}} onClick={() => setShowClose(true)}>Close trove</Button>
          </>
        )
      }
    </>
  );
};
