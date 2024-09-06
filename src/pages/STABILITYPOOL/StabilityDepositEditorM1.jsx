import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";
import USD from "../TROVE/assets/USD.png";

import { Difference } from "../../lib/@rolliq/lib-base";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../../components/WalletConnector/Icon";
import { EditableRow, StaticRow } from "../TROVE/Editor";
import { LoadingOverlay } from "../TROVE/LoadingOverlay";
import { InfoIcon } from "../TROVE/InfoIcon";
import { Text, Flex as FlexC, Divider } from "@chakra-ui/react";
import { EditableRowM1 } from "../TROVE/EditorM1";
import { StaticRowM2 } from "../TROVE/EditorM2";
import { EditableRowM5 } from "../TROVE/EditorM5";

const select = ({ rusdBalance, rusdInStabilityPool }) => ({
  rusdBalance,
  rusdInStabilityPool,
});

export const StabilityDepositEditorM1 = ({
  originalDeposit,
  editedRUSD,
  changePending,
  dispatch,
  makingNewDeposit,
  children,
}) => {
  const { rusdBalance, rusdInStabilityPool } = useRolliqSelector(select);
  const editingState = useState();

  const edited = !editedRUSD.eq(originalDeposit.currentRUSD);

  const maxAmount = originalDeposit.currentRUSD.add(rusdBalance);
  const maxedOut = editedRUSD.eq(maxAmount);

  const rusdInStabilityPoolAfterChange = rusdInStabilityPool
    .sub(originalDeposit.currentRUSD)
    .add(editedRUSD);

  const originalPoolShare = originalDeposit.currentRUSD.mulDiv(
    100,
    rusdInStabilityPool
  );
  const newPoolShare = editedRUSD.mulDiv(100, rusdInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentRUSD.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md sm:3/4 md:w-4/6 lg:w-1/2">
          <div className="flex">
            <Text className="text-2xl font-bold text-[#1E2185]">
              {makingNewDeposit ? "Supply rUSD" : "Stability pool"}
            </Text>
            {edited && !changePending && (
              <Button
                variant="titleIcon"
                sx={{ ":enabled:hover": { color: "danger" } }}
                onClick={() => dispatch({ type: "revert" })}  className="fontCustom-bold"
              >
                <Icon name="history" size="lg" />
              </Button>
            )}
          </div>

          <Divider className="my-4" color="#E5E7EB" border="1px solid" />

          <FlexC justifyContent="space-between" alignItems="flex-end">
            <Text className="text-[#1E2185] font-bold">Supplying</Text>
            <div className="flex gap-3 max-[500px]:gap-1">
              <Text className="text-sm text-[#6B7280]">
                Balance: {maxAmount.toString()} rUSD
              </Text>
              <Button
                style={{
                  padding: 0,
                  border: 0,
                  fontWeight: "normal",
                  fontSize: "small",
                  backgroundColor: "transparent",
                  color: "#1E2185",
                }} className="fontCustom-bold"
                onClick={() => {
                  dispatch({
                    type: "setStake",
                    newValue: maxAmount.toString(),
                  });
                }}
              >
                MAX
              </Button>
            </div>
          </FlexC>
          <Box sx={{ pt: [2] }}>
            <EditableRowM5
              label="Deposit"
              inputId="deposit-riq"
              amount={editedRUSD.prettify()}
              maxAmount={maxAmount.toString()}
              maxedOut={maxedOut}
              unit={COIN}
              img={USD}
              coin={"rUSD"}
              {...{ editingState }}
              editedAmount={editedRUSD.toString(2)}
              setEditedAmount={(newValue) =>
                dispatch({ type: "setDeposit", newValue })
              }
            />
          </Box>
          <Divider className="mt-6 mb-4" color="#E5E7EB" border="1px solid" />
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm font-bold">
              Total in pool
              <InfoIcon
                tooltip={
                  <Card
                    sx={{ minWidth: "200px" }}
                    style={{
                      borderRadius: "10px",
                      color: "white",
                      padding: "10px",
                    }}
                    variant="tooltip"
                  >
                    ...
                  </Card>
                }
              />
            </Text>
            <StaticRowM2
              label="Pool share"
              inputId="deposit-share"
              amount="2,043,000 rUSD"
            />
          </FlexC>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm font-bold">
              Your pool share
              <InfoIcon
                tooltip={
                  <Card
                    sx={{ minWidth: "200px" }}
                    style={{
                      borderRadius: "10px",
                      color: "white",
                      padding: "10px",
                    }}
                    variant="tooltip"
                  >
                    ...
                  </Card>
                }
              />
            </Text>
            <StaticRowM2
              label="Pool share"
              inputId="deposit-share"
              amount="0.5%"
            />
          </FlexC>

          {!originalDeposit.isEmpty && (
            <>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm font-bold">
                  Liquidation gain
                </Text>
                <StaticRowM2
                  label="Liquidation gain"
                  inputId="deposit-gain"
                  amount={originalDeposit.collateralGain.prettify(6)}
                  color={originalDeposit.collateralGain.nonZero && "success"}
                  unit="ETH"
                />
              </FlexC>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm font-bold">
                  Reward
                  <InfoIcon
                    tooltip={
                      <Card
                        sx={{ minWidth: "200px" }}
                        style={{
                          borderRadius: "10px",
                          color: "white",
                          padding: "10px",
                        }}
                        variant="tooltip"
                      >
                        Although the RIQ rewards accrue every minute, the value
                        on the UI only updates when a user transacts with the
                        Stability Pool. Therefore you may receive more rewards
                        than is displayed when you claim or adjust your deposit.
                      </Card>
                    }
                  />
                </Text>
                <StaticRowM2
                  label="Reward"
                  inputId="deposit-reward"
                  amount={originalDeposit.riqReward.prettify(6)}
                  color={originalDeposit.riqReward.nonZero && "success"}
                  unit={GT}
                />
              </FlexC>
            </>
          )}
          <Box className="py-3"></Box>
          {children}
          {/* {changePending && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box>
  );
};
