import React, { useCallback, useEffect, useState, useRef } from "react";
import { Flex, Button, Box, Card, Heading } from "theme-ui";
import {
  Decimal,
  Trove,
  RUSD_LIQUIDATION_RESERVE,
  Percent,
  Difference,
  CRITICAL_COLLATERAL_RATIO
} from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { useStableTroveChange } from "../../hooks/useStableTroveChange";
import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";
import { useMyTransactionState } from "../../components/Trasaction";
import { TroveActionM1 } from "./TroveActionM1";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { COIN } from "../../strings";
import { Icon } from "../../components/WalletConnector/Icon";
import { InfoIcon } from "./InfoIcon";
import { LoadingOverlay } from "./LoadingOverlay";
import { CollateralRatio } from "./CollateralRatio";
import { LiquidationPrice } from "./LiquidationPrice";
import { EditableRow, StaticRow } from "./Editor";
import { ExpensiveTroveChangeWarning } from "./ExpensiveTroveChangeWarning";
import {
  selectForTroveChangeValidation,
  validateTroveChange
} from "./validation/validateTroveChange";

import { calcLiquidationPrice, calcLiquidationPriceInRecoveryMode } from "../../utils/troveUtils";
import { Divider, Text, Flex as FlexC } from "@chakra-ui/react";
import { AiOutlineClose } from "react-icons/ai";
import { EditableRowM4 } from "./EditorM43";
import { StaticRowM2 } from "./EditorM2";
import { CollateralRatioM1 } from "./CollateralRatioM1";
import { LiquidationPriceM1 } from "./LiquidationPriceM1";
import useDevice from "../../utils/useMobile";

const selector = (state) => {
  const { trove, fees, price, accountBalance } = state;
  return {
    trove,
    fees,
    price,
    accountBalance,
    validationContext: selectForTroveChangeValidation(state)
  };
};

const TRANSACTION_ID = "trove-adjustment";
const GAS_ROOM_ETH = Decimal.from(0.1);

const feeFrom = (original, edited, borrowingRate) => {
  const change = original.whatChanged(edited, borrowingRate);

  if (change && change.type !== "invalidCreation" && change.params.borrowRUSD) {
    return change.params.borrowRUSD.mul(borrowingRate);
  } else {
    return Decimal.ZERO;
  }
};

const applyUnsavedCollateralChanges = (unsavedChanges, trove) => {
  // console.log(unsavedChanges.negative);
  if (unsavedChanges.absoluteValue) {
    if (unsavedChanges.positive) {
      return trove.collateral.add(unsavedChanges.absoluteValue);
    }
    if (unsavedChanges.negative) {
      if (unsavedChanges.absoluteValue.lt(trove.collateral)) {
        return trove.collateral.sub(unsavedChanges.absoluteValue);
      }
    }
    return trove.collateral;
  }
  return trove.collateral;
};

const applyUnsavedNetDebtChanges = (unsavedChanges, trove) => {
  if (unsavedChanges.absoluteValue) {
    if (unsavedChanges.positive) {
      return trove.netDebt.add(unsavedChanges.absoluteValue);
    }
    if (unsavedChanges.negative) {
      if (unsavedChanges.absoluteValue.lt(trove.netDebt)) {
        return trove.netDebt.sub(unsavedChanges.absoluteValue);
      }
    }
    return trove.netDebt;
  }
  return trove.netDebt;
};
const select = ({ rusdBalance }) => ({
  rusdBalance
});

export const TrovePayback = () => {
  const { dispatchEvent } = useTroveView();
  const { trove, fees, price, accountBalance, validationContext } = useRolliqSelector(selector);
  
  const {rusdBalance: realLusdBalance } = useRolliqSelector(select);
  const editingState = useState();
  const previousTrove = useRef(trove);

  const [collateral, setCollateral] = useState(trove.collateral);
  const [netDebt, setNetDebt] = useState(trove.netDebt);

  const transactionState = useMyTransactionState(TRANSACTION_ID);
  const borrowingRate = fees.borrowingRate();

  useEffect(() => {
    if (transactionState.type === "confirmedOneShot") {
      dispatchEvent("TROVE_ADJUSTED");
    }
  }, [transactionState.type, dispatchEvent]);

  useEffect(() => {
    if (!previousTrove.current.collateral.eq(trove.collateral)) {
      const unsavedChanges = Difference.between(collateral, previousTrove.current.collateral);
      const nextCollateral = applyUnsavedCollateralChanges(unsavedChanges, trove);
      setCollateral(nextCollateral);
    }
    if (!previousTrove.current.netDebt.eq(trove.netDebt)) {
      const unsavedChanges = Difference.between(netDebt, previousTrove.current.netDebt);
      const nextNetDebt = applyUnsavedNetDebtChanges(unsavedChanges, trove);
      setNetDebt(nextNetDebt);
    }
    previousTrove.current = trove;
  }, [trove, collateral, netDebt]);

  const handleCancelPressed = useCallback(() => {
    dispatchEvent("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);

  const reset = useCallback(() => {
    setCollateral(trove.collateral);
    setNetDebt(trove.netDebt);
  }, [trove.collateral, trove.netDebt]);

  const isDirty = !collateral.eq(trove.collateral) || !netDebt.eq(trove.netDebt);
  const isDebtIncrease = netDebt.gt(trove.netDebt);
  const debtIncreaseAmount = isDebtIncrease ? netDebt.sub(trove.netDebt) : Decimal.ZERO;

  const fee = isDebtIncrease
    ? feeFrom(trove, new Trove(trove.collateral, trove.debt.add(debtIncreaseAmount)), borrowingRate)
    : Decimal.ZERO;
  const totalDebt = netDebt.add(RUSD_LIQUIDATION_RESERVE).add(fee);
  const maxBorrowingRate = borrowingRate.add(0.005);
  const updatedTrove = isDirty ? new Trove(collateral, totalDebt) : trove;
  const feePct = new Percent(borrowingRate);
  const availableEth = accountBalance.gt(GAS_ROOM_ETH)
    ? accountBalance.sub(GAS_ROOM_ETH)
    : Decimal.ZERO;
  const maxCollateral = trove.collateral.add(availableEth);
  const collateralMaxedOut = collateral.eq(maxCollateral);
  const collateralRatio =
    !collateral.isZero && !netDebt.isZero ? updatedTrove.collateralRatio(price) : undefined;
  const collateralRatioChange = Difference.between(collateralRatio, trove.collateralRatio(price));
  const liquidationPrice =
    !collateral.isZero && !netDebt.isZero ? calcLiquidationPrice(updatedTrove) : undefined;
  const liquidationPriceChange = Difference.between(liquidationPrice, calcLiquidationPrice(trove));
  const liquidationPriceRecovery =
    !collateral.isZero && !netDebt.isZero ? calcLiquidationPriceInRecoveryMode(updatedTrove) : undefined;
  const liquidationPriceRecoveryChange = Difference.between(liquidationPriceRecovery, calcLiquidationPriceInRecoveryMode(trove));

  const [troveChange, description] = validateTroveChange(
    trove,
    updatedTrove,
    borrowingRate,
    validationContext
  );

  const stableTroveChange = useStableTroveChange(troveChange);
  const [gasEstimationState, setGasEstimationState] = useState({ type: "idle" });

  const isTransactionPending =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  if (trove.status !== "open") {
    return null;
  }
  const { isMobile } = useDevice();

  return (
    <>
      <Divider className="mb-[20px] mt-5" color="#E5E7EB" border="1px solid"/>

      <FlexC justifyContent="space-between" alignItems="flex-end">
        <Text className="text-[#1E2185] fontCustom-bold text-[16px]">Payback rUSD</Text>
        <Text className="text-[12px] fontCustom-bold text-[#6B7280]">Balance: {realLusdBalance.prettify()} rUSD</Text>
      </FlexC>

      <Box sx={{ pt: [2] }}>
        <EditableRowM4
          label="Net debt"
          inputId="trove-net-debt-amount"
          amountF={netDebt}//
          unit={COIN}
          editingState={editingState}
          editedAmountF={netDebt}//
          setEditedAmount={(amount) => setNetDebt(Decimal.from(amount))}
          debt={trove.netDebt}
        />
      </Box>
      
      <Divider className="mb-2 mt-4" color="#E5E7EB" border="1px solid"/>
      
      {/* <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-sm font-bold">
          Borrowing fee
          <InfoIcon
            tooltip={
              <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                This amount is deducted from the borrowed amount as a one-time fee. There are no
                recurring fees for borrowing, which is thus interest-free.
              </Card>
            }
          />
        </Text>
        <StaticRowM2
          label="Borrowing Fee"
          inputId="trove-borrowing-fee"
          amount={fee.prettify(2)}
          pendingAmount={feePct.toString(2)}
          unit={COIN}
        />
      </FlexC> */}
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-sm fontCustom-bold">
          Debt
        </Text>
        <Text>{trove.debt.toString(2)} RUSD</Text>
      </FlexC>
      <Box style={{paddingTop: "8px"}}></Box>
      
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
          Collateral ratio
          <InfoIcon
            tooltip={
              <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                The ratio between the dollar value of the collateral and the debt (in RUSD) you are
                depositing. While the Minimum Collateral Ratio is 110% during normal operation, it
                is recommended to keep the Collateral Ratio always above 150% to avoid liquidation
                under Recovery Mode. A Collateral Ratio above 200% or 250% is recommended for
                additional safety.
              </Card>
            }
            placement={isMobile ? "top": undefined}
          />
        </Text>
        <CollateralRatioM1 value={collateralRatio} />
      </FlexC>
      <Box style={{paddingTop: "8px"}}></Box>
      
      <FlexC justifyContent="space-between" alignItems="center">
      <Text className="text-[#1E2185] text-sm fontCustom-bold">
          Status
        </Text>
        <Box bg={
          collateralRatio?.gt(CRITICAL_COLLATERAL_RATIO)
            ? "success"
            : collateralRatio?.gt(1.2)
            ? "warning"
            : "danger"
        } color="white" className="px-[10px] py-[3px] rounded text-[14px]">
          {
            collateralRatio?.gt(CRITICAL_COLLATERAL_RATIO)
            ? "Safe"
            : collateralRatio?.gt(1.2)
            ? "Warning"
            : "Danger"
          }
        </Box>
      </FlexC>
      <Box style={{paddingTop: "8px"}}></Box>
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1">
          ETH price
          <InfoIcon
            tooltip={
              <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'110%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
              </Card>
            }
            placement={isMobile ? "top": undefined}
          />
        </Text>
        <LiquidationPriceM1 value={liquidationPrice} />
      </FlexC>

      <Box style={{paddingTop: "8px"}}></Box>
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1">
        Liquidation price <span className="max-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 ">(Normal mode)</span><span className="min-[500px]:hidden text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1 whitespace-nowrap">(Norm)</span>
          <InfoIcon
            tooltip={
              <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                <a style={{color: "gray"}} href="https://docs.rolliq.org/faq/recovery-mode" target="_blank">Learn more about Recovery Mode <Icon name="external-link-alt" /></a> <br />The dollar value per unit of collateral at which your Trove will drop below a <strong>{'110%'}</strong> Collateral Ratio and be liquidated. You should ensure you are comfortable with managing your position so that the price of your collateral never reaches this level..
              </Card>
            }
            placement={isMobile ? "top": undefined}
          />
        </Text>
        <LiquidationPriceM1 value={liquidationPrice} change={liquidationPriceChange}/>
      </FlexC>
      <Box style={{paddingTop: "8px"}}></Box>
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#6B7280] text-sm fontCustom-bold flex items-center gap-1">
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
        <LiquidationPriceM1 value={liquidationPriceRecovery} change={liquidationPriceRecoveryChange} recovery={true} />
      </FlexC>
      <Box style={{paddingTop: "8px"}}></Box>


      <Box sx={{ pt: [3, 4] }}>

        {description ?? (
          <ActionDescriptionM1>
            Adjust your Trove by modifying its collateral, debt, or both.
          </ActionDescriptionM1>
        )}

        <ExpensiveTroveChangeWarning
          troveChange={stableTroveChange}
          maxBorrowingRate={maxBorrowingRate}
          borrowingFeeDecayToleranceMinutes={60}
          gasEstimationState={gasEstimationState}
          setGasEstimationState={setGasEstimationState}
        />

        <div className="py-2"></div>
        {stableTroveChange ? (
          <TroveActionM1
            transactionId={TRANSACTION_ID}
            change={stableTroveChange}
            maxBorrowingRate={maxBorrowingRate}
            borrowingFeeDecayToleranceMinutes={60}
            topmessage={`Payback ${trove.netDebt.sub(netDebt).prettify(2)} rUSD`}
          >
            Borrow
          </TroveActionM1>
        ) : (
          <Button disabled className="w-full fontCustom-bold animationCustom" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "7px"}}>Borrow</Button>
        )}
        </Box>
    </>
  );
};
