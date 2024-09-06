import React, { useEffect, useState } from "react";
import { Flex, Box } from "theme-ui";

import { Decimal } from "../../../lib/@rolliq/lib-base";

import {
  useRolliqReducer,
  useRolliqSelector,
} from "../../../lib/@rolliq/lib-react";

import { GT, COIN } from "../../../strings";

import { useStakingView } from "../../../components/Staking/context/StakingViewContext";
import { StakingEditor } from "./StakingEditor";
import { StakingManagerAction } from "../StakingManagerAction";
import { ActionDescriptionM1, Amount } from "../ActionDescriptionM1";
import { ErrorDescription } from "../../TROVE/ErrorDescription";
import { Button } from "@chakra-ui/react";

const init = ({ riqStake }) => ({
  originalStake: riqStake,
  editedRIQ: riqStake.stakedRIQ,
});

const reduce = (state, action) => {
  // console.log(state);
  // console.log(action);

  const { originalStake, editedRIQ } = state;

  switch (action.type) {
    case "setStake":
      return { ...state, editedRIQ: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedRIQ: originalStake.stakedRIQ };

    case "updateStore": {
      const {
        stateChange: { riqStake: updatedStake },
      } = action;

      if (updatedStake) {
        return {
          originalStake: updatedStake,
          editedRIQ: updatedStake.apply(originalStake.whatChanged(editedRIQ)),
        };
      }
    }
  }

  return state;
};

const selectRIQBalance = ({ riqBalance }) => riqBalance;

const StakingManagerActionDescription = ({ originalStake, change }) => {
  const stakeRIQ = change.stakeRIQ?.prettify().concat(" ", GT);
  const unstakeRIQ = change.unstakeRIQ?.prettify().concat(" ", GT);
  const collateralGain = originalStake.collateralGain.nonZero
    ?.prettify(6)
    .concat(" ETH");
  const rusdGain = originalStake.rusdGain.nonZero
    ?.prettify(6)
    .concat(" ", COIN);

  if (originalStake.isEmpty && stakeRIQ) {
    return (
      <ActionDescriptionM1>
        You are staking <Amount>{stakeRIQ}</Amount>.
      </ActionDescriptionM1>
    );
  }

  return (
    <ActionDescriptionM1>
      {stakeRIQ && (
        <>
          You are adding <Amount>{stakeRIQ}</Amount> to your stake
        </>
      )}
      {unstakeRIQ && (
        <>
          You are withdrawing <Amount>{unstakeRIQ}</Amount> to your wallet
        </>
      )}
      {(collateralGain || rusdGain) && (
        <>
          {" "}
          and claiming{" "}
          {collateralGain && rusdGain ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{rusdGain}</Amount>
            </>
          ) : (
            <>
              <Amount>{collateralGain ?? rusdGain}</Amount>
            </>
          )}
        </>
      )}
      .
    </ActionDescriptionM1>
  );
};



export const StakingPage = ({setCurrentPage, riqPrice}) => {
  const { dispatch: dispatchStakingViewAction } = useStakingView();
  const [{ originalStake, editedRIQ }, dispatch] = useRolliqReducer(
    reduce,
    init
  );
  const riqBalance = useRolliqSelector(selectRIQBalance);

  const change = originalStake.whatChanged(editedRIQ);
  const [validChange, description] = !change
    ? [undefined, undefined]
    : change.stakeRIQ?.gt(riqBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeRIQ.sub(riqBalance).prettify(6)} {GT}
          </Amount>
          .
        </ErrorDescription>,
      ]
    : [
        change,
        <StakingManagerActionDescription
          originalStake={originalStake}
          change={change}
        />,
      ];

  const makingNewStake = originalStake.isEmpty;

  return (
    <StakingEditor setCurrentPage={setCurrentPage} title={"Stake"} {...{ originalStake, editedRIQ, dispatch, riqPrice }}>
      <Box className="pb-4">
        {description ??
          (makingNewStake ? (
            <ActionDescriptionM1>
              Staking {GT} gains you rUSD and ETH revenue from borrowing and redemption fees
            </ActionDescriptionM1>
          ) : (
            <ActionDescriptionM1>
              Adjust the {GT} amount to stake.
            </ActionDescriptionM1>
          ))}
      </Box>

      <Flex className="flex-col gap-2">
        {validChange ? (
          <StakingManagerAction change={validChange}>
            Stake
          </StakingManagerAction>
        ) : (
          <Button
            className="w-full fontCustom-bold text-[18px] animationCustom"
            style={{
              backgroundColor: "#1E2185",
              borderRadius: "25px",
              padding: "7px",
              color: "white",
              opacity: 0.7,
              cursor: "not-allowed",
            }}
          >
            Stake
          </Button>
        )}
      </Flex>
    </StakingEditor>
  );
};
