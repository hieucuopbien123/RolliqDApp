import React ,{useState,useEffect} from "react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Label, Legend, BarChart, Bar, Cell, ReferenceLine } from "recharts"
import Legendline from "./Legendline";
import TVLChart from "./TVLChart";
import TVLChangeChart from "./TVLChangeChart";
import TotalRUSDChart from "./TotalRUSDChart";
import NumberOfTroveChart from "./NumberOfTroveChart";
import TotalGainStake from "./TotalGainStake";
import TotalGainSupplyChart from "./TotalGainSupplyChart";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import { Fade } from "@chakra-ui/react";
import { useRolliq } from "../../hooks/RolliqContext";
import { CRITICAL_COLLATERAL_RATIO, Percent } from "../../lib/@rolliq/lib-base";
import TokenContract from "./utils/TokenContract";
import ERC20MockContract from "../SWAP/contract/utils/ERC20MockContract";
import PriceFeed from "../TROVE/contracts/utils/PriceFeed";
import zkSync from "../../lib/@rolliq/lib-ethers/deployments/zksync.json"
import { getETHBalance } from "./utils/getETHBalance";
import BigNumber from "bignumber.js";
import { Decimal } from "../../lib/@rolliq/lib-base";
import GraphAPI from "./utils/GraphAPI";
import { Spinner } from "theme-ui";
 
const selector = (state) => {
  const { fees,rusdInStabilityPool,numberOfTroves,price, remainingStabilityPoolRIQReward} = state;
  return {
    fees,
    rusdInStabilityPool,
    numberOfTroves,
    price, remainingStabilityPoolRIQReward
    
  };
};

const BASE18 = BigNumber("1000000000000000000");
const yearlyIssuanceFraction = 0.5;
const dailyIssuanceFraction = Decimal.from(1 - yearlyIssuanceFraction ** (1 / 365));
// const listData = [
//   {
//     title: "Kickack Rate",
//     value: "100%"
//   },
//   {
//     title: "Borrowing Fee",
//     value: "0.5%"
//   },
//   { title: "rUSD Supply", value: "125,984,012" },
//   { title: "rUSD in Stability Pool", value: "125,984,012" },
//   { title: "ETH TVL", value: "$691,389,328" },
//   { title: "Stability Pool APR", value: "9.00%" },
//   { title: "ABC Staking APR", value: "29.95%" },
//   { title: "Average Collateral Ratio", value: "155.9%" },
//   { title: "ABC Circulating Supply", value: "91,389,328" },
//   { title: "Protocol Revenue", value: "$30,945,175" }
// ];

