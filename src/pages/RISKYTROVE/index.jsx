import React, { useState, useEffect, useCallback } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Card, Button, Text, Box, Heading, Flex } from "theme-ui";
import {
  Percent,
  MINIMUM_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
} from "../../lib/@rolliq/lib-base";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { shortenAddress } from "../../utils/shortenAddress";
import { useRolliq } from "../../hooks/RolliqContext";
import { Text as TextC, Button as ButtonC, Fade } from "@chakra-ui/react";
import { Abbreviation } from "./Abbreviation";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { Transaction } from "../../components/Trasaction";
import { LiquidationManager } from "./LiquidationManager";
import copIcon from "./assets/copicon.png";
import { Tooltip as TooltipC } from '@chakra-ui/react';

const rowHeight = "46px";

const select = ({
  numberOfTroves,
  price,
  total,
  rusdInStabilityPool,
  blockTag
}) => ({
  numberOfTroves,
  price,
  recoveryMode: total.collateralRatioIsBelowCritical(price),
  totalCollateralRatio: total.collateralRatio(price),
  rusdInStabilityPool,
  blockTag
});


const liquidatableInNormalMode = (trove, price) =>
  [trove.collateralRatioIsBelowMinimum(price), "Collateral ratio not low enough"];

const liquidatableInRecoveryMode = (
  trove,
  price,
  totalCollateralRatio,
  rusdInStabilityPool
) => {
  const collateralRatio = trove.collateralRatio(price);

  if (collateralRatio.gte(MINIMUM_COLLATERAL_RATIO) && collateralRatio.lt(totalCollateralRatio)) {
    return [
      trove.debt.lte(rusdInStabilityPool),
      "There's not enough RUSD in the Stability pool to cover the debt"
    ];
  } else {
    return liquidatableInNormalMode(trove, price);
  }
};

const RiskyTroves = () => {
  const {
    blockTag,
    numberOfTroves,
    recoveryMode,
    totalCollateralRatio,
    rusdInStabilityPool,
    price
  } = useRolliqSelector(select);
  const pageSize = 10;
  const { rolliq } = useRolliq();

  const [loading, setLoading] = useState(true);
  const [troves, setTroves] = useState();

  const [reload, setReload] = useState({});
  const forceReload = useCallback(() => setReload({}), []);

  const [page, setPage] = useState(0);
  const numberOfPages = Math.ceil(numberOfTroves / pageSize) || 1;
  const clampedPage = Math.min(page, numberOfPages - 1);

  const nextPage = () => {
    if (clampedPage < numberOfPages - 1) {
      setPage(clampedPage + 1);
    }
  };

  const previousPage = () => {
    if (clampedPage > 0) {
      setPage(clampedPage - 1);
    }
  };

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [page, clampedPage]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    rolliq
      .getTroves(
        {
          first: pageSize,
          sortedBy: "ascendingCollateralRatio",
          startingAt: clampedPage * pageSize
        },
        { blockTag }
      )
      .then(troves => {
        if (mounted) {
          setTroves(troves);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [rolliq, clampedPage, pageSize, reload]);

  useEffect(() => {
    forceReload();
  }, [forceReload, numberOfTroves]);

  const [copied, setCopied] = useState();

  useEffect(() => {
    if (copied !== undefined) {
      let cancelled = false;

      setTimeout(() => {
        if (!cancelled) {
          setCopied(undefined);
        }
      }, 2000);

      return () => {
        cancelled = true;
      };
    }
  }, [copied]);

  return (
    
    <Fade in={true}>
  <Box className="py-10 mx-2">
    <Box className="flex justify-center">
      <Box className="bg-[#fff] p-8 max-[500px]:p-6 min-w-0 w-full max-w-[1000px]" style={{borderRadius: "48px"}}>
        <div className="max-[500px]:w-[100%]" style={{overflowX: "auto"}}>
          <div className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <TextC className="text-[24px] fontCustom-bold text-[#1E2185]" style={{minHeight: "40px", paddingTop: "3px"}}>Risky Troves</TextC>
              {/* <Button
                variant="titleIcon"
                sx={{ opacity: loading ? 0 : 1 }}
                onClick={forceReload}  className="fontCustom-bold"
              >
                <Icon name="redo" size="lg" />
              </Button> */}
            </div>
            <LiquidationManager/>
          
          </div>
          {!troves || troves.length === 0 ? (
            <Box sx={{ py: [2, 3] }}>
              <Box sx={{ p: 4, fontSize: 3, textAlign: "center" }}>
                {!troves ? "Loading..." : "There are no Troves yet"}
              </Box>
            </Box>
          ) : (
            <Box sx={{ pb: [2, 3] }}>
              <Box
                as="table"
                sx={{
                  mt: 2,
                  pl: [1, 4],
                  width: "100%",
                  textAlign: "center",
                  lineHeight: 1.15
                }}
                overflowX="auto"
              >
                <colgroup>
                  <col style={{ width: "50px" }} />
                  <col />
                  <col />
                  <col />
                  <col style={{ width: rowHeight }} />
                </colgroup>
                <thead className="text-[16px] fontCustom-bold">
                  <tr style={{borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB"}}>
                    <th style={{paddingTop: "20px", color: "#1E2185", paddingBottom: "20px", textAlign: "left"}} className="px-3">Owner</th>
                    <th style={{paddingTop: "20px", color: "#1E2185", paddingBottom: "20px"}} className="px-3">
                      <Abbreviation short="Coll">Collateral(ETH)</Abbreviation>
                    </th>
                    <th style={{paddingTop: "20px", color: "#1E2185", paddingBottom: "20px"}} className="px-3">
                      <Abbreviation short="Debt">Debt(rUSD)</Abbreviation>
                    </th>
                    <th style={{paddingTop: "20px", color: "#1E2185", paddingBottom: "20px"}} className="px-3">
                      <Abbreviation short="Coll.Ratio">Collateral Ratio</Abbreviation>
                    </th>
                    <th style={{paddingTop: "20px", color: "#1E2185", paddingBottom: "20px"}} className="px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {troves.map(
                    trove =>
                      !trove.isEmpty && ( // making sure the Trove hasn't been liquidated
                        // (TODO: remove check after we can fetch multiple Troves in one call)
                        <tr key={trove.ownerAddress} className="text-[14px] fontCustom-Medium">
                          <td
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: rowHeight
                            }}
                          >
                            <TooltipC label={trove.ownerAddress} placement="top" fontSize={"small"} hasArrow color="white" padding="7px" bg={"#333"} borderRadius={"5px"}>
                              <Text
                                variant="address"
                                sx={{
                                  width: ["73px", "unset"],
                                  overflow: "hidden",
                                  position: "relative",
                                  fontFamily: "Mori Gothic Medium",
                                }}
                              >
                                <p className="min-w-[95px]">
                                  {shortenAddress(trove.ownerAddress)}
                                </p>
                                <Box
                                  sx={{
                                    display: ["block", "none"],
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    width: "50px",
                                    height: "100%",
                                    background:
                                      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)"
                                  }}
                                />
                              </Text>
                            </TooltipC>
                            <CopyToClipboard
                              text={trove.ownerAddress}
                              onCopy={() => setCopied(trove.ownerAddress)}
                            >
                                <Button variant="icon" sx={{ width: "24px", height: "24px" }}  className="fontCustom-bold">
                                  <TooltipC label="Copy" bg={"#333"} borderRadius={"5px"} hasArrow color="white" padding="5px" placement="right" fontSize={"small"}>
                                    <img src={copied === trove.ownerAddress ? copIcon : copIcon}/>
                                  </TooltipC>
                                </Button>
                            </CopyToClipboard>
                          </td>
                          <td>
                            <Abbreviation short={trove.collateral.shorten()}>
                              {trove.collateral.prettify(4)}
                            </Abbreviation>
                          </td>
                          <td>
                            <Abbreviation short={trove.debt.shorten()}>
                              {trove.debt.prettify()}
                            </Abbreviation>
                          </td>
                          <td>
                            {(collateralRatio => (
                              <Text
                                color={
                                  collateralRatio.gt(CRITICAL_COLLATERAL_RATIO)
                                    ? "success"
                                    : collateralRatio.gt(1.2)
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {new Percent(collateralRatio).prettify()}
                              </Text>
                            ))(trove.collateralRatio(price))}
                          </td>
                          <td style={{minWidth: "100px"}}>
                            <Transaction
                              id={`liquidate-${trove.ownerAddress}`}
                              tooltip="Liquidate"
                              requires={[
                                recoveryMode
                                  ? liquidatableInRecoveryMode(
                                      trove,
                                      price,
                                      totalCollateralRatio,
                                      rusdInStabilityPool
                                    )
                                  : liquidatableInNormalMode(trove, price)
                              ]}
                              send={rolliq.send.liquidate.bind(rolliq.send, trove.ownerAddress)}
                              topmessage="Confirm liquidate"
                              successmessage={`You have received 200 rUSD and ${0.5*parseFloat(trove.collateral.prettify(4))} ETH`}
                            >
                              <Button style={{borderRadius: "20px", border: "none", backgroundColor: "#1E2185", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "15px", paddingRight: "15px", color: "white"}}  className="fontCustom-bold text-[14px] disabledButton animationCustom2">
                                Liquidate
                              </Button>
                            </Transaction>
                          </td>
                        </tr>
                      )
                  )}
                </tbody>
              </Box>
            </Box>
          )}
          <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
            {numberOfTroves !== 0 && (
              <>
                <Button variant="titleIcon" onClick={previousPage} disabled={clampedPage <= 0} className="fontCustom-bold">
                  <BsArrowLeft size={"25px"}/>
                </Button>
                <Abbreviation
                  short={`page ${clampedPage + 1} / ${numberOfPages}`}
                  sx={{ mr: [2], ml: [2], fontWeight: "body", fontSize: [1, 2], letterSpacing: [-1, 0] }}
                >
                  <p className="text-[18px]">
                  {clampedPage * pageSize + 1}-{Math.min((clampedPage + 1) * pageSize, numberOfTroves)}{" "}
                  of {numberOfTroves}</p>
                </Abbreviation>
                <Button
                  variant="titleIcon"
                  onClick={nextPage}
                  disabled={clampedPage >= numberOfPages - 1}  className="fontCustom-bold"
                >
                  <BsArrowRight size={"25px"}/>
                </Button>
              </>
            )}
          </Flex>
        </div>


        {/* {loading && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box></Fade>
  );
};

export default RiskyTroves;
