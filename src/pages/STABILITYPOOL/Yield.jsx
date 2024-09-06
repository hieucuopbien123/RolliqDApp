import React, { useEffect, useState } from "react";
import { Card, Paragraph, Text } from "theme-ui";
import { Decimal } from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { InfoIcon } from "../TROVE/InfoIcon";
import { Badge } from "../TROVE/Badge";
import { fetchRiqPrice } from "./context/fetchRiqPrice";

const selector = ({ rusdInStabilityPool, remainingStabilityPoolRIQReward }) => ({
  rusdInStabilityPool,
  remainingStabilityPoolRIQReward
});

const yearlyIssuanceFraction = 0.5;
const dailyIssuanceFraction = Decimal.from(1 - yearlyIssuanceFraction ** (1 / 365));
const dailyIssuancePercentage = dailyIssuanceFraction.mul(100);

export const Yield = () => {
  const { rusdInStabilityPool, remainingStabilityPoolRIQReward } = useRolliqSelector(selector);

  const [riqPrice, setRiqPrice] = useState(undefined);
  const hasZeroValue = remainingStabilityPoolRIQReward.isZero || rusdInStabilityPool.isZero;

  useEffect(() => {
    (async () => {
      try {
        const { riqPriceUSD } = await fetchRiqPrice();
        setRiqPrice(riqPriceUSD);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  if (hasZeroValue || riqPrice === undefined) return null;

  const riqIssuanceOneDay = remainingStabilityPoolRIQReward.mul(dailyIssuanceFraction);
  const riqIssuanceOneDayInUSD = riqIssuanceOneDay.mul(riqPrice);
  const aprPercentage = riqIssuanceOneDayInUSD.mulDiv(365 * 100, rusdInStabilityPool);
  const remainingRiqInUSD = remainingStabilityPoolRIQReward.mul(riqPrice);

  if (aprPercentage.isZero) return null;

  return (
    <Badge>
      <Text>RIQ APR {aprPercentage.toString(2)}%</Text>
      <InfoIcon
        tooltip={
          <Card sx={{minWidth: '200px'}} variant="tooltip">
            <Paragraph>
              An <Text sx={{ fontWeight: "bold" }}>estimate</Text> of the RIQ return on the RUSD
              deposited to the Stability Pool over the next year, not including your ETH gains from
              liquidations.
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace", mt: 2 }}>
              ($RIQ_REWARDS * DAILY_ISSUANCE% / DEPOSITED_RUSD) * 365 * 100 ={" "}
              <Text sx={{ fontWeight: "bold" }}> APR</Text>
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace" }}>
              ($
              {remainingRiqInUSD.shorten()} * {dailyIssuancePercentage.toString(4)}% / $
              {rusdInStabilityPool.shorten()}) * 365 * 100 =
              <Text sx={{ fontWeight: "bold" }}> {aprPercentage.toString(2)}%</Text>
            </Paragraph>
          </Card>
        }
      ></InfoIcon>
    </Badge>
  );
};