const Analytics = () => {
  const [rusd,setRusd]=useState(0);
  const [ethTVL,setEthTVL] = useState(0);
  const [troves, setTroves] = useState([]);
  const [riq,setRiq] =useState(0);
  const [riqPrice, setRiqPrice] = useState(0); 
  const [isLoading,setIsLoading] =useState(false);
  const [graphQLData,setGraphQLData] = useState([]);
  const  {fees,rusdInStabilityPool,numberOfTroves, remainingStabilityPoolRIQReward,price} =useRolliqSelector(selector);
 
  async function getInfo()
  {
    setIsLoading(true);
    let [rusdSupply,riqSupply,ethTVL,priceFeed,graphData] = await Promise.all([TokenContract.totalSupply(zkSync.addresses.rusdToken),TokenContract.totalSupply(zkSync.addresses.riqToken),getETHBalance(zkSync.addresses.activePool),PriceFeed.getLastGoodPrice(),GraphAPI.getAllData()])
    // const rusdSupply = await RUSDContract.totalSupply();
    // let ethTVL =await getETHBalance(zkSync.addresses.activePool);
    // const priceFeed = Number(BigNumber(await PriceFeed.getLastGoodPrice()).dividedBy(BASE18));
    //priceFeed=Number(BigNumber(priceFeed).dividedBy(BASE18));
    ethTVL = Number(BigNumber(ethTVL).dividedBy(BASE18).toFixed(4));
    //console.log(ethTVL);
    //const tvlPrice =Math.round(Number(priceFeed*ethTVL));
    let standardData = graphData.map((el)=>{
      let date = new Date();
      date.setDate(date.getDate()-5+Number(el.id))
      console.log(date)
      return{
      ...el,
      TVLChange: el.isTVLChangeNegative ? -Number(BigNumber(el.TVLChange).dividedBy(BASE18)): Number(BigNumber(el.TVLChange).dividedBy(BASE18)),
      thisDayRUSDBorrowed : Number(BigNumber(el.thisDayRUSDBorrowed).dividedBy(BASE18)),
      thisDayValueLocked  : Number(BigNumber(el.thisDayValueLocked ).dividedBy(BASE18)),
      date :(date.getMonth()+1) +"/"+ date.getDate() 
      }
      
    })
   const fakeData = GraphAPI.createFakeGraphData(10);
   //console.log(fakeData)
    setRusd(String(BigNumber(rusdSupply).dividedBy(BASE18).toFixed()).replace(/(.)(?=(\d{3})+$)/g,'$1,'))
    setRiq(String(BigNumber(riqSupply).dividedBy(BASE18).toFixed()).replace(/(.)(?=(\d{3})+$)/g,'$1,'))
    setEthTVL("$"+ethTVL)
    setGraphQLData(standardData);
    //setGraphQLData(fakeData);
    setIsLoading(false);

  }
  useEffect(()=>{ 
    
    
     getInfo()
         },
     [])
  
  
  console.log(numberOfTroves)
  console.log(troves)

  // const riqIssuanceOneDay = remainingStabilityPoolRIQReward.mul(dailyIssuanceFraction);
  // const riqIssuanceOneDayInUSD = riqIssuanceOneDay.mul(riqPrice);
  // const aprPercentage = riqIssuanceOneDayInUSD.mulDiv(365 * 100, rusdInStabilityPool);
  // console.log(aprPercentage);
  const {provider,rolliq } =useRolliq();
  useEffect(()=>{rolliq.getTroves({first:numberOfTroves,sortedBy: "ascendingCollateralRatio"}).then((troves)=>setTroves(troves))},[numberOfTroves]);
  const borrowingRate = fees.borrowingRate();
  const feePct = new Percent(borrowingRate);
  let avgCoRatio=0;
  if(troves.length>0)
  {
    let initVal=0;
    troves.map((trove)=>{
      initVal+=Number(trove.collateralRatio(price))
    })
    avgCoRatio=Number(initVal/numberOfTroves*100).toFixed(2) + "%";
  }
  

  // if(numberOfTroves>0)
  // {
  //   const initVal =0;
  //   const sumRatio=troves.reduce((el,curVar)=>{
  //     Number((el))+curVar
  //   },initVal)
  //   console.log(sumRatio);
    
  // }

  
  const listData = [
    {
      title: "Kickack Rate",
      value: "100%"
    },
    {
      title: "Borrowing Fee",
      value: feePct.toString(2)
    },
    { title: "rUSD Supply", value: rusd },
    { title: "rUSD in Stability Pool", value: rusdInStabilityPool.prettify(2) },
    { title: "ETH TVL", value: ethTVL },
    { title: "Stability Pool APR", value: "9.00%" },
    { title: "RIQ Staking APR", value: "29.95%" },
    { title: "Average Collateral Ratio", value: avgCoRatio },
    { title: "RIQ Circulating Supply", value: riq },
    { title: "Protocol Revenue", value: "$30,945,175" }
  ];
  
  return (
    <>
    <Fade in={true}>
      <div className="py-8 px-5">
        <div className="flex justify-center items-baseline">
          <div className=" sm:w-7/8 md:w-5/6 lg:w-4/5 ">
            <div className="grid 
            grid-cols-1
            min-[450px]:grid-cols-2
            min-[1090px]:grid-cols-5
            lg:gap-4 md:gap-2 text-center gap-2" style={{justifyContent: "center"}}>
              {
                listData.map((el, idx) => {
                  return (
                    <div className="flex flex-col gap-1 items-center bg-[#fff] max-[450px]:max-w-[300px] text-center gridItem max-[450px]:justify-self-center" style={{ padding: "16px 10px", borderRadius: "24px", width: "100%"}} >
                      <div className="text-[#737373] text-sm text-center">
                        {el.title}
                      </div>
                      <div className="text-[#1E2185] text-xl fontCustom-bold">
                      {isLoading?<Spinner size={25}></Spinner>:el.value}
                      </div>


                    </div>

                  )
                })
              }
            </div>
            <div className="pt-6"></div>
            <div className="grid grid-cols-1 gap-6 min-[1290px]:grid-cols-2 lg:gap-6 md:gap-12">
              <TVLChart data={graphQLData} ></TVLChart>
              <TVLChangeChart data={graphQLData}></TVLChangeChart>
              <TotalRUSDChart data={graphQLData}></TotalRUSDChart>
              <NumberOfTroveChart data={graphQLData} ></NumberOfTroveChart>
              <TotalGainSupplyChart data={graphQLData}></TotalGainSupplyChart>
              <TotalGainStake  data={graphQLData}></TotalGainStake>
            </div>
          </div>
        </div>
      </div>
      </Fade>
    </>
  )
}

export default Analytics;