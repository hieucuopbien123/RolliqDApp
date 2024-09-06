import React from "react";
import { useStakingView } from "../../components/Staking/context/StakingViewContext";
import { NoStake } from "./NoStake";
import { ReadOnlyStake } from "./ReadOnlyStake";
import { StakingManager } from "./StakingManager";
import { useState } from "react";
import BigNumber from "bignumber.js";
import { useEffect } from "react";
import RouterContract from "../SWAP/contract/utils/Router";
import zksync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import PriceFeedContract from "../TROVE/contracts/utils/PriceFeed";

const Staking = () => {
  const { view } = useStakingView();
  const [riqPrice, setRIQPrice] = useState(0);
  const BASE18 = BigNumber("1000000000000000000");
  useEffect(() => {
    init2();
  }, []);
  const init2 = async () => {
    const price = await RouterContract.getAmountsOut(BASE18.toFixed(), [zksync.addresses.riqToken, "0x3700FD466Cd8882d238315090F2248460ef4D103"]); // contract wrapETH
    const priceFetch = await PriceFeedContract.getLastGoodPrice();
    setRIQPrice((BigNumber(price[1]).dividedBy(BASE18).toNumber() * BigNumber(priceFetch).dividedBy(BASE18).toNumber()));
  }

  switch (view) {
    case "ACTIVE":
      return <ReadOnlyStake riqPrice={riqPrice}/>;

    case "ADJUSTING":
      return <StakingManager riqPrice={riqPrice}/>;

    case "NONE":
      // return <NoStake />;
      return <StakingManager riqPrice={riqPrice}/>;
  }
};

export default Staking;