import React, { useCallback, useEffect, useState } from "react";
import { Card, Heading, Box, Flex, Button } from "theme-ui";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { COIN, GT } from "../../strings";
import { Icon } from "../../components/WalletConnector/Icon";
import { LoadingOverlay } from "../TROVE/LoadingOverlay";
import { useMyTransactionState } from "../../components/Trasaction";
import { DisabledEditableRow, StaticRow } from "../TROVE/Editor";
import { ClaimAndMove } from "./actions/ClaimAndMove";
import { ClaimRewards } from "./actions/ClaimRewards";
import { useStabilityView } from "../../components/Stability/context/StabilityViewContext";
import { RemainingRIQ } from "./RemainingRIQ";
import { Yield } from "./Yield";
import { InfoIcon } from "../TROVE/InfoIcon";
import { Text, Divider, Flex as FlexC, Fade } from "@chakra-ui/react";
import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";
import { SuppplyStabilityPool } from "./SupplyStabilityPool";
import { WithdrawStabilityPool } from "./WithdrawStabilityPool";
import useDevice from "../../utils/useMobile";

const selector = ({ stabilityDeposit, trove, rusdInStabilityPool }) => ({
  stabilityDeposit,
  trove,
  rusdInStabilityPool
});

const fakePriceRUSD = 1.02;

export const ActiveDeposit = () => {
  const { dispatchEvent } = useStabilityView();
  const { stabilityDeposit, trove, rusdInStabilityPool } = useRolliqSelector(selector);

  const poolShare = stabilityDeposit.currentRUSD.mulDiv(100, rusdInStabilityPool);

  const handleAdjustDeposit = useCallback(() => {
    dispatchEvent("ADJUST_DEPOSIT_PRESSED");
  }, [dispatchEvent]);

  const hasReward = !stabilityDeposit.riqReward.isZero;
  const hasGain = !stabilityDeposit.collateralGain.isZero;
  const hasTrove = !trove.isEmpty;

  const transactionId = "stability-deposit";
  const transactionState = useMyTransactionState(transactionId);
  const isWaitingForTransaction =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  useEffect(() => {
    if (transactionState.type === "confirmedOneShot") {
      dispatchEvent("REWARDS_CLAIMED");
    }
  }, [transactionState.type, dispatchEvent]);

  const [currentPage, setCurrentPage] = useState(1);

  const { isMobile } = useDevice();

  return (
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
          {
            currentPage == 1 &&
            <>
              <Fade in={currentPage == 1}>
              <div className="flex" style={{alignItems: "center", justifyContent: "space-between"}}>
                <Text className="text-2xl font-bold text-[#1E2185]">
                  Stability pool
                </Text>
              </div>
              
              <Divider className="mb-5 mt-6" color="#E5E7EB" border="1px solid"/>

              <Text className="text-[14px] text-[#1E2185] fontCustom-bold">Staked</Text>
              <div className="pt-1"></div>
              <Text><span className="text-[24px] fontCustom-bold">{stabilityDeposit.currentRUSD.prettify(2)}</span> <span className="fontCustom-Medium text-[18px]">rUSD</span></Text> 
              <div className="pt-1"></div>
              <Text className="fontCustom-Medium text-[12px]">~${stabilityDeposit.currentRUSD.mul(fakePriceRUSD).prettify(2)}</Text>

              <Divider className="mb-5 mt-6" color="#E5E7EB" border="1px solid"/>

              <FlexC justifyContent="space-between" alignItems="center">
                <Box className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
                  Total in pool
                </Box>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{rusdInStabilityPool.prettify(2)} rUSD</Text>
              </FlexC>

              <div className="pt-3"></div>

              <FlexC justifyContent="space-between" alignItems="center">
                <Box className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
                  Your pool share
                </Box>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{poolShare.prettify(2)}%</Text>
              </FlexC>

              <div className="pt-3"></div>

              <FlexC justifyContent="space-between" alignItems="center">
                <Box className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
                  Rewards
                  <InfoIcon
                    tooltip={
                      <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                        Although the RIQ rewards accrue every minute, the value on the UI only updates
                          when a user transacts with the Stability Pool. Therefore you may receive more
                          rewards than is displayed when you claim or adjust your deposit.
                      </Card>
                    }
                    placement={isMobile ? "top": undefined}
                  />
                </Box>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{stabilityDeposit.riqReward.prettify(6)} RIQ</Text>
              </FlexC>

              <div className="pt-3"></div>

              <FlexC justifyContent="space-between" alignItems="center">
                <Box className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
                  Liquidation gain
                </Box>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{stabilityDeposit.collateralGain.prettify(2)} ETH</Text>
              </FlexC>

              <Box className="py-3"></Box>
              <ActionDescriptionM1>Deposit rUSD to the Stability Pool and earn ETH liquidation bonuses and RIQ rewards.</ActionDescriptionM1>
              <Box className="py-3"></Box>

              <Button className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px"}} onClick={() => setCurrentPage(2)}>Supply</Button>
              <Box className="py-1"></Box>
              <ClaimRewards disabled={!hasGain && !hasReward}>Claim</ClaimRewards>
              <Box className="py-1"></Box>
              <ClaimAndMove disabled={!hasGain || !hasTrove}>Claim RIQ and move ETH to Trove</ClaimAndMove>
              <Box className="py-1"></Box>
              <Button className="w-full fontCustom-bold text-[18px] animationCustom" style={{backgroundColor: "transparent", borderRadius: "25px", padding: "7px", color: "#1E2185"}} onClick={() => setCurrentPage(3)}>Withdraw</Button>
            </Fade></>
          }
          {
            currentPage == 2 &&(
              <Fade in={currentPage == 2}>
              <SuppplyStabilityPool setCurrentPage={setCurrentPage}/>
              </Fade>
            )
          }
          {
            currentPage == 3 &&(
              <Fade in={currentPage == 3}>
              <WithdrawStabilityPool setCurrentPage={setCurrentPage}/></Fade>
            )
          }
        </Box>
      </Box>
    </Box>
  );
};
