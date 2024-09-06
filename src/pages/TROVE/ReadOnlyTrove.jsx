import React, { useCallback, useEffect, useState } from "react";
import { Card, Box } from "theme-ui";
import { useRolliqReducer, useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { Icon } from "../../components/WalletConnector/Icon";
import { COIN } from "../../strings";
import { CollateralRatio } from "./CollateralRatio";
import { LiquidationPrice } from "./LiquidationPrice";

import { calcLiquidationPrice, calcLiquidationPriceInRecoveryMode } from "../../utils/troveUtils";
import { Divider, Text, Flex as FlexC, Button as ButtonC, Fade } from "@chakra-ui/react";
import { CollateralRatioM1 } from "./CollateralRatioM1";
import { CollateralRatioM2 } from "./CollateralRatioM2";
import { LiquidationPriceM1 } from "./LiquidationPriceM1";
import { InfoIcon } from "./InfoIcon";
import PriceFeedContract from "./contracts/utils/PriceFeed";
import BigNumber from "bignumber.js";
import { CRITICAL_COLLATERAL_RATIO, Percent } from "../../lib/@rolliq/lib-base";
import { StaticRowM2 } from "./EditorM2";
import TroveManager from "./contracts/utils/TroveManager";
import { useRolliq } from "../../hooks/RolliqContext";
import { ButtonCloseTrove } from "./ButtonCloseTrove";
import { useMyTransactionState } from "../../components/Trasaction";
import { selectForTroveChangeValidation, validateTroveChange } from "./validation/validateTroveChange";
import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";
import useDevice from "../../utils/useMobile";
import { Abbreviation } from "../RISKYTROVE/Abbreviation";

const BASE18 = BigNumber("1000000000000000000");
const select = ({ trove, price }) => ({ trove, price });

const selector = (state) => {
  const { fees } = state;
  return {
    fees
  };
};



const init = ({ trove }) => ({
  original: trove,
  edited: new Trove(trove.collateral, trove.debt),
  changePending: false,
  debtDirty: false,
  addedMinimumDebt: false
});

const reduceWith = (action) => (state) =>
  reduce(state, action);

const addMinimumDebt = reduceWith({ type: "addMinimumDebt" });
const removeMinimumDebt = reduceWith({ type: "removeMinimumDebt" });
const finishChange = reduceWith({ type: "finishChange" });
const revert = reduceWith({ type: "revert" });

const reduce = (state, action) => {

  const { original, edited, changePending, debtDirty, addedMinimumDebt } = state;

  switch (action.type) {
    case "startChange": {
      // console.log("starting change");
      return { ...state, changePending: true };
    }

    case "finishChange":
      return { ...state, changePending: false };

    case "setCollateral": {
      const newCollateral = Decimal.from(action.newValue);

      const newState = {
        ...state,
        edited: edited.setCollateral(newCollateral)
      };

      if (!debtDirty) {
        if (edited.isEmpty && newCollateral.nonZero) {
          return addMinimumDebt(newState);
        }
        if (addedMinimumDebt && newCollateral.isZero) {
          return removeMinimumDebt(newState);
        }
      }

      return newState;
    }

    case "setDebt":
      return {
        ...state,
        edited: edited.setDebt(action.newValue),
        debtDirty: true
      };

    case "addMinimumDebt":
      return {
        ...state,
        edited: edited.setDebt(RUSD_MINIMUM_DEBT),
        addedMinimumDebt: true
      };

    case "removeMinimumDebt":
      return {
        ...state,
        edited: edited.setDebt(0),
        addedMinimumDebt: false
      };

    case "revert":
      return {
        ...state,
        edited: new Trove(original.collateral, original.debt),
        debtDirty: false,
        addedMinimumDebt: false
      };

    case "updateStore": {
      const {
        newState: { trove },
        stateChange: { troveBeforeRedistribution: changeCommitted }
      } = action;

      const newState = {
        ...state,
        original: trove
      };

      if (changePending && changeCommitted) {
        return finishChange(revert(newState));
      }

      const change = original.whatChanged(edited, 0);

      if (
        (change?.type === "creation" && !trove.isEmpty) ||
        (change?.type === "closure" && trove.isEmpty)
      ) {
        return revert(newState);
      }

      return { ...newState, edited: trove.apply(change, 0) };
    }
  }
};

const feeFrom = (original, edited, borrowingRate) => {
  const change = original.whatChanged(edited, borrowingRate);

  if (change && change.type !== "invalidCreation" && change.params.borrowRUSD) {
    return change.params.borrowRUSD.mul(borrowingRate);
  } else {
    return Decimal.ZERO;
  }
};

const select2 = (state) => ({
  fees: state.fees,
  validationContext: selectForTroveChangeValidation(state)
});

const transactionIdPrefix = "trove-";
const transactionIdMatcher = new RegExp(`^${transactionIdPrefix}`);





export const ReadOnlyTrove = () => {
  const { fees } = useRolliqSelector(selector);
  const borrowingRate = fees.borrowingRate();
  const { dispatchEvent } = useTroveView();  
  const { account } = useRolliq();
  const feePct = new Percent(borrowingRate);
  const [borrowAmount, setBorrowAmount] = useState(Decimal.ZERO);
  const fee = borrowAmount.mul(borrowingRate);

  const handleAdjustTrove = useCallback(() => {
    dispatchEvent("ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);
  const handleCloseTrove = useCallback(() => {
    dispatchEvent("CLOSE_TROVE_PRESSED");
  }, [dispatchEvent]);

  const { trove, price } = useRolliqSelector(select);

  const [priceUnit, setPriceUnit] = useState(0);
  const [recoveryMode, setRecoveryMode] = useState("");
  const [debtInfront, setDebtInfront] = useState(0);
  useEffect(() => {
    InitFetch();
  }, []);
  const InitFetch = async () => {
    const priceFetch = await PriceFeedContract.getLastGoodPrice();
    // console.log(BigNumber(priceFetch).dividedBy(BASE18).toNumber());
    setPriceUnit(BigNumber(priceFetch).dividedBy(BASE18).toNumber());
    const recoveryCallRes = await TroveManager.checkRecoveryMode(BigNumber(priceFetch).toFixed());
    if(recoveryCallRes) setRecoveryMode("Yes") 
    else setRecoveryMode("No")
    const debtinfront = await TroveManager.getTroveDebt(account);
    setDebtInfront(BigNumber(priceFetch).dividedBy(BASE18).toFixed());
  }



  const collateral = Decimal.ZERO;
  const debt = Decimal.ZERO;
  const [{ original, edited, changePending }, dispatch] = useRolliqReducer(reduce, init);
  const { fees: fees2, validationContext } = useRolliqSelector(select2);

  useEffect(() => {
    if (collateral !== undefined) {
      dispatch({ type: "setCollateral", newValue: collateral });
    }
    if (debt !== undefined) {
      dispatch({ type: "setDebt", newValue: debt });
    }
  }, [collateral, debt, dispatch]);

  const borrowingRate2 = fees2.borrowingRate();
  const maxBorrowingRate = borrowingRate2.add(0.005); // TODO slippage tolerance

  const [validChange, description] = validateTroveChange(
    original,
    edited,
    borrowingRate2,
    validationContext
  );

  const { dispatchEvent: dispatchEvent2 } = useTroveView();

  const handleCancel = useCallback(() => {
    dispatchEvent2("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent2]);

  const openingNewTrove = original.isEmpty;

  const myTransactionState = useMyTransactionState(transactionIdMatcher);

  useEffect(() => {
    if (
      myTransactionState.type === "waitingForApproval" ||
      myTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (myTransactionState.type === "failed" || myTransactionState.type === "cancelled") {
      dispatch({ type: "finishChange" });
    } else if (myTransactionState.type === "confirmedOneShot") {
      if (myTransactionState.id === `${transactionIdPrefix}closure`) {
        dispatchEvent2("TROVE_CLOSED");
      } else {
        dispatchEvent2("TROVE_ADJUSTED");
      }
    }
  }, [myTransactionState, dispatch, dispatchEvent2]);

  const [showClose, setShowClose] = useState(false);


  const { isMobile } = useDevice();

  return (
    <Fade in={true}>
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
          <div className="flex">
            <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Your trove</Text>
          </div>
          <Divider className="mb-5 mt-6" color="#E5E7EB" border="1px solid"/>

          <Box className="flex gap-4 justify-between flex-wrap max-[550px]:block">
            {/* <Box style={{minWidth: "100px"}}>
              <Text className="text-[#1E2185] text-sm fontCustom-bold">Collateral</Text>
              <Text><span className="text-[#111827] text-[24px] fontCustom-bold">{trove.collateral.prettify(2)}</span>&nbsp;<span className="text-[#6B7280] fontCustom-Medium text-[18px]">ETH</span></Text>
              <Text><span className="text-[#111827] fontCustom-Medium text-[12px]">~${(trove.collateral.mul(priceUnit)).prettify(2)}</span>&nbsp;<span className="text-[#6B7280]"></span></Text>
            </Box>
            <Box style={{borderLeft: "1px solid #E5E5E5", paddingLeft: "10px"}}>
              <Text className="text-[#1E2185] text-sm fontCustom-bold">Net Debt</Text>
              <Text><span className="text-[#111827] text-[24px] fontCustom-bold">{trove.debt.prettify()}</span>&nbsp;<span className="text-[#6B7280] fontCustom-Medium text-[18px]">RUSD</span></Text>
              <Text><span className="text-[#111827] fontCustom-Medium text-[12px]">~${trove.debt.prettify()}</span>&nbsp;<span className="text-[#6B7280]"></span></Text>
            </Box>
            <Box style={{borderLeft: "1px solid #E5E5E5", paddingLeft: "10px"}}  className="min-[1100px]:min-w-[150px]">
              <div className="flex gap-2 items-center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold">Ratio</Text>
                <Box bg={
                  trove.collateralRatio(price).gt(CRITICAL_COLLATERAL_RATIO)
                    ? "success"
                    : value?.gt(1.2)
                    ? "warning"
                    : value?.lte(1.2)
                    ? "danger"
                    : "black"
                } style={{width: "8px", height: "8px", borderRadius: "50%"}}></Box>
              </div>
              <div className="flex gap-2 items-end">
                <CollateralRatioM2 value={trove.collateralRatio(price)} />
                <Text className="text-[#6B7280] fontCustom-Medium text-[18px]"> rUSD</Text>
              </div>
            </Box> */}
            <Box style={{minWidth: "100px"}} className="max-[550px]:pb-5">
              <Text className="text-[#1E2185] text-sm fontCustom-bold max-[700px]:flex-grow">Collateral</Text>
              <div className="max-[550px]:flex max-[550px]:items-center max-[550px]:gap-4">
                <Text><span className="text-[#111827] text-[24px] fontCustom-bold">{trove.collateral.prettify(2)}</span>&nbsp;<span className="text-[#6B7280] fontCustom-Medium text-[18px]">ETH</span></Text>
                <Text><span className="text-[#111827] fontCustom-Medium text-[12px]">~${(trove.collateral.mul(priceUnit)).prettify(2)}</span>&nbsp;<span className="text-[#6B7280]"></span></Text>
              </div>
            </Box>
            <Box className="border-l border-solid border-[#E5E5E5] max-[550px]:border-0 pl-2.5 max-[550px]:pl-0 max-[550px]:pb-5">
              <Text className="text-[#1E2185] text-sm fontCustom-bold">Net Debt</Text>
              <div className="max-[550px]:flex max-[550px]:items-center max-[550px]:gap-4">
                <Text><span className="text-[#111827] text-[24px] fontCustom-bold">{trove.debt.prettify()}</span>&nbsp;<span className="text-[#6B7280] fontCustom-Medium text-[18px]">RUSD</span></Text>
                <Text><span className="text-[#111827] fontCustom-Medium text-[12px]">~${trove.debt.prettify()}</span>&nbsp;<span className="text-[#6B7280]"></span></Text>
              </div>
            </Box>
            <Box className="min-[1100px]:min-w-[150px] border-l border-solid border-[#E5E5E5] max-[550px]:border-0 pl-2.5 max-[550px]:pl-0">
              <div className="flex gap-2 items-center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold">Ratio</Text>
                <Box bg={
                  trove.collateralRatio(price).gt(CRITICAL_COLLATERAL_RATIO)
                    ? "success"
                    : trove.collateralRatio(price)?.gt(1.2)
                    ? "warning"
                    : trove.collateralRatio(price)?.lte(1.2)
                    ? "danger"
                    : "black"
                } style={{width: "8px", height: "8px", borderRadius: "50%"}}></Box>
              </div>
              <div className="flex gap-2 items-end">
                <CollateralRatioM2 value={trove.collateralRatio(price)} />
                <Text className="text-[#6B7280] fontCustom-Medium text-[18px]"> rUSD</Text>
              </div>
            </Box>
          </Box>

          <Divider className="my-4 mb-6" color="#E5E7EB" border="1px solid"/>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold">
              rUSD price
            </Text>
            <Text className="text-[18px] text-[#6B7280] fontCustom-Medium">$1.00</Text>
          </FlexC>
          <Box py={1}></Box>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold">
              Debt in front
            </Text>
            <Text className="text-[18px] text-[#6B7280] fontCustom-Medium">${debtInfront}</Text>
          </FlexC>
          
          <Box py={1}></Box>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold">
              Recovery mode
            </Text>
            <Text className="text-[18px] text-[#6B7280] fontCustom-Medium">{recoveryMode}</Text>
          </FlexC>

          <Box py={1}></Box>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
              Borrowing fee
              <InfoIcon
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    This amount is deducted from the borrowed amount as a one-time fee. There are no
                    recurring fees for borrowing, which is thus interest-free.
                  </Card>
                }
                placement={isMobile ? "top": undefined}
              />
            </Text>
            <Text className="text-[18px] text-[#6B7280] fontCustom-Medium">{feePct.toString(2)}</Text>
          </FlexC>

          <Divider className="my-6" color="#E5E7EB" border="1px solid"/>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#6B7280] text-sm fontCustom-bold">
              ETH price
            </Text>
            <Text className="text-[18px] text-[#6B7280] fontCustom-Medium">${priceUnit}</Text>
          </FlexC>
          <Box py={1}></Box>

          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1">
              Liquidation price <span className="max-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 ">(Normal mode)</span><span className="min-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 whitespace-nowrap">(Norm)</span>
              <InfoIcon
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'110%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
                  </Card>
                }
                placement={isMobile ? "top": undefined}
              />
            </Text>
            <LiquidationPriceM1 value={calcLiquidationPrice(trove)} />
          </FlexC>
          <Box py={1}></Box>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 ">
              Liquidation price <span className="max-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 ">(Recovery mode)</span><span className="min-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 whitespace-nowrap">(Reco)</span>
              <InfoIcon
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'150%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
                  </Card>
                }
                placement={isMobile ? "top": undefined}
              />
            </Text>
            <LiquidationPriceM1 value={calcLiquidationPriceInRecoveryMode(trove)} recovery={true} />
          </FlexC>
          
          <div style={{padding: "10px"}}></div>
          
          {
            showClose == true &&
            <>
              {description ??
                (openingNewTrove ? (
                  <>
                    <ActionDescriptionM1>
                      Start by entering the amount of ETH you'd like to deposit as collateral.
                    </ActionDescriptionM1>
                  </>
                ) : (
                  <>
                    <ActionDescriptionM1>
                      Adjust your Trove by modifying its collateral, debt, or both.
                    </ActionDescriptionM1>
                  </>
                ))}
                <div className="py-2"></div>
            </>
          }
          <ButtonC className="bg-[#1E2185] text-[18px] text-[white] w-full fontCustom-bold animationCustom" style={{borderRadius: "20px", padding: "8px"}} onClick={handleAdjustTrove}>Make changes</ButtonC>
          <div style={{padding: "5px"}}></div>
          {/* <ButtonC style={{borderColor: "#1E2185", border: "1px solid", borderRadius: "20px", padding: "6px"}} className="w-full p-1 fontCustom-bold" onClick={handleCloseTrove}>Close Trove</ButtonC> */}
          <ButtonCloseTrove {...{showClose, description, openingNewTrove, validChange, transactionIdPrefix, setShowClose, maxBorrowingRate}}/>
        </Box>
      </Box>
    </Box>
    </Fade>
  );
};
