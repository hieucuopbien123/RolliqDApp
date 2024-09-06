import React, { useCallback, useEffect, useState } from "react";
import { Flex, Button, Box, Card, Heading, Spinner } from "theme-ui";
import { Fade, Flex as FlexC} from "@chakra-ui/react"
import {
  Decimal,
  Trove,
  RUSD_LIQUIDATION_RESERVE,
  RUSD_MINIMUM_NET_DEBT,
  Percent
} from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { useStableTroveChange } from "../../hooks/useStableTroveChange";
import { ActionDescription } from "./ActionDescription";
import { useMyTransactionState } from "../../components/Trasaction";
import { TroveAction } from "./TroveAction";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { COIN } from "../../strings";
import { Icon } from "../../components/WalletConnector/Icon";
import { InfoIcon } from "./InfoIcon";
import { LoadingOverlay } from "./LoadingOverlay";
import { CollateralRatio } from "./CollateralRatio";
import { CollateralRatioM1 } from "./CollateralRatioM1";
import { LiquidationPriceM1 } from "./LiquidationPriceM1";
import { LiquidationPrice } from "./LiquidationPrice";
import { EditableRow, StaticRow } from "./Editor";
import { EditableRowM1, StaticRowM1 } from "./EditorM1";
import { ExpensiveTroveChangeWarning } from "./ExpensiveTroveChangeWarning";
import {
  selectForTroveChangeValidation,
  validateTroveChange
} from "./validation/validateTroveChange";

import { calcLiquidationPrice, calcLiquidationPriceInRecoveryMode } from "../../utils/troveUtils";
import { Divider, Text } from "@chakra-ui/react";
import ETH from "./assets/ETH.png";
import USD from "./assets/USD.png";
import { StaticRowM2 } from "./EditorM2";
import { ActionDescriptionM1 } from "../STAKING/ActionDescriptionM1";
import BigNumber from "bignumber.js";
import PriceFeedContract from "./contracts/utils/PriceFeed";
import useDevice from "../../utils/useMobile";

const selector = (state) => {
  const { fees, price, accountBalance } = state;
  return {
    fees,
    price,
    accountBalance,
    validationContext: selectForTroveChangeValidation(state)
  };
};
const select = ({ rusdBalance }) => ({
  rusdBalance
});


const EMPTY_TROVE = new Trove(Decimal.ZERO, Decimal.ZERO);
const TRANSACTION_ID = "trove-creation";
const GAS_ROOM_ETH = Decimal.from(0.1);
const BASE18 = BigNumber("1000000000000000000");

