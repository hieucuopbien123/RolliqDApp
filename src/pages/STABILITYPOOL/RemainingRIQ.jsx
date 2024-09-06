import React from "react";
import { Flex } from "theme-ui";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

const selector = ({ remainingStabilityPoolRIQReward }) => ({
  remainingStabilityPoolRIQReward
});

export const RemainingRIQ = () => {
  const { remainingStabilityPoolRIQReward } = useRolliqSelector(selector);

  return (
    <Flex sx={{ mr: 2, fontSize: 2, fontWeight: "medium" }}>
      {remainingStabilityPoolRIQReward.prettify(0)} RIQ remaining
    </Flex>
  );
};
