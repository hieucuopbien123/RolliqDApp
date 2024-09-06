import React, { useState, useContext, useEffect, useCallback } from "react";
import { Flex, Text, Box, Divider } from "theme-ui";
import { hexDataSlice, hexDataLength } from "@ethersproject/bytes";
import { defaultAbiCoder } from "@ethersproject/abi";

import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { EthersTransactionCancelledError } from "../../lib/@rolliq/lib-ethers";

import { useRolliq } from "../../hooks/RolliqContext";
import loadingimage from "./assets/loading.gif"

// import { TransactionStatus } from "./TransactionStatus";
import { Icon } from "../WalletConnector/Icon";
import { Tooltip } from "./Tooltip";

import SuccessIcon from "./assets/Success.png";
import FailIcon from "./assets/Fail.png";
import { Fade } from "@chakra-ui/react";

const strokeWidth = 10;

const circularProgressbarStyle = {
  strokeLinecap: "butt",
  pathColor: "white",
  trailColor: "rgba(255, 255, 255, 0.33)"
};

const slowProgress = {
  strokeWidth,
  styles: buildStyles({
    ...circularProgressbarStyle,
    pathTransitionDuration: 30
  })
};

const fastProgress = {
  strokeWidth,
  styles: buildStyles({
    ...circularProgressbarStyle,
    pathTransitionDuration: 0.75
  })
};

const TransactionContext = React.createContext(undefined);

export const TransactionProvider = ({ children }) => {
  const transactionState = useState({ type: "idle" });
  return (
    <TransactionContext.Provider value={transactionState}>{children}</TransactionContext.Provider>
  );
};

const useTransactionState = () => {
  const transactionState = useContext(TransactionContext);

  if (!transactionState) {
    throw new Error("You must provide a TransactionContext via TransactionProvider");
  }

  return transactionState;
};

export const useMyTransactionState = (myId) => {
  const [transactionState] = useTransactionState();

  return transactionState.type !== "idle" &&
    (typeof myId === "string" ? transactionState.id === myId : transactionState.id.match(myId))
    ? transactionState
    : { type: "idle" };
};

const hasMessage = (error) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof (error).message === "string";

export const useTransactionFunction = (
  id,
  send,
  topmessage,
  statemessage,
  detailmessage,
  successmessage
) => {
  const [transactionState, setTransactionState] = useTransactionState();

  const sendTransaction = useCallback(async () => {
    setTransactionState({ type: "waitingForApproval", id, 
    topmessage,
    statemessage,
    detailmessage,
    successmessage });

    try {
      // console.log("Ready to send");
      const tx = await send();
      // console.log("After");

      setTransactionState({
        type: "waitingForConfirmation",
        id,
        tx,
        topmessage,
        statemessage,
        detailmessage,
        successmessage
      });
    } catch (error) {
      if (hasMessage(error) && error.message.includes("User denied transaction signature")) {
        setTransactionState({ type: "cancelled", id });
      } else {
        console.error(error);

        setTransactionState({
          type: "failed",
          id,
          error: new Error("Failed to send transaction (try again)")
        });
      }
    }
  }, [send, id, setTransactionState]);

  return [sendTransaction, transactionState];
};

export function Transaction({
  id,
  tooltip,
  tooltipPlacement,
  showFailure,
  requires,
  send,
  children,
  topmessage,
  statemessage,
  detailmessage,
  successmessage
}) {
  const [sendTransaction, transactionState] = useTransactionFunction(id, send, topmessage, statemessage, detailmessage, successmessage);
  const trigger = React.Children.only(children);

  const failureReasons = (requires || [])
    .filter(([requirement]) => !requirement)
    .map(([, reason]) => reason);

  if (
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation"
  ) {
    failureReasons.push("You must wait for confirmation");
  }

  showFailure =
    failureReasons.length > 0 ? showFailure ?? (tooltip ? "asTooltip" : "asChildText") : undefined;

  const clonedTrigger =
    showFailure === "asChildText"
      ? React.cloneElement(
        trigger,
        {
          disabled: true,
          variant: "danger",
        },
        failureReasons[0]
      )
      : showFailure === "asTooltip"
        ? React.cloneElement(trigger, { disabled: true })
        : React.cloneElement(trigger, { onClick: sendTransaction });

  if (showFailure === "asTooltip") {
    tooltip = failureReasons[0];
  }

  return tooltip ? (
    <>
      <Tooltip message={tooltip} placement={tooltipPlacement || "right"}>
        {clonedTrigger}
      </Tooltip>
    </>
  ) : (
    clonedTrigger
  );
}

