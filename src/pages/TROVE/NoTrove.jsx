import React, { useCallback } from "react";
import { Card, Heading, Box, Flex, Button, Link } from "theme-ui";
import { InfoMessage } from "./InfoMessage";
import { Icon } from "../../components/WalletConnector/Icon";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";

export const NoTrove = props => {
  const { dispatchEvent } = useTroveView();

  const handleOpenTrove = useCallback(() => {
    dispatchEvent("OPEN_TROVE_PRESSED");
  }, [dispatchEvent]);

  return (
    <Card>
      <Heading>
        <div>
          <Icon name="piggy-bank" style={{ marginRight: '12px' }} />
          Trove
        </div>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title="You haven't borrowed any RUSD yet." icon={<Icon name="info-circle" style={undefined} />}>
        You can borrow RUSD against ETH collateral by opening a Trove. Learn more: <Link href="https://docs.rolliq.org/faq/borrowing#what-is-a-trove" target="_blank">What is a Trove? <Icon name="external-link-alt" style={undefined} /></Link>
        </InfoMessage>
        {/* <Box mx={1}>
          
        </Box> */}
        <Flex variant="layout.actions">
          <Button onClick={handleOpenTrove} className="fontCustom-bold">Open Trove</Button>
        </Flex>
      </Box>
    </Card>
  );
};
