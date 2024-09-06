import React from "react";
import { ReadOnlyTrove } from "./ReadOnlyTrove";
import { NoTrove } from "./NoTrove";
import { Opening } from "./Opening";
import { Adjusting } from "./Adjusting";
import { RedeemedTrove } from "./RedeemedTrove";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { LiquidatedTrove } from "./LiquidatedTrove";
import { Decimal } from "../../lib/@rolliq/lib-base";

const Trove = props => {
  const { view } = useTroveView();
  if(view == "ACTIVE" || view == "CLOSING"){
    return <ReadOnlyTrove {...props} />;
  }
  switch (view) {
    case "ADJUSTING": {
      return <Adjusting {...props} />;
    }
    // case "": {
    //   return <TroveManager {...props} collateral={Decimal.ZERO} debt={Decimal.ZERO} />;
    // }
    case "LIQUIDATED": {
      // return <LiquidatedTrove {...props} />;
      return <Opening {...props} />;
    }
    case "REDEEMED": {
      // return <RedeemedTrove {...props} />;
      return <Opening {...props} />;
    }
    case "OPENING": {
      return <Opening {...props} />;
    }
    case "NONE": {
      // return <NoTrove {...props} />;
      return <Opening {...props} />;
    }
  }
};

export default Trove;