import React, { useEffect, useState } from "react";
import { Box, Button, Card } from "theme-ui";

import { Difference } from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { GT } from "../../strings";

import { Icon } from "../../components/WalletConnector/Icon";
import { InfoIcon } from "../TROVE/InfoIcon";
import { LoadingOverlay } from "../TROVE/LoadingOverlay";

import { useStakingView } from "../../components/Staking/context/StakingViewContext";
import { Divider, Text, Flex as FlexC } from "@chakra-ui/react";
import RIQ from "./assets/RIQ.png";
import { StaticRowM2 } from "../TROVE/EditorM2";
import { EditableRowM5 } from "../TROVE/EditorM5";
import ERC20MockContract from "../SWAP/contract/utils/ERC20MockContract";
import { useRolliq } from "../../hooks/RolliqContext";
import zksync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import BigNumber from "bignumber.js";

const select = ({ riqBalance, totalStakedRIQ }) => ({
  riqBalance,
  totalStakedRIQ,
});

export const StakingEditor = ({
  children,
  title,
  originalStake,
  editedRIQ,
  dispatch,
  riqPrice
}) => {
  const { riqBalance, totalStakedRIQ } = useRolliqSelector(select);
  const { changePending } = useStakingView();
  const editingState = useState();

  const edited = !editedRIQ.eq(originalStake.stakedRIQ);

  const maxAmount = originalStake.stakedRIQ.add(riqBalance);
  const maxedOut = editedRIQ.eq(maxAmount);

  const totalStakedRIQAfterChange = totalStakedRIQ
    .sub(originalStake.stakedRIQ)
    .add(editedRIQ);

  const originalPoolShare = originalStake.stakedRIQ.mulDiv(100, totalStakedRIQ);
  const newPoolShare = editedRIQ.mulDiv(100, totalStakedRIQAfterChange);
  const poolShareChange =
    originalStake.stakedRIQ.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  const {provider} = useRolliq();
  const [totalInPool, setTotalInPool] = useState("N/A");
  useEffect(() => {
    init2();
  }, []);
  const init2 = async () => {
    const erc20Contract = ERC20MockContract.getContractFactory(provider, zksync.addresses.riqToken, { decimals: 18 });
    const balancePool = await erc20Contract.getBalance(zksync.addresses.riqStaking);
    setTotalInPool(BigNumber(balancePool).toFixed());
  }

  return (
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 shadow-md sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
          <div className="flex">
            <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Stake</Text>
            {edited && !changePending && (
              <Button className="fontCustom-bold"
                variant="titleIcon"
                sx={{ ":enabled:hover": { color: "danger" } }}
                onClick={() => dispatch({ type: "revert" })}
              >
                <Icon name="history" size="lg" />
              </Button>
            )}
          </div>

          <Divider className="my-5" color="#E5E7EB" border="1px solid"/>

          <FlexC justifyContent="space-between" alignItems="flex-end">
            <Text className="text-[#1E2185] text-[16px] fontCustom-bold">Staking</Text>
            <div className="flex gap-3 max-[500px]:gap-1">
              <Text className="text-[14px] fontCustom-Medium text-[#6B7280]">
                Balance: {maxAmount.prettify(2)} RIQ&nbsp;
              </Text>
              <Button
                style={{
                  padding: 0,
                  border: 0,
                  backgroundColor: "transparent",
                  color: "#1E2185",
                }} className="text-[14px]"
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
              label="Stake"
              inputId="stake-riq"
              amount={editedRIQ.prettify()}
              maxAmount={maxAmount.toString()}
              maxedOut={maxedOut}
              unit={GT}
              img={RIQ}
              coin="RIQ"
              {...{ editingState }}
              editedAmount={editedRIQ.toString(2)}
              setEditedAmount={(newValue) =>
                dispatch({ type: "setStake", newValue })
              }
              riqPrice={riqPrice}
            />
          </Box>

          <Divider className="mt-6 mb-4" color="#E5E7EB" border="1px solid" />

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
              Total in pool
              {/* <InfoIcon
                tooltip={
                  <Card
                    sx={{ minWidth: "200px" }}
                    style={{
                      backgroundColor: "#1E2185",
                      borderRadius: "10px",
                      color: "white",
                      padding: "10px",
                    }}
                    variant="tooltip"
                  >
                    ...
                  </Card>
                }
              /> */}
            </Text>
            <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{parseFloat(totalInPool).toFixed(2)} RIQ</Text>
          </FlexC>
          <Box style={{paddingTop: "8px"}}></Box>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
              Your pool share
              {/* <InfoIcon
                tooltip={
                  <Card
                    sx={{ minWidth: "200px" }}
                    style={{
                      backgroundColor: "#1E2185",
                      borderRadius: "10px",
                      color: "white",
                      padding: "10px",
                    }}
                    variant="tooltip"
                  >
                    ...
                  </Card>
                }
              /> */}
            </Text>
            {newPoolShare.infinite ? (
              <StaticRowM2
                label="Pool share"
                inputId="stake-share"
                amount="N/A"
              />
            ) : (
              <StaticRowM2
                label="Pool share"
                inputId="stake-share"
                amount={newPoolShare.prettify(4)}
                pendingAmount={poolShareChange?.prettify(6).concat("%")}
                pendingColor={poolShareChange?.positive ? "success" : "danger"}
                unit="%"
              />
            )}
          </FlexC>

          {!originalStake.isEmpty && (
            <>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Redemption gain
                </Text>
                <StaticRowM2
                  label="Redemption gain"
                  inputId="stake-gain-eth"
                  amount={originalStake.collateralGain.prettify(6)}
                  color={originalStake.collateralGain.nonZero && "success"}
                  unit="ETH"
                />
              </FlexC>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Issuance gain
                </Text>
                <StaticRowM2
                  label="Redemption gain"
                  inputId="stake-gain-eth"
                  amount={originalStake.collateralGain.prettify(6)}
                  color={originalStake.collateralGain.nonZero && "success"}
                  unit="ETH"
                />
              </FlexC>
            </>
          )}
          <div className="py-3"></div>
          <Box>{children}</Box>

          {/* {changePending && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box>
  );
};
