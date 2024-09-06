import React, { useCallback } from "react";
import { Card, Heading, Box, Flex, Button, Link } from "theme-ui";
import { InfoMessage } from "../TROVE/InfoMessage";
import { Icon } from "../../components/WalletConnector/Icon";
import { useStabilityView } from "../../components/Stability/context/StabilityViewContext";
import { RemainingRIQ } from "./RemainingRIQ";
import { Yield } from "./Yield";

export const NoDeposit = props => {
  const { dispatchEvent } = useStabilityView();

  const handleOpenTrove = useCallback(() => {
    dispatchEvent("DEPOSIT_PRESSED");
  }, [dispatchEvent]);

  return (
    <Card>
      <Heading>
        <div>
          <Icon name="swimming-pool" style={{ marginRight: '12px' }} />
          Stability Pool
        </div>
        <Flex sx={{ justifyContent: "flex-end" }}>
          <RemainingRIQ />
        </Flex>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title="You have no RUSD in the Stability Pool." icon={<Icon name="info-circle" />}>
          You can earn RIQ rewards and buy ETH at a discount by depositing RUSD. Learn more: <Link href="https://docs.rolliq.org/faq/stability-pool-and-liquidations#what-is-the-stability-pool" target="_blank">What is the Stability Pool? <Icon name="external-link-alt" /></Link>
        </InfoMessage>

        <Flex variant="layout.actions">
          <Flex sx={{ justifyContent: "flex-start", flex: 1, alignItems: "center" }}>
            <Yield />
          </Flex>
          <Button onClick={handleOpenTrove} className="fontCustom-bold animationCustom">Deposit</Button>
        </Flex>
      </Box>
    </Card>
  );
};
