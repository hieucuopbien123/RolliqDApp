import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";
import USD from "../TROVE/assets/USD.png";

import { Difference } from "../../lib/@rolliq/lib-base";

import { useRolliqSelector } from "../../lib/@rolliq/lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../../components/WalletConnector/Icon";
import { EditableRow, StaticRow } from "../TROVE/Editor";
import { LoadingOverlay } from "../TROVE/LoadingOverlay";
import { InfoIcon } from "../TROVE/InfoIcon";
import { Text, Flex as FlexC, Divider } from "@chakra-ui/react";
import { EditableRowM1 } from "../TROVE/EditorM1";
import { StaticRowM2 } from "../TROVE/EditorM2";
import { EditableRowM5 } from "../TROVE/EditorM55";
import { AiOutlineClose } from "react-icons/ai";
import BigNumber from "bignumber.js";
import RouterContract from "../SWAP/contract/utils/Router";
import zksync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import PriceFeedContract from "../TROVE/contracts/utils/PriceFeed";
import { useEffect } from "react";

const select = ({ rusdBalance, rusdInStabilityPool }) => ({
  rusdBalance,
  rusdInStabilityPool,
});

export const StabilityDepositEditorM2 = ({
  originalDeposit,
  editedRUSD,
  changePending,
  dispatch,
  makingNewDeposit,
  children,
  setCurrentPage
}) => {
  const { rusdBalance, rusdInStabilityPool } = useRolliqSelector(select);
  const editingState = useState();

  const edited = !editedRUSD.eq(originalDeposit.currentRUSD);

  const maxAmount = originalDeposit.currentRUSD.add(rusdBalance);
  const maxedOut = editedRUSD.eq(maxAmount);

  const rusdInStabilityPoolAfterChange = rusdInStabilityPool
    .sub(originalDeposit.currentRUSD)
    .add(editedRUSD);

  const originalPoolShare = originalDeposit.currentRUSD.mulDiv(
    100,
    rusdInStabilityPool
  );
  const newPoolShare = editedRUSD.mulDiv(100, rusdInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentRUSD.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

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

  return (
    <>
      <div className="flex" style={{justifyContent: "space-between"}}>
        <div className="flex gap-1">
          <Text className="text-2xl font-bold text-[#1E2185]">
            {makingNewDeposit ? "Supply rUSD" : "Supply rUSD"}
          </Text>
          {edited && !changePending && (
            <Button
              variant="titleIcon"
              sx={{ ":enabled:hover": { color: "danger" } }}
              onClick={() => dispatch({ type: "revert" })}  className="fontCustom-bold"
            >
              <Icon name="history" size="lg" />
            </Button>
          )}
        </div>
        <Box>
          <AiOutlineClose onClick={() => setCurrentPage(1)} size={"20px"}/>
        </Box>
      </div>

      <Divider className="my-4" color="#E5E7EB" border="1px solid" />

      <FlexC justifyContent="space-between" alignItems="flex-end">
        <Text className="text-[#1E2185] font-bold">Supplying</Text>
        <div className="flex gap-3 max-[500px]:gap-1">
          <Text className="text-sm text-[#6B7280]">
            Balance: {rusdBalance.prettify(2)} rUSD
          </Text>
          <Button
            style={{
              padding: 0,
              border: 0,
              fontWeight: "normal",
              fontSize: "small",
              backgroundColor: "transparent",
              color: "#1E2185",
            }} className="fontCustom-bold"
            onClick={() => {
              dispatch({
                type: "setDeposit",
                newValue: maxAmount.toString(),
              });
            }}
          >
            MAX
          </Button>
        </div>
      </FlexC>
      <Box sx={{ pt: [2] }}>
        <EditableRowM5
          label="Deposit"
          inputId="deposit-riq"
          amountF={editedRUSD} //
          maxAmount={maxAmount.toString()} 
          maxedOut={maxedOut}
          unit={COIN}
          img={USD}
          coin={"rUSD"}
          {...{ editingState }}
          editedAmountF={editedRUSD} // 
          setEditedAmount={(newValue) =>
            dispatch({ type: "setDeposit", newValue })
          }
          suppliedAmount={originalDeposit.currentRUSD}
          riqPrice={riqPrice}
        />
      </Box>
      <Divider className="mt-6 mb-6" color="#E5E7EB" border="1px solid" />

      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
          Supplied
          {/* <InfoIcon
            tooltip={
              <Card
                sx={{ minWidth: "200px" }}
                style={{
                  borderRadius: "10px",
                  color: "white",
                  padding: "10px",
                }}
                variant="tooltip"
              >
                ...
              </Card>
            }
          /> */}
        </Text>
        <StaticRowM2
          label="Pool share"
          inputId="deposit-share"
          amount={originalDeposit.currentRUSD.prettify(2)}
          unit={"rUSD"}
        />
      </FlexC>
      <Box py={1}></Box>
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
          Total in pool
          {/* <InfoIcon
            tooltip={
              <Card
                sx={{ minWidth: "200px" }}
                style={{
                  borderRadius: "10px",
                  color: "white",
                  padding: "10px",
                }}
                variant="tooltip"
              >
                ...
              </Card>
            }
          /> */}
        </Text>
        <StaticRowM2
          label="Pool share"
          inputId="deposit-share"
          amount={rusdInStabilityPool.prettify(2)}
          unit="rUSD"
        />
      </FlexC>
      <Box py={1}></Box>
      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
          Your pool share
          {/* <InfoIcon
            tooltip={
              <Card
                sx={{ minWidth: "200px" }}
                style={{
                  borderRadius: "10px",
                  color: "white",
                  padding: "10px",
                }}
                variant="tooltip"
              >
                ...
              </Card>
            }
          /> */}
        </Text>
        <StaticRowM2
          label="Pool share"
          inputId="deposit-share"
          amount={originalPoolShare.prettify(2)}
          unit="%"
        />
      </FlexC>

      <Box className="py-3"></Box>
      {children}
    </>
  );
};
