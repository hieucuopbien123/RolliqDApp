import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";

import {
  Difference
} from "../../lib/@rolliq/lib-base";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../../components/WalletConnector/Icon";
import { EditableRow, StaticRow } from "../TROVE/Editor";
import { LoadingOverlay } from "../TROVE/LoadingOverlay";
import { InfoIcon } from "../TROVE/InfoIcon";

const select = ({ rusdBalance, rusdInStabilityPool }) => ({
  rusdBalance,
  rusdInStabilityPool
});

export const StabilityDepositEditor = ({
  originalDeposit,
  editedRUSD,
  changePending,
  dispatch,
  children
}) => {
  const { rusdBalance, rusdInStabilityPool } = useRolliqSelector(select);
  const editingState = useState();

  const edited = !editedRUSD.eq(originalDeposit.currentRUSD);

  const maxAmount = originalDeposit.currentRUSD.add(rusdBalance);
  const maxedOut = editedRUSD.eq(maxAmount);

  const rusdInStabilityPoolAfterChange = rusdInStabilityPool
    .sub(originalDeposit.currentRUSD)
    .add(editedRUSD);

  const originalPoolShare = originalDeposit.currentRUSD.mulDiv(100, rusdInStabilityPool);
  const newPoolShare = editedRUSD.mulDiv(100, rusdInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentRUSD.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        <div>
          <Icon name="swimming-pool" style={{ marginRight: '12px' }} />
          Stability Pool
        </div>
        {edited && !changePending && (
          <Button
            variant="titleIcon"
            sx={{ ":enabled:hover": { color: "danger" } }}
            onClick={() => dispatch({ type: "revert" })} className="fontCustom-bold"
          >
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Deposit"
          inputId="deposit-riq"
          amount={editedRUSD.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={COIN}
          {...{ editingState }}
          editedAmount={editedRUSD.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setDeposit", newValue })}
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="deposit-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="deposit-share"
            amount={newPoolShare.prettify(6)}
            pendingAmount={poolShareChange?.prettify(6).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalDeposit.isEmpty && (
          <>
            <StaticRow
              label="Liquidation gain"
              inputId="deposit-gain"
              amount={originalDeposit.collateralGain.prettify(6)}
              color={originalDeposit.collateralGain.nonZero && "success"}
              unit="ETH"
            />

            <StaticRow
              label="Reward"
              inputId="deposit-reward"
              amount={originalDeposit.riqReward.prettify(6)}
              color={originalDeposit.riqReward.nonZero && "success"}
              unit={GT}
              infoIcon={
                <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} variant="tooltip">
                      Although the RIQ rewards accrue every minute, the value on the UI only updates
                      when a user transacts with the Stability Pool. Therefore you may receive more
                      rewards than is displayed when you claim or adjust your deposit.
                    </Card>
                  }
                />
              }
            />
          </>
        )}
        {children}
      </Box>

      {/* {changePending && <LoadingOverlay />} */}
    </Card>
  );
};
