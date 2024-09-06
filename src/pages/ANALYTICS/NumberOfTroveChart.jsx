import React from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Label, Legend, BarChart, Bar, Cell, ReferenceLine } from "recharts"
import Legendline from "./Legendline";
import useDevice from "../../utils/useMobile";

const DataFormatter = (num) => {
  
  return  Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num)
 
};
const NumberOfTroveChart =({data})=>{
  const { isAnalyticsSmall } = useDevice();
  console.log(isAnalyticsSmall);
    return (
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "5px"}} className="shadow-xl" >
        <div className="flex flex-wrap gap-5 justify-between mb-1 p-[24px] max-[500px]:p-[15px]">
                  <div className="text-[#1E2185] fontCustom-bold">
                    Number Of Troves
                  </div>
                </div>
                <div className="px-[10px]">
                  <div style={{overflow: "auto"}} className="px-[14px] max-[500px]:px-[5px] py-[24px] max-[500px]:py-[15px]">
                  <ResponsiveContainer  width={"100%"} minWidth={isAnalyticsSmall ? "470px" : ""} height={300}>
                  <LineChart
                    data={data}
                  >
                    <XAxis dataKey="date" scale="point" padding={{ left: 10, right: 10 }} stroke={"#191C6F"} tickSize={10} fontSize={12} color="#4B5563" dy={5} />
                    <YAxis yAxisId="left" stroke={"#191C6F"} tickSize={12} padding={{ bottom: 10, top: 10 }} tickFormatter={DataFormatter} fontSize={12}> 
                    <Label style={{textAnchor:"middle",fill:"#191C6F"}} angle={-90} value={"Trove(s)"} position={"insideLeft"} fontSize={12}>

                    </Label>
                    </YAxis>
                    <Line yAxisId="left" type="monotone" dataKey="thisDayTroveCount" stroke="#235FC2" dot={false} />  
                  </LineChart>
                </ResponsiveContainer>
                </div>
                </div>
              </div>
    )
}
export default NumberOfTroveChart;