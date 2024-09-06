import { Card, Heading, Box, Flex, Button, Link } from "theme-ui";

import { GT } from "../../strings";

import { InfoMessage } from "../TROVE/InfoMessage";
import { Icon } from "../../components/WalletConnector/Icon";
import { useStakingView } from "../../components/Staking/context/StakingViewContext";
import React from "react";

export const NoStake = () => {
  const { dispatch } = useStakingView();

  return (
    <Card>
      <Heading>
        <div>
          <Icon name="coins" style={{ marginRight: '12px' }} />
          Staking
        </div>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title={`You haven't staked ${GT} yet.`} icon={<Icon name="info-circle" />}>
          Stake {GT} to earn a share of protocol fees in ETH and RUSD. Learn more: <Link href="https://docs.rolliq.org/faq/staking#how-does-staking-work-in-rolliq" target="_blank">How does Staking work? <Icon name="external-link-alt" /></Link>
        </InfoMessage>

        <Flex variant="layout.actions">
          <Button onClick={() => dispatch({ type: "startAdjusting" })} className="fontCustom-bold animationCustom">Start staking</Button>
        </Flex>
      </Box>
    </Card>
  );
};
