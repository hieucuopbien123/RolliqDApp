import React, { useCallback } from "react";
import { Card, Heading, Box, Button, Flex } from "theme-ui";
import { CollateralSurplusAction } from "./CollateralSurplusAction";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { InfoMessage } from "./InfoMessage";
import { Icon } from "../../components/WalletConnector/Icon";
import { Text } from "@chakra-ui/react";

const select = ({ collateralSurplusBalance }) => ({
  hasSurplusCollateral: !collateralSurplusBalance.isZero
});

export const LiquidatedTrove = () => {
  const { hasSurplusCollateral } = useRolliqSelector(select);
  const { dispatchEvent } = useTroveView();

  const handleOpenTrove = useCallback(() => {
    dispatchEvent("OPEN_TROVE_PRESSED");
  }, [dispatchEvent]);

  return (
    
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md sm:3/4 md:w-4/6 lg:w-1/2">
          <Text className="text-2xl font-bold text-[#1E2185]">Trove</Text>
          <Box sx={{ p: [2, 3] }}>
            <InfoMessage title="Your Trove has been liquidated." icon={<Icon name="info-circle" />}>
              {hasSurplusCollateral
                ? "Please reclaim your remaining collateral before opening a new Trove."
                : "You can borrow RUSD against ETH collateral by opening a Trove."}
            </InfoMessage>

            <Flex variant="layout.actions">
              {hasSurplusCollateral && <CollateralSurplusAction />}
              {!hasSurplusCollateral && <Button onClick={handleOpenTrove} className="fontCustom-bold animationCustom">Open Trove</Button>}
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
