import { Box, Flex, Button, Card } from "theme-ui";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { COIN } from "../../strings";

import zksync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json";

import { useStakingView } from "../../components/Staking/context/StakingViewContext";
import { StakingGainsAction } from "./StakingGainsAction";
import React, { useEffect, useState } from "react";
import { Divider, Text, Flex as FlexC, Fade } from "@chakra-ui/react";
import { StaticRowM6 } from "../TROVE/EditorM6";
import { InfoIcon } from "../TROVE/InfoIcon";
import { useRolliq } from "../../hooks/RolliqContext";
import ERC20MockContract from "../SWAP/contract/utils/ERC20MockContract";
import BigNumber from "bignumber.js";
import { StakingPage } from "./components/StakingPage";
import { UnstakingPage } from "./components/UnstakingPage";

const select = ({ riqStake, totalStakedRIQ }) => ({
  riqStake,
  totalStakedRIQ
});

export const ReadOnlyStake = ({riqPrice}) => {
  const { changePending, dispatch } = useStakingView();
  const { riqStake, totalStakedRIQ } = useRolliqSelector(select);

  const poolShare = riqStake.stakedRIQ.mulDiv(100, totalStakedRIQ);

  const {provider} = useRolliq();
  const [totalInPool, setTotalInPool] = useState("N/A");
  useEffect(() => {
    init2();
  }, []);
  const init2 = async () => {
    const erc20Contract = ERC20MockContract.getContractFactory(provider, zksync.addresses.riqToken, { decimals: 18 });
    const balancePool = await erc20Contract.getBalance(zksync.addresses.riqStaking);
    setTotalInPool(BigNumber(balancePool).toFixed(2));
  }

  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Box className="py-10 ">
      <Box className="flex justify-center ">
        <Box className="bg-[#fff] p-8 w-full sm:w-[600px]" style={{borderRadius: "48px"}}>
          {
            currentPage == 1 &&
            <>
            <Fade in={currentPage == 1}>
              <div className="flex">
                <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Staking</Text>
              </div>

              <Divider className="mb-[20px] mt-5" color="#E5E7EB" border="1px solid"/>

              <Text className="text-[#1E2185] fontCustom-bold text-[14px]">Staked</Text>
              <Box className="pt-1"></Box>
              <Text className="text-[black] fontCustom-bold text-[24px]">{riqStake.stakedRIQ.prettify(4)} <span className="text-[gray] text-[18px]">RIQ</span></Text>
              <Box className="py-1"></Box>
              <Text className="text-[12px] fontCustom-Medium">~${riqStake.stakedRIQ.mul(riqPrice).prettify(2)}</Text>
              
              <Divider className="mb-[20px] mt-5" color="#E5E7EB" border="1px solid"/>

              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Total in pool
                  {/* <InfoIcon
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
                  /> */}
                </Text>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{totalInPool === "N/A" ? "N/A" : `${totalInPool} RIQ`}</Text>
              </FlexC>
              <Box py={1}></Box>

              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold">
                  Your pool share
                </Text>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{poolShare.prettify(2)}%</Text>
              </FlexC>
              <Box py={1}></Box>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold">
                  RUSD received
                </Text>
                <StaticRowM6
                  label="Issuance gain"
                  inputId="stake-gain-rusd"
                  amount={riqStake.rusdGain.prettify(4)}
                  color={riqStake.rusdGain.nonZero && "success"}
                  unit={COIN}
                />
              </FlexC>
              <Box py={1}></Box>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold">
                ETH received
                </Text>
                <StaticRowM6
                  label="Redemption gain"
                  inputId="stake-gain-eth"
                  amount={riqStake.collateralGain.prettify(4)}
                  color={riqStake.collateralGain.nonZero && "success"}
                  unit="ETH"
                />
              </FlexC>

              <Box sx={{ pt: [3, 4] }}>
                <Flex className="flex-col">
                  <Button className="w-full fontCustom-bold animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px", color: "white"}} onClick={() => setCurrentPage(2)}>Stake</Button>
                  <Box py={1}></Box>
                  <StakingGainsAction />
                  <Box py={1}></Box>
                  <Button className="w-full fontCustom-bold animationCustom" style={{backgroundColor: "transparent", borderRadius: "25px", padding: "7px", color: "#1E2185"}} onClick={() => setCurrentPage(3)}>Unstake</Button>
                </Flex>
              </Box></Fade>
            </>
          }
          {
            currentPage == 2 &&
            
            <Fade in={currentPage == 2}>
            <StakingPage riqPrice={riqPrice} setCurrentPage={setCurrentPage}/>
            </Fade>
          }
          {
            currentPage == 3 &&
            <Fade in={currentPage == 3}>
            <UnstakingPage riqPrice={riqPrice} setCurrentPage={setCurrentPage}/>
            </Fade>
          }
        </Box>
      </Box>
    </Box>
  );
};
