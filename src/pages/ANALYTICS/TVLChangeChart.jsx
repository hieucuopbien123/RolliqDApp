import React from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Label, Legend, BarChart, Bar, Cell, ReferenceLine } from "recharts"
import Legendline from "./Legendline";
import useDevice from "../../utils/useMobile";

const DataFormatter = (num,idx) => {
  if(Number(idx)==0||Number(idx)==2||Number(idx)==4)
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num)
  else
  {
    return "";
   
}
};
const TVLChangeChart =({data})=>{
  const { isAnalyticsSmall } = useDevice();
  let max=0;
  if(data.length>0)
  {
    data.forEach(function(elem){
      if(max < elem.TVLChange) 
      max = elem.TVLChange;
    });
  }
  console.log(isAnalyticsSmall);
  console.log("max is",max);
    return (
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "5px"}} className="shadow-xl" >
      <div className="flex flex-wrap gap-5 justify-between mb-1 p-[24px] max-[500px]:p-[15px]">
        <div className="text-[#1E2185] fontCustom-bold">
                    Daily TVL Change (7 days)
                  </div>
                </div>

                <div className="px-[10px]">
                  <div style={{overflow: "auto"}} className="px-[14px] max-[500px]:px-[5px] py-[24px] max-[500px]:py-[15px]">
                <ResponsiveContainer  width={"100%"} minWidth={isAnalyticsSmall ? "470px" : ""} height={300}>
                  <BarChart data={data} >
                  <XAxis dataKey="date" tickSize={10} stroke={"#191C6F"} color="#4B5563" dy={5} tickCount={20} interval={"preserveStartEnd"} fontSize={12}/>
                  <YAxis  stroke={"#191C6F"} padding={{ bottom: 10, top: 10 }} tickFormatter={DataFormatter} tickSize={12} fontSize={12}  >
                  <Label style={{textAnchor:"middle",fill:"#191C6F"}} angle={-90} value={"ETH"} position={"insideLeft"} fontSize={12} className="font-Custombold">
                  </Label>
                  </YAxis>
                  <ReferenceLine y={0} stroke="#191C6F" />
                  <Bar dataKey="TVLChange" fill="#8884d8" barSize={6}>
                  {
                    data.map((el,idx)=>{
                      return(
                      <Cell key={idx} fill={el.TVLChange>0?"#22C55E":"#EF4444"}></Cell>
                      )
                    })
                  }
                  </Bar>

                  </BarChart>
                </ResponsiveContainer>
                </div>
                </div>
        </div>
    )
}
export default TVLChangeChart;