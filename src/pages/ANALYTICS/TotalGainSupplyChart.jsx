import React from "react";
import { Box } from "@chakra-ui/react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Label, Legend, BarChart, Bar, Cell, ReferenceLine, Tooltip } from "recharts"
import Legendline from "./Legendline";
import useDevice from "../../utils/useMobile";

const DataFormatter = (num,idx) => {
    if(Number(idx)==4||Number(idx)==9)
    return  Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num)
    else
    {
      return "";
     
  }
  };
const TotalGainSupplyChart =({data})=>{
  const { isAnalyticsSmall } = useDevice();
  console.log(isAnalyticsSmall);
  let max=0;
  data.forEach(function(el){
    if(max < el.thisDayValueLocked) 
    max = el.thisDayValueLocked;
  })
    return (
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "5px"}} className="shadow-xl" >
                <div className="flex flex-wrap gap-5 justify-between mb-1 p-[24px] max-[500px]:p-[15px]">
                  <div className="text-[#1E2185] fontCustom-bold">
                    Total Gains from Supplying
                  </div>
                  <div className="flex">
                    <div className="flex items-center">
                      <Legendline color={"#235FC2"}></Legendline>
                      <div style={{ fontSize: "12px", marginLeft: "10px" }}>ETH</div>
                    </div>
                    <div className="flex items-center ml-5">
                      <Legendline color={"#22C55E"}></Legendline>
                      <div style={{ fontSize: "12px", marginLeft: "10px" }}>USD</div>
                    </div>
                    

                  </div>
                </div>
                <div className="px-[10px]">
                  <Box style={{overflow: "auto"}} className="px-[14px] max-[500px]:px-[5px] py-[24px] max-[500px]:py-[15px]" sx={{".recharts-text recharts-cartesian-axis-tick-value":""}}>
                  <ResponsiveContainer  width={"100%"} minWidth={isAnalyticsSmall ? "470px" : ""} height={300}>
                      <LineChart
                        data={data}
                      >
                        <XAxis dataKey="date" scale="point" padding={{ left: 10, right: 10 }}  stroke={"#191C6F"} tickSize={10} fontSize={12} color="#4B5563" dy={5}  />
                        <YAxis yAxisId="left" type="number" tickCount={10} interval={0} stroke={"#191C6F"} tickSize={12} padding={{ bottom: 10, top: 10 }} tickFormatter={DataFormatter} fontSize={12} >
                            <Label style={{textAnchor:"middle",fill:"#191C6F"}} angle={-90} value={"Issuance (aUSD)"} position={"insideLeft"} fontSize={12}>
                            </Label>
                        </YAxis>
                        <YAxis yAxisId="right" type="number" orientation="right" tickCount={10} interval={0}  stroke={"#191C6F"} tickSize={12} padding={{ bottom: 10, top: 10 }}  tickFormatter={DataFormatter} fontSize={12}>
                        <Label style={{textAnchor:"middle",fill:"#191C6F"}} angle={90} value={"Redemption (ETH)"} position={"insideRight"} fontSize={12}>
                            </Label>
                        </YAxis>
                        <Line yAxisId="left" type="monotone" dataKey="thisDayGainsFromSupplying" stroke="#235FC2" dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="thisDayGainsFromSupplyingInUsd" stroke="#22C55E" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </div>
              </div>
    )
}
export default TotalGainSupplyChart;