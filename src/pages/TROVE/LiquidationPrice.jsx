import React from "react";
import { Flex, Box, Card } from "theme-ui";

import { Icon } from "../../components/WalletConnector/Icon";

import { StaticRow } from "./Editor";
import { InfoIcon } from "./InfoIcon";
import { Link } from "theme-ui";

export const LiquidationPrice = ({ value, change, recovery = false }) => {
  const valueWrapped = value ? `$${value.toString(2)}` : 'N/A';
  return (
    <>
      <Flex>
        <Box sx={{ mt: [2, 0], ml: 3, width: '24px', fontSize: "24px", textAlign: 'center' }}>
          <Icon name="search-dollar" />
        </Box>

        <StaticRow
          label={`Liquidation price (${recovery ? 'Recovery mode' : 'Normal mode'})`}
          inputId="trove-liquidation-price"
          amount={valueWrapped}
          pendingAmount={
            change?.positive?.absoluteValue?.gt(1)
              ? "++"
              : change?.negative?.absoluteValue?.gt(1)
              ? "--"
              : ''
          }
          color={
            valueWrapped === 'N/A' ? 'muted' : undefined
          }
          pendingColor={change?.negative ? "success" : "danger"}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card sx={{minWidth: '200px'}} variant="tooltip">
                  <Link href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></Link> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{recovery ? '150%' : '110%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
                </Card>
              }
            />
          }
        />
      </Flex>
    </>
  );
};
