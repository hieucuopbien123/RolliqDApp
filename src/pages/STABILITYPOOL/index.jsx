import React from "react";
import { StabilityDepositManagerCreate } from "./StabilityDepositManagerCreate";
import { ActiveDeposit } from "./ActiveDeposit";
import { NoDeposit } from "./NoDeposit";
import { useStabilityView } from "../../components/Stability/context/StabilityViewContext";

const Stability = props => {
  const { view } = useStabilityView();
  // console.log(view);
  switch (view) {
    case "NONE": {
      // Create rồi nhảy sang active
      return <StabilityDepositManagerCreate {...props} />;
    }
    case "DEPOSITING": {
      // Create rồi nhảy sang active
      // return <StabilityDepositManagerCreate {...props} />;
      return <ActiveDeposit {...props} />;
    }
    case "ADJUSTING": {
      // Withdraw and supply
      // return <StabilityDepositManager {...props} />;
      return <ActiveDeposit {...props} />;
    }
    case "ACTIVE": {
      // Claim ETH và nhảy sang deposit
      return <ActiveDeposit {...props} />;
    }
  }
};

export default Stability;