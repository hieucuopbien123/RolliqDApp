import React, { useEffect, useState } from "react";
import { Box, Button, Card } from "theme-ui";

import { Difference } from "../../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../../lib/@rolliq/lib-react";

import { GT } from "../../../strings";

import { Icon } from "../../../components/WalletConnector/Icon";
import { InfoIcon } from "../../TROVE/InfoIcon";
import { LoadingOverlay } from "../../TROVE/LoadingOverlay";

import { useStakingView } from "../../../components/Staking/context/StakingViewContext";
import { Divider, Text, Flex as FlexC } from "@chakra-ui/react";
import RIQ from "../assets/RIQ.png";
import { StaticRowM2 } from "../../TROVE/EditorM2";
import { EditableRowM5 } from "../../TROVE/EditorM53";
import ERC20MockContract from "../../SWAP/contract/utils/ERC20MockContract";
import { useRolliq } from "../../../hooks/RolliqContext";
import zksync from "../../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import BigNumber from "bignumber.js";
import { AiOutlineClose } from "react-icons/ai";

const select = ({ riqBalance, totalStakedRIQ }) => ({
  riqBalance,
  totalStakedRIQ,
});

export const UnstakingEditor = ({
  children,
  title,
  originalStake,
  editedRIQ,
  dispatch,
  setCurrentPage,
  riqPrice
}) => {
  const { riqBalance, totalStakedRIQ } = useRolliqSelector(select);
  const { changePending } = useStakingView();
  const editingState = useState();

  const edited = !editedRIQ.eq(originalStake.stakedRIQ);

  const maxAmount = originalStake.stakedRIQ.add(riqBalance);
  const maxedOut = editedRIQ.eq(maxAmount);

  const totalStakedRIQAfterChange = totalStakedRIQ
    .sub(originalStake.stakedRIQ)
    .add(editedRIQ);

  const originalPoolShare = originalStake.stakedRIQ.mulDiv(100, totalStakedRIQ);
  const newPoolShare = editedRIQ.mulDiv(100, totalStakedRIQAfterChange);
  const poolShareChange =
    originalStake.stakedRIQ.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <>
      <div className="flex" style={{justifyContent: "space-between"}}>
        <div className="flex gap-1">
          <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Unstake</Text>
          {edited && !changePending && (
            <Button className="fontCustom-bold"
              variant="titleIcon"
              sx={{ ":enabled:hover": { color: "danger" } }}
              onClick={() => dispatch({ type: "revert" })}
            >
              <Icon name="history" size="lg" />
            </Button>
          )}
        </div>
        <Box>
          <AiOutlineClose onClick={() => setCurrentPage(1)} size={"20px"}/>
        </Box>
      </div>

      <Divider className="my-5" color="#E5E7EB" border="1px solid"/>

      <FlexC justifyContent="space-between" alignItems="flex-end">
        <Text className="text-[#1E2185] text-[16px] fontCustom-bold">Staking</Text>
        <div className="flex gap-3 max-[500px]:gap-1">
          <Text className="text-[14px] fontCustom-Medium text-[#6B7280]">
            Balance: {riqBalance.prettify(2)} RIQ&nbsp;
          </Text>
          <Button
            style={{
              padding: 0,
              border: 0,
              backgroundColor: "transparent",
              color: "#1E2185",
            }} className="text-[14px]"
            onClick={() => {
              dispatch({
                type: "setStake",
                newValue: 0,
              });
            }}
          >
            MAX
          </Button>
        </div>
      </FlexC>

      <Box sx={{ pt: [2] }}>
        <EditableRowM5
          label="Stake"
          inputId="stake-riq"
          amountF={editedRIQ} //
          maxAmount={maxAmount.toString()} //
          maxedOut={maxedOut} //
          unit={GT}
          img={RIQ}
          coin="RIQ"
          {...{ editingState }}
          editedAmountF={editedRIQ} //
          setEditedAmount={(newValue) =>
            dispatch({ type: "setStake", newValue })
          } //
          stakedAmount={originalStake.stakedRIQ}
          riqPrice={riqPrice}
        />
      </Box>

      <Divider className="mt-6 mb-6" color="#E5E7EB" border="1px solid" />

      <FlexC justifyContent="space-between" alignItems="center">
        <Text className="text-[#1E2185] text-sm fontCustom-bold flex items-center gap-1">
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
        {newPoolShare.infinite ? (
          <StaticRowM2
            label="Pool share"
            inputId="stake-share"
            amount="N/A"
          />
        ) : (
          <StaticRowM2
            label="Pool share"
            inputId="stake-share"
            amount={newPoolShare.prettify(3)}
            pendingAmount={poolShareChange?.prettify(3).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}
      </FlexC>
      <div className="py-3"></div>
      <Box>{children}</Box>
    </>
  );
};