export const Opening = () => {
  const { dispatchEvent } = useTroveView();
  const {rusdBalance: realLusdBalance } = useRolliqSelector(select);
  const { fees, price, accountBalance, validationContext } = useRolliqSelector(selector);
  const borrowingRate = fees.borrowingRate();
  const editingState = useState();

  const [collateral, setCollateral] = useState(Decimal.ZERO);
  const [borrowAmount, setBorrowAmount] = useState(Decimal.ZERO);

  const maxBorrowingRate = borrowingRate.add(0.005);

  const fee = borrowAmount.mul(borrowingRate);
  const feePct = new Percent(borrowingRate);
  const totalDebt = borrowAmount.add(RUSD_LIQUIDATION_RESERVE).add(fee);
  const isDirty = !collateral.isZero || !borrowAmount.isZero;
  const trove = isDirty ? new Trove(collateral, totalDebt) : EMPTY_TROVE;
  const maxCollateral = accountBalance.gt(GAS_ROOM_ETH)
  ? accountBalance.sub(GAS_ROOM_ETH)
  : Decimal.ZERO;
  const collateralMaxedOut = collateral.eq(maxCollateral);
  const collateralRatio =
    !collateral.isZero && !borrowAmount.isZero ? trove.collateralRatio(price) : undefined;
  const liquidationPrice =
    !collateral.isZero && !borrowAmount.isZero ? calcLiquidationPrice(trove) : undefined;
  const liquidationPriceRecovery =
    !collateral.isZero && !borrowAmount.isZero ? calcLiquidationPriceInRecoveryMode(trove) : undefined;

  const [troveChange, description] = validateTroveChange(
    EMPTY_TROVE,
    trove,
    borrowingRate,
    validationContext
  );

  const stableTroveChange = useStableTroveChange(troveChange);
  const [gasEstimationState, setGasEstimationState] = useState({ type: "idle" });

  const transactionState = useMyTransactionState(TRANSACTION_ID);
  const isTransactionPending =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  const handleCancelPressed = useCallback(() => {
    dispatchEvent("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);

  const reset = useCallback(() => {
    setCollateral(Decimal.ZERO);
    setBorrowAmount(Decimal.ZERO);
  }, []);

  useEffect(() => {
    if (!collateral.isZero && borrowAmount.isZero) {
      setBorrowAmount(RUSD_MINIMUM_NET_DEBT);
    }
  }, [collateral, borrowAmount]);

  const [priceUnit, setPriceUnit] = useState();
  useEffect(() => {
    InitFetch();
  }, []);
  const InitFetch = async () => {
    const priceFetch = await PriceFeedContract.getLastGoodPrice();
    // console.log(BigNumber(priceFetch).dividedBy(BASE18).toNumber());
    setPriceUnit(BigNumber(priceFetch).dividedBy(BASE18).toNumber());
  }
  const { isMobile } = useDevice();

  return (
    <Fade in={true}>
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
            <div className="flex">
              <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Borrow</Text>
              {isDirty && !isTransactionPending && (
                <Button variant="titleIcon" sx={{ ":enabled:hover": { color: "danger" } }} onClick={reset} className="fontCustom-bold">
                  <Icon name="history" size="lg" />
                </Button>
              )}
            </div>
            <Divider className="my-4" color="#E5E7EB" border="1px solid"/>
            <FlexC justifyContent="space-between" alignItems="flex-end">
              <Text className="text-[#1E2185] text-[16px] fontCustom-bold">Collateral</Text>
              <Text className="text-[12px] fontCustom-Medium text-[#6B7280]">Balance: {accountBalance.prettify()} ETH</Text>
            </FlexC>
            <Box sx={{ pt: [2] }}>
              <EditableRowM1
                inputId="trove-collateral"
                amount={collateral.prettify(4)}
                maxAmount={maxCollateral.toString()}
                maxedOut={collateralMaxedOut}
                editingState={editingState}
                img={ETH}
                priceUnit={priceUnit}
                coin="ETH"
                editedAmount={collateral.toString(4)}
                setEditedAmount={(amount) => setCollateral(Decimal.from(amount))}
              />
              <div className="py-1"></div>
              <FlexC justifyContent="space-between" alignItems="flex-end">
                <Text className="text-[#1E2185] text-[16px] fontCustom-bold">Borrowing</Text>
                <Text className="text-[12px] fontCustom-Medium text-[#6B7280]">Balance: {realLusdBalance.prettify()} rUSD</Text>
              </FlexC>
              
              <Box sx={{ pt: [2] }}>
                <EditableRowM1
                  inputId="trove-borrow-amount"
                  amount={borrowAmount.prettify()}
                  img={USD}
                  coin="RUSD"
                  priceUnit={priceUnit}
                  editingState={editingState}
                  editedAmount={borrowAmount.toString(2)}
                  setEditedAmount={(amount) => setBorrowAmount(Decimal.from(amount))}
                />
              </Box>
              <Divider className="my-5" color="#E5E7EB" border="1px solid"/>
              <FlexC justifyContent="space-between" alignItems="center">
                <Box className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Collateral ratio
                  <InfoIcon
                    tooltip={
                      <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                        The ratio between the dollar value of the collateral and the debt (in RUSD) you are
                        depositing. While the Minimum Collateral Ratio is 110% during normal operation, it
                        is recommended to keep the Collateral Ratio always above 150% to avoid liquidation
                        under Recovery Mode. A Collateral Ratio above 200% or 250% is recommended for
                        additional safety.
                      </Card>
                    }
                    placement={isMobile ? "top": undefined}
                  />
                </Box>
                <CollateralRatioM1 value={collateralRatio} />
              </FlexC>
              <Box py={0.7}></Box>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Liquidation reserve
                  <InfoIcon
                    tooltip={
                      <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                        An amount set aside to cover the liquidator’s gas costs if your Trove needs to be
                        liquidated. The amount increases your debt and is refunded if you close your Trove
                        by fully paying off its net debt.
                      </Card>
                    }
                    placement={isMobile ? "top": undefined}
                  />
                </Text>
                <StaticRowM2
                  inputId="trove-liquidation-reserve"
                  amount={`${RUSD_LIQUIDATION_RESERVE}`}
                  unit={COIN}
                  color={"#6B7280"}
                />
              </FlexC>
              <Box py={0.7}></Box>
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
                <StaticRowM2
                  label="Borrowing Fee"
                  inputId="trove-borrowing-fee"
                  amount={fee.prettify(2)}
                  pendingAmount={feePct.toString(2)}
                  unit={COIN}
                  color={"#6B7280"}
                />
              </FlexC>
              <Box py={0.5}></Box>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
                  Total debt
                  <InfoIcon
                    tooltip={
                      <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                        The total amount of RUSD your Trove will hold.{" "}
                        {isDirty && (
                          <>
                            You will need to repay {totalDebt.sub(RUSD_LIQUIDATION_RESERVE).prettify(2)}{" "}
                            RUSD to reclaim your collateral ({RUSD_LIQUIDATION_RESERVE.toString()} RUSD
                            Liquidation Reserve excluded).
                          </>
                        )}
                      </Card>
                    }
                    placement={isMobile ? "top": undefined}
                  />
                </Text>
                <StaticRowM2
                  label="Total debt"
                  inputId="trove-total-debt"
                  amount={totalDebt.prettify(2)}
                  unit={COIN}
                  color={"#6B7280"}
                />
              </FlexC>
              <Divider className="my-4" color="#E5E7EB" border="1px solid"/>

              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#6B7280] text-sm fontCustom-bold">
                  ETH price
                </Text>
                <Text className="fontCustom-Medium text-[18px] text-[#6B7280]">{priceUnit}</Text>
              </FlexC>
              <Box py={1}></Box>
              <FlexC justifyContent="space-between" alignItems="center">
                <Text className="text-[#6B7280] text-sm fontCustom-bold  flex items-center gap-1">
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
                <LiquidationPriceM1 value={liquidationPrice} />
              </FlexC>
              <Box py={1}></Box>
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
                <LiquidationPriceM1 value={liquidationPriceRecovery} recovery={true} />
              </FlexC>

              <Box py={2}></Box>
              {description ?? (
                <div>
                  <ActionDescriptionM1>
                    Start by entering the amount of ETH you'd like to deposit as collateral.
                  </ActionDescriptionM1>
                </div>
              )}
              <div className="pb-2"></div>

              <ExpensiveTroveChangeWarning
                troveChange={stableTroveChange}
                maxBorrowingRate={maxBorrowingRate}
                borrowingFeeDecayToleranceMinutes={60}
                gasEstimationState={gasEstimationState}
                setGasEstimationState={setGasEstimationState}
              />

              <Flex variant="layout.actions">
                {/* <Button variant="cancel" onClick={handleCancelPressed}>
                  Cancel
                </Button> */}
                {gasEstimationState.type === "inProgress" ? (
                  <Button className="w-full fontCustom-bold" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px", color: "white", opacity: 0.6, cursor: "not-allowed"}} disabled>
                    <Spinner size="24px" sx={{ color: "background" }} />
                  </Button>
                ) : stableTroveChange ? (
                  <TroveAction
                    transactionId={TRANSACTION_ID}
                    change={stableTroveChange}
                    maxBorrowingRate={maxBorrowingRate}
                    borrowingFeeDecayToleranceMinutes={60}
                    topmessage={`Confirm create trove`}
                  >
                    Create
                  </TroveAction>
                ) : (
                  <Button className="w-full fontCustom-bold text-[18px]" style={{backgroundColor: "#1E2185", borderRadius: "25px", padding: "8px", color: "white", opacity: 0.6, cursor: "not-allowed"}} disabled>Create</Button>
                )}
              </Flex>
            </Box>
            {/* {isTransactionPending && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box>
    </Fade>
  );
};
