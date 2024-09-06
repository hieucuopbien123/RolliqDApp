import React from "react";
import { CRITICAL_COLLATERAL_RATIO, Percent } from "../../lib/@rolliq/lib-base";
import { StaticRowM3 } from "./EditorM3";

export const CollateralRatioM2 = ({ value, change }) => {
  const collateralRatioPct = new Percent(value ?? { toString: () => "N/A" });
  const changePct = change && new Percent(change);
  return (
    <>
      <StaticRowM3
        amount={collateralRatioPct.prettify()}
        // color={
        //   value?.gt(CRITICAL_COLLATERAL_RATIO)
        //     ? "success"
        //     : value?.gt(1.2)
        //     ? "warning"
        //     : value?.lte(1.2)
        //     ? "danger"
        //     : "black"
        // }
        pendingAmount={
          change?.positive?.absoluteValue?.gt(10)
            ? "++"
            : change?.negative?.absoluteValue?.gt(10)
            ? "--"
            : changePct?.nonZeroish(2)?.prettify()
        }
        pendingColor={change?.positive ? "success" : "danger"}
      />
    </>
  );
};
