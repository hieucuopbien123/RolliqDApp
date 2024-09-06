import React, { useEffect, useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";
import USD from "../TROVE/assets/USD.png";
import { Difference } from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { COIN, GT } from "../../strings";
import { Icon } from "../../components/WalletConnector/Icon";
import { InfoIcon } from "../TROVE/InfoIcon";
import { Text, Flex as FlexC, Divider } from "@chakra-ui/react";
import { StaticRowM2 } from "../TROVE/EditorM2";
import { EditableRowM5 } from "../TROVE/EditorM54";
import RouterContract from "../SWAP/contract/utils/Router";
import zksync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import PriceFeedContract from "../TROVE/contracts/utils/PriceFeed";
import BigNumber from "bignumber.js";

const select = ({ rusdBalance, rusdInStabilityPool }) => ({
  rusdBalance,
  rusdInStabilityPool,
});

export const StabilityDepositEditorCreate = ({
  originalDeposit,
  editedRUSD,
  changePending,
  dispatch,
  makingNewDeposit,
  children,
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
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
          <div className="flex">
            <Text className="text-[24px] fontCustom-bold text-[#1E2185]">
              Supply rUSD
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

          <Divider className="my-4" color="#E5E7EB" border="1px solid" />

          <FlexC justifyContent="space-between" alignItems="flex-end">
            <Text className="text-[#1E2185] text-[14px] fontCustom-bold">Supplying</Text>
            <div className="flex gap-3 max-[500px]:gap-1">
              <Text className="text-sm fontCustom-Medium text-[#6B7280]">
                Balance: {rusdBalance.prettify(2)} rUSD
              </Text>
              <Button
                style={{
                  padding: 0,
                  border: 0,
                  fontWeight: "normal",
                  backgroundColor: "transparent",
                  color: "#1E2185",
                }} className="fontCustom-bold text-[14px]"
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
              riqPrice={riqPrice}
              amountDeposited={originalDeposit.currentRUSD}
            />
          </Box>

          <Divider className="mt-6 mb-4" color="#E5E7EB" border="1px solid" />
          
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-[16px] fontCustom-bold flex items-center gap-1">
              Total in pool
              <InfoIcon
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
              />
            </Text>
            <StaticRowM2
              label="Pool share"
              inputId="deposit-share"
              amount={rusdInStabilityPool.prettify(2)}
              unit={"rUSD"}
            />
          </FlexC>
          <Box py={0.8}></Box>
          <FlexC justifyContent="space-between" alignItems="center">
            <Text className="text-[#1E2185] text-[16px] fontCustom-bold  flex items-center gap-1">
              Your pool share
              <InfoIcon
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
              />
            </Text>
            <StaticRowM2
              label="Pool share"
              inputId="deposit-share"
              amount={originalPoolShare.prettify(2)}
              unit={"%"}
            />
          </FlexC>
          <Box className="pt-3"></Box>
          {children}
          {/* {changePending && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box>
  );
};