// Doesn't work on Kovan:
// https://github.com/MetaMask/metamask-extension/issues/5579
const tryToGetRevertReason = async (provider, tx) => {
  try {
    const result = await provider.call(tx, tx.blockNumber);

    if (hexDataLength(result) % 32 === 4 && hexDataSlice(result, 0, 4) === "0x08c379a0") {
      return (defaultAbiCoder.decode(["string"], hexDataSlice(result, 4)))[0];
    }
    return undefined
  } catch {
    return undefined;
  }
};

const Donut = React.memo(
  CircularProgressbarWithChildren,
  ({ value: prev }, { value: next }) => prev === next
);

const TransactionProgressDonut = ({ state }) => {
  const [value, setValue] = useState(0);
  const maxValue = 1;

  useEffect(() => {
    if (state === "confirmed") {
      setTimeout(() => setValue(maxValue), 40);
    } else {
      setTimeout(() => setValue(maxValue * 0.67), 20);
    }
  }, [state]);

  return state === "confirmed" ? (
    <Donut {...{ value, maxValue, ...fastProgress }}>
      <Icon name="check" color="white" size="lg" />
    </Donut>
  ) : state === "failed" || state === "cancelled" ? (
    <Donut value={0} {...{ maxValue, ...fastProgress }}>
      <Icon name="times" color="white" size="lg" />
    </Donut>
  ) : (
    <Donut {...{ value, maxValue, ...slowProgress }}>
      <Icon name="cog" color="white" size="lg" spin />
    </Donut>
  );
};

