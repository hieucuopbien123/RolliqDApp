import React from "react";
import { Heading, Box, Card, Flex } from "theme-ui";

import {
  Percent,
  Difference,
} from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { Icon } from "../../components/WalletConnector/Icon";
import { LoadingOverlay } from "./LoadingOverlay";
import { InfoIcon } from "./InfoIcon";

import { calcLiquidationPrice, calcLiquidationPriceInRecoveryMode } from "../../utils/troveUtils";
import { Divider, Text, Flex as FlexC } from "@chakra-ui/react";
import { CollateralRatioM2 } from "./CollateralRatioM2";
import { LiquidationPriceM1 } from "./LiquidationPriceM1";

const select = ({ price }) => ({ price });

export const TroveEditor = ({
  children,
  original,
  edited,
  fee,
  borrowingRate,
  changePending
}) => {
  const { price } = useRolliqSelector(select);

  const feePct = new Percent(borrowingRate);

  const originalCollateralRatio = !original.isEmpty ? original.collateralRatio(price) : undefined;
  const collateralRatio = !edited.isEmpty ? edited.collateralRatio(price) : undefined;
  const collateralRatioChange = Difference.between(collateralRatio, originalCollateralRatio);

  const originalLiquidationPrice = !original.isEmpty ? calcLiquidationPrice(original) : undefined;
  const originalLiquidationPriceRecovery = !original.isEmpty ? calcLiquidationPriceInRecoveryMode(original) : undefined;
  const liquidationPrice = !edited.isEmpty ? calcLiquidationPrice(edited) : undefined;
  const liquidationPriceChange = Difference.between(liquidationPrice, originalLiquidationPrice);

  const liquidationPriceRecovery = !edited.isEmpty ? calcLiquidationPrice(edited) : undefined;
  const liquidationPriceRecoveryChange = Difference.between(liquidationPriceRecovery, originalLiquidationPriceRecovery);

  return (
  <Box className="py-10">
    <Box className="flex justify-center">
      <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md sm:3/4 md:w-4/6 lg:w-1/2">
        <div className="flex">
          <Text className="text-2xl font-bold text-[#1E2185]">Trove</Text>
        </div>
        <Divider className="mb-3 mt-6" color="#E5E7EB" border="1px solid"/>

        <Box className="flex gap-4 justify-between flex-wrap pr-3">
          <Box>
            <Text className="text-[#1E2185] text-sm font-bold">Collateral</Text>
            <Text><span className="text-[#111827] text-[23px] font-bold">{edited.collateral.prettify(2)}</span>&nbsp;<span className="text-[#6B7280]">ETH</span></Text>
          </Box>
          <Box>
            <Text className="text-[#1E2185] text-sm font-bold">Net Debt</Text>
            <Text><span className="text-[#111827] text-[23px] font-bold">{edited.debt.prettify()}</span>&nbsp;<span className="text-[#6B7280]">RUSD</span></Text>
          </Box>
          <Box>
            <Text className="text-[#1E2185] text-sm font-bold">Ratio</Text>
            <CollateralRatioM2 value={collateralRatio} change={collateralRatioChange} />
          </Box>
        </Box>
        <Divider className="my-4" color="#E5E7EB" border="1px solid"/>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm font-bold">
              Liquidation price (Normal mode)
              <InfoIcon
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{backgroundColor: "#1E2185", borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'110%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
                  </Card>
                }
              />
            </Text>
            <LiquidationPriceM1 value={liquidationPrice} change={liquidationPriceChange} />
          </FlexC>
          <Box py={1}></Box>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm font-bold">
              Liquidation price (Recovery mode)
              <InfoIcon
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{backgroundColor: "#1E2185", borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'150%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
                  </Card>
                }
              />
            </Text>
            <LiquidationPriceM1 value={liquidationPriceRecovery} change={liquidationPriceRecoveryChange} recovery={true} />
          </FlexC>
          <Box className="py-3"></Box>
          {children}
        </Box>
        {/* {changePending && <LoadingOverlay />} */}
      </Box>
    </Box>
  );
};
