import React from "react";
import { StaticRowM2 } from "./EditorM2";

export const LiquidationPriceM1 = ({ value, change, recovery = false }) => {
  const valueWrapped = value ? `$${value.toString(2)}` : 'N/A';
  return (
    <>
      <StaticRowM2
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
          valueWrapped === 'N/A' ? '#6B7280' : undefined
        }
        pendingColor={change?.negative ? "success" : "danger"}
      />
    </>
  );
};