export const TransactionMonitor = () => {
  const { provider } = useRolliq();
  const [transactionState, setTransactionState] = useTransactionState();

  const id = transactionState.type !== "idle" ? transactionState.id : undefined;
  const tx = transactionState.type === "waitingForConfirmation" ? transactionState.tx : undefined;

  useEffect(() => {
    if(transactionState.type == "waitingForConfirmation1") return;
    // console.log("RUN");
    if (id && tx) {
      let cancelled = false;
      let finished = false;

      const txHash = tx.rawSentTransaction.hash;

      const waitForConfirmation = async () => {
        try {
          const receipt = await tx.waitForReceipt();

          if (cancelled) {
            return;
          }

          const { confirmations } = receipt.rawReceipt;
          const blockNumber = receipt.rawReceipt.blockNumber + confirmations - 1;
          // console.log(`Block #${blockNumber} ${confirmations}-confirms tx ${txHash}`);
          // console.log(`Finish monitoring tx ${txHash}`);
          finished = true;

          if (receipt.status === "succeeded") {
            // console.log(`${receipt}`);

            setTransactionState({
              type: "confirmedOneShot",
              id,
              topmessage: transactionState?.topmessage || "",
              statemessage: transactionState?.statemessage || "",
              detailmessage: transactionState?.detailmessage || "",
              successmessage: transactionState?.successmessage || ""
            });
          } else {
            const reason = await tryToGetRevertReason(provider, receipt.rawReceipt);

            if (cancelled) {
              return;
            }

            console.error(`Tx ${txHash} failed`);
            if (reason) {
              console.error(`Revert reason: ${reason}`);
            }

            setTransactionState({
              type: "failed",
              id,
              error: new Error(reason ? `Reverted: ${reason}` : "Failed")
            });
          }
        } catch (rawError) {
          if (cancelled) {
            return;
          }

          finished = true;

          if (rawError instanceof EthersTransactionCancelledError) {
            // console.log(`Cancelled tx ${txHash}`);
            setTransactionState({ type: "cancelled", id });
          } else {
            console.error(`Failed to get receipt for tx ${txHash}`);
            console.error(rawError);

            setTransactionState({
              type: "failed",
              id,
              error: new Error("Failed")
            });
          }
        }
      };

      // console.log(`Start monitoring tx ${txHash}`);
      waitForConfirmation();

      return () => {
        if (!finished) {
          setTransactionState({ type: "idle" });
          // console.log(`Cancel monitoring tx ${txHash}`);
          cancelled = true;
        }
      };
    }
  }, [provider, id, tx, setTransactionState]);

  useEffect(() => {
    if(transactionState.type === "waitingForConfirmation1") return;
    if (transactionState.type === "confirmedOneShot" && id) {
      // hack: the txn confirmed state lasts 5 seconds which blocks other states, review with Dani
      setTransactionState({ type: "confirmed", id });
    } else if (
      transactionState.type === "confirmed" ||
      transactionState.type === "failed" ||
      transactionState.type === "cancelled"
    ) {
      let cancelled = false;

      setTimeout(() => {
        if (!cancelled) {
          setTransactionState({ type: "idle" });
        }
      }, 5000);

      return () => {
        cancelled = true;
      };
    }
  }, [transactionState.type, setTransactionState, id]);

  if (transactionState.type === "idle") {
    return null;
  }

  // const chainId = (provider).chainId;
  // const etherscanUrl = (tx) => {
  //   if (!tx) return;
  //   const url = (network) => `https://${network ? `${network}.` : ""}etherscan.io/tx/${tx.rawSentTransaction.hash}`
  //   switch (chainId) {
  //     case 1: return url()
  //     case 3: return url("ropsten")
  //     case 4: return url("rinkeby")
  //     case 5: return url("goerli")
  //     case 280: return `https://zksync2-testnet.zkscan.io/tx/${tx.rawSentTransaction.hash}`
  //     default: return `https://zksync2-testnet.zkscan.io/tx/${tx.rawSentTransaction.hash}`
  //   }
  // }

  // console.log(transactionState);
  return (
    <Fade in={true}>
    <Flex
      sx={{
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        position: "fixed",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        overflow: "hidden"
      }}
      backgroundColor="rgba(0, 0, 0, 0.5)"
    >
      <Box className="py-10" style={{ width: "600px" }}>
        <Box className="bg-[#fff] p-8 rounded-3xl shadow-md text-center" onClick={() => {
          if(!transactionState.type.includes("waiting")){
            setTransactionState({type: "idle"})
          }
        }}>
          <Box marginBottom="32px">
            <Text className="mb-4 text-[24px] text-[#1E2185] font-semibold">{transactionState?.topmessage || "Confirm transaction"}</Text>
          </Box>
          <Box sx={{ my: "24px" }}>
            <Divider color="#E5E7EB" />
          </Box>
          <Box className="flex justify-center">
            {
              transactionState.type === "waitingForConfirmation" || transactionState.type === "waitingForApproval"
              ? (<img src={loadingimage}/>)
              : transactionState.type === "cancelled" || transactionState.type === "failed"
              ? (<img src={FailIcon}/>)
              : (<img src={SuccessIcon}/>)
            }
          </Box>
          {
            transactionState.type === "waitingForConfirmation" || transactionState.type === "waitingForApproval"
            ? (<></>)
            : transactionState.type === "cancelled" || transactionState.type === "failed"
            ? (
              <div className="py-2"></div>)
            : (
              <div className="py-2"></div>)
          }
          <Text className="text-xl"
            color={
              transactionState.type === "waitingForConfirmation" || transactionState.type === "waitingForApproval"
              ? "#1E2185"
              : transactionState.type === "cancelled" || transactionState.type === "failed"
              ? "#EF4444"
              : "#22C55E"
            }
          >
            {
              transactionState.type === "waitingForConfirmation" || transactionState.type === "waitingForApproval"
              ? (
                <>
                  {
                    transactionState?.statemessage && 
                    <>
                      <p className="text-[20px]">{transactionState.statemessage}</p>
                      <div className="pt-1"></div>
                    </>
                  }
                  {
                    transactionState?.detailmessage &&
                    <>
                      <p className="text-[20px]">{transactionState.detailmessage}</p>
                      <div className="pt-1"></div>
                    </>
                  }
                  <p className="text-[18px] text-[#6B7280] fontCustom-Medium">{
                    transactionState.type === "waitingForApproval" ? "Please approve this transaction in your wallet" : "Waiting for mining..."
                  }</p>
                </>
              )
              :  
              (
                transactionState.type === "cancelled" || transactionState.type === "failed"
                ? (
                  <>
                    <p className="text-[20px] fontCustom-bold">
                      Transaction rejected
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[20px] fontCustom-bold">
                      Transaction sucessful
                    </p>
                    {
                      transactionState?.successmessage &&
                      <p className="text-[#6B7280] text-[20px]">{transactionState.successmessage}</p>
                    }
                  </>
                )
              )
            }
          </Text>
        </Box>
      </Box>
    </Flex ></Fade>
  );
};
