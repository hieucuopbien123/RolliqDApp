import React from "react";
import { Flex, Box, Card } from "theme-ui";

import { CRITICAL_COLLATERAL_RATIO, Percent } from "../../lib/@rolliq/lib-base";

import { Icon } from "../../components/WalletConnector/Icon";

import { StaticRow } from "./Editor";
import { InfoIcon } from "./InfoIcon";
import { ActionDescription } from "./ActionDescription";

export const CollateralRatio = ({ value, change }) => {
  const collateralRatioPct = new Percent(value ?? { toString: () => "N/A" });
  const changePct = change && new Percent(change);
  return (
    <>
      <Flex>
        <Box sx={{ mt: [2, 0], ml: 3, width: '24px', fontSize: "24px", textAlign: 'center' }}>
          <Icon name="heartbeat" />
        </Box>

        <StaticRow
          label="Collateral ratio"
          inputId="trove-collateral-ratio"
          amount={collateralRatioPct.prettify()}
          color={
            value?.gt(CRITICAL_COLLATERAL_RATIO)
              ? "success"
              : value?.gt(1.2)
              ? "warning"
              : value?.lte(1.2)
              ? "danger"
              : "muted"
          }
          pendingAmount={
            change?.positive?.absoluteValue?.gt(10)
              ? "++"
              : change?.negative?.absoluteValue?.gt(10)
              ? "--"
              : changePct?.nonZeroish(2)?.prettify()
          }
          pendingColor={change?.positive ? "success" : "danger"}
          infoIcon={
            <InfoIcon
              tooltip={
                <Card sx={{minWidth: '200px'}} variant="tooltip">
                  The ratio between the dollar value of the collateral and the debt (in RUSD) you are
                  depositing. While the Minimum Collateral Ratio is 110% during normal operation, it
                  is recommended to keep the Collateral Ratio always above 150% to avoid liquidation
                  under Recovery Mode. A Collateral Ratio above 200% or 250% is recommended for
                  additional safety.
                </Card>
              }
            />
          }
        />
      </Flex>
      {value?.lt(1.5) && (
        <ActionDescription>
          Keeping your CR above 150% can help avoid liquidation under Recovery Mode.
        </ActionDescription>
      )}
    </>
  );
};
