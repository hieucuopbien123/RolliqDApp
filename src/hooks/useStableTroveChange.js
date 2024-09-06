import { useEffect, useState } from "react";

const paramsEq = (a, b) => (a && b ? a.eq(b) : !a && !b);

const equals = (a, b) => {
  return (
    a.type === b.type &&
    paramsEq(a.params.borrowRUSD, b.params.borrowRUSD) &&
    paramsEq(a.params.repayRUSD, b.params.repayRUSD) &&
    paramsEq(a.params.depositCollateral, b.params.depositCollateral) &&
    paramsEq(a.params.withdrawCollateral, b.params.withdrawCollateral)
  );
};

export const useStableTroveChange = (troveChange) => {
  const [stableTroveChange, setStableTroveChange] = useState(troveChange);

  useEffect(() => {
    if (!!stableTroveChange !== !!troveChange) {
      setStableTroveChange(troveChange);
    } else if (
      stableTroveChange &&
      troveChange &&
      !equals(stableTroveChange, troveChange)
    ) {
      setStableTroveChange(troveChange);
    }
  }, [stableTroveChange, troveChange]);

  return stableTroveChange;
};
