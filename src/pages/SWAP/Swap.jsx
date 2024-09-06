import React,{useState,useCallback, useEffect} from "react";
import { Box } from "theme-ui";
import { color, Fade, Flex as FlexC, useEditable} from "@chakra-ui/react"
import { Divider, Text } from "@chakra-ui/react";
import { InputGroup,Input,InputLeftAddon,InputRightAddon } from "@chakra-ui/react";
import { Card ,Container} from "theme-ui";
import { InfoIcon } from "../TROVE/InfoIcon";
import { useDisclosure } from "@chakra-ui/react";
import { ActionDescription } from "./ActionDescription";
import { ErrorDescription } from "./ErrorDescription";
import ETH from "./assets/ETH.png";
import USD from "./assets/USD.png";
import settingIcon from "./assets/setting.svg";
import swapIcon from "./assets/swap.png";
import SettingDialog from "./SettingDialog";
import CoinDialog from "./CoinDialog";
import { useRolliq } from "../../hooks/RolliqContext";
import Web3 from "web3";
import Factory from "./contract/utils/Factory";
import Pair from "./contract/utils/Pair";
import Router from "./contract/utils/Router";
import BigNumber from "bignumber.js";
import { debounce } from "lodash";
//import BigNumber from "big-number/big-number";
import { useRolliqSelector } from "../../lib/@rolliq/lib-react";
import ERC20MockContract from "./contract/utils/ERC20MockContract";
import { LoadingOverlay } from "./LoadingOverlay";
import ResultDialog from "./ResultDialog";
import PriceFeed from "./contract/utils/PriceFeed";
import ConfirmDialog from "./ConfirmDialog";
import downIcon from "./assets/downIcon.png";
import useDevice from "../../utils/useMobile";
import { Decimal } from "../../lib/@rolliq/lib-base";


const ListToken=[
  {
    name:"ETH",
    contract:"0x3700FD466Cd8882d238315090F2248460ef4D103",
    img:ETH,
    isNative:true,

  },
  {
    name:"RIQ",
    contract:"0x862079DA411e4c13E813ACFcd5B2Fa3F4FB1811c",
    img:swapIcon,
    isNative:false
  },
  {
    name:"RUSD",
    contract:"0x023aDED8309C6bBbB72b89462b2d6f1d76edcDf9",
    img:USD,
    isNative:false
  }
]
const BASE18 = BigNumber("1000000000000000000");
const Swapping = ()=>{
  const selector = (state) => {
    const { accountBalance } = state;
    return {
     
      accountBalance,
    };
  };
   const { isOpen , onOpen, onClose } = useDisclosure();
   const {provider,account} = useRolliq();
   const [fromAsset,setFromAsset] = useState(0);
   const [fromAmount,setFromAmount]=useState(0.01);
   const [toAsset,setToAsset]=useState(1);
   const [toAmount,setToAmount]=useState(0);
   const [slippage,setSlippage] =useState(1);
   const [priceImpact,setPriceImpact]=useState(0);
   const [deadline ,setDeadline]=useState(30);
   const { accountBalance} = useRolliqSelector(selector);
   const [isLoading,setIsLoading]=useState(false);
   const [listprice,setListPrice]  =useState([0,0,0]);
   const [listMarketPrice,setListMarketPrice] = useState([0,0,0]);
   const [isSuccess,setIsSuccess] =useState(false);
   const [isAproving,setIsApproving] =useState(false);
   
   
   useEffect(()=>{
    fetchBalance();
   },[fromAsset,toAsset,isLoading]);
   
   useEffect(()=>{
    debounceFetch(fromAmount,fromAsset,toAsset);
   },[fromAsset,toAsset]);
   const fetchBalance = async ()=>{
    
    const RIQContract= ERC20MockContract.getContractFactory(provider,ListToken[1].contract, { decimals: 18 });
    const RUSDContract = ERC20MockContract.getContractFactory(provider,ListToken[2].contract, { decimals: 18 });
    const riqBalance =await RIQContract.getBalance(account);
    // console.log("RIQ BALANCE",Number(riqBalance));
    const rusdBalance =await RUSDContract.getBalance(account);
    // console.log("RUSD BALANCE:",Number(rusdBalance));
    let ETHMarketPrice =await PriceFeed.lastGoodPrice();
    ETHMarketPrice = Number(BigNumber(ETHMarketPrice).dividedBy(BASE18));
    
    
    setListPrice([Number(accountBalance),Number(riqBalance),Number(rusdBalance)])
    setListMarketPrice([ETHMarketPrice,1.2,1.2])
    

   }
   


   async function handleApprove(coinAddr,value) {
    const ROUTER_ADDRESS="0x23B17958Cce6d3da6A95F2e1529c9c729F91f289";

    const erc20Contract = ERC20MockContract.getContractFactory(provider,coinAddr, { decimals: 18 });
    const allowance = await erc20Contract.getAllowance(account, ROUTER_ADDRESS);
    const amount = BigNumber(value);

    if (allowance.isLessThan(amount)) {
      await erc20Contract.approve(ROUTER_ADDRESS, value, account);
     
    }
  }
  function toggleCoin()
  {

    setToAsset(fromAsset);
    setFromAsset(toAsset);
    setFromAmount(0.01);
    setToAmount(0);

  }
   async function handleDebounceFetch(value,lfromAsset,ltoAsset)
   {
    if(lfromAsset===undefined||ltoAsset===undefined)
    return
    //console.log("dsfd")
    if(!value||isNaN(value)) return
    // console.log("cap nhat value ",fromAsset,toAsset)
    let expectedValue;
    if(!ListToken[lfromAsset].isNative&&!ListToken[ltoAsset].isNative)
    {
      // const pairAdrress1 = await Factory.getPair(ListToken[0].contract,ListToken[fromAsset].contract);
      // const pairAdrress2 = await Factory.getPair(ListToken[0].contract,ListToken[toAsset].contract);
      let frompool;
      let topool;

      // console.log("cap nhat amountOut1")
      const amountOut1 =await Router.getAmountsOut(BigNumber(value).multipliedBy(BASE18).toFixed(),[ListToken[lfromAsset].contract,ListToken[0].contract]);
      // console.log("amountOut1",amountOut1)
      const pairAdrress = await Factory.getPair(ListToken[0].contract,ListToken[ltoAsset].contract);
      // console.log("pairAdrress",pairAdrress);
      const reserve = await Pair.getReserves(pairAdrress);
      // console.log("reserve",reserve)
      
      if(Number(ListToken[0].contract<Number(ListToken[ltoAsset].contract)))
        {
          frompool=reserve[0]

        }
      else 
      {
        frompool = reserve[1];
      }
      const amountOut2 =await Router.getAmountsOut(BigNumber(amountOut1[1]).toFixed(),[ListToken[0].contract,ListToken[ltoAsset].contract]);
      expectedValue=amountOut2[1];
      let r0 = Number(BigNumber(frompool).dividedBy(BASE18))
      let a_in= Number(BigNumber(amountOut1[1]).dividedBy(BASE18))
      let impact = a_in/(a_in+r0);
      

      setToAmount(Number(BigNumber(expectedValue).dividedBy(BASE18)));
      setPriceImpact(impact)
    }
    else{
    const pairAdrress = await Factory.getPair(ListToken[lfromAsset].contract,ListToken[ltoAsset].contract);
    const reserve = await Pair.getReserves(pairAdrress);
    let frompool;
    if(Number(ListToken[lfromAsset].contract)<Number(ListToken[ltoAsset].contract))
      frompool=reserve[0];
    else frompool=reserve[1];
 
    let path ;
    if(ListToken[lfromAsset].isNative||ListToken[ltoAsset].isNative)
      path=[ListToken[lfromAsset].contract,ListToken[ltoAsset].contract]
    else
    path=[ListToken[lfromAsset].contract,ListToken[0].contract,ListToken[ltoAsset].contract]
    // console.log("ok");
    const getAmountOut =await Router.getAmountsOut(BigNumber(value).multipliedBy(BASE18).toFixed(),path);
    
    if(ListToken[lfromAsset].isNative&&!ListToken[ltoAsset].isNative)
    {
      expectedValue = Number(BigNumber(getAmountOut[1]).dividedBy(BASE18));
    }
    else if (!ListToken[lfromAsset].isNative&&ListToken[ltoAsset].isNative)
    {
      const ratio1= BigNumber(getAmountOut[1]).dividedBy(getAmountOut[0]).toFixed();
      // console.log(ratio1);
      const ratio2=BigNumber (getAmountOut[0]).dividedBy(getAmountOut[1]).toFixed();
      // console.log(ratio2);
      if(ratio1<1)
      {
        expectedValue= Number(ratio1)*value;
        // console.log(expectedValue)
      }
      if(ratio2<1)
      {
        expectedValue= Number(ratio2)*value;
        // console.log(expectedValue)
      }
    }
    else{
      expectedValue = Number(BigNumber(getAmountOut[1]).dividedBy(BASE18));

    }
    let r0 = Number(BigNumber(frompool).dividedBy(BASE18));
    //console.log(r0);
    //console.log(value);
    let impact = Number(value)/(Number(value) + r0)
    setToAmount(expectedValue);
    setPriceImpact(impact);
  }
   }
   const debounceFetch = useCallback(debounce(handleDebounceFetch, 500), []);
   function handleFromValueChange(value,lfromAsset,ltoAsset){
    setFromAmount(value);
    //console.log(lfromAsset,ltoAsset)
    debounceFetch(value,lfromAsset,ltoAsset);
   }
   const {isMobile} = useDevice();
   async function handleSwap()
   {
    setIsLoading(true);
    try{
    const deadlineFinal =Math.round(Date.now()/1000) +deadline*60; 
    if(ListToken[fromAsset].isNative&&!ListToken[toAsset].isNative)
    {
      // console.log("Swap ETH for Token",fromAmount)
      await Router.swapExactETHForTokens(provider,BigNumber(fromAmount).multipliedBy(BASE18).toFixed(),BigNumber(Math.floor(BigNumber(Number(toAmount*(100-slippage)/100)).multipliedBy(BASE18).toFixed())).toFixed(),
      [ListToken[fromAsset].contract,ListToken[toAsset].contract],account,deadlineFinal,account
      )
    }
    else if (!ListToken[fromAsset].isNative&&ListToken[toAsset].isNative)
    {
      // console.log("Swap Token for ETH",fromAmount)
      await handleApprove(ListToken[fromAsset].contract,fromAmount);
      // console.log(provider,BigNumber(fromAmount).multipliedBy(BASE18).toFixed(),BigNumber(Number(toAmount*(100-slippage)/100)).multipliedBy(BASE18).toFixed(),
      // [ListToken[fromAsset].contract,ListToken[toAsset].contract],account,deadlineFinal,account);
      // console.log("Approve xong")
      await Router.swapExactTokensForETH(provider,BigNumber(fromAmount).multipliedBy(BASE18).toFixed(),BigNumber(Math.floor(BigNumber(Number(toAmount*(100-slippage)/100)).multipliedBy(BASE18).toFixed())).toFixed(),
      [ListToken[fromAsset].contract,ListToken[toAsset].contract],account,deadlineFinal,account
      )

    }
    else{
      // console.log("Swap Token for Token",fromAmount)
      await handleApprove(ListToken[fromAsset].contract,fromAmount);
      await Router.swapExactTokensForTokens(provider,BigNumber(fromAmount).multipliedBy(BASE18).toFixed(),BigNumber(Math.floor(BigNumber(Number(toAmount*(100-slippage)/100)).multipliedBy(BASE18).toFixed())).toFixed(),
      [ListToken[fromAsset].contract,ListToken[0].contract,ListToken[toAsset].contract],account,deadlineFinal,account
      )
    }
    setIsLoading(false);
    setIsSuccess(true);
    onOpenResult();


  }
  catch(e){
    console.log(e);
    setIsLoading(false);
    setIsSuccess(false);
    onOpenResult();
    

  }
  finally{
    setIsLoading(false);
  }
    
    
   }

    const {isOpen:isOpenCoinDialog,onOpen:onOpenCoinDialog,onClose:onCloseCoinDialog}=useDisclosure();
    
    const {isOpen:isOpenCoinDialog1,onOpen:onOpenCoinDialog1,onClose:onCloseCoinDialog1}=useDisclosure();

    const {isOpen:isOpenResult,onOpen:onOpenResult,onClose:onCloseResult}=useDisclosure();
    const {isOpen:isOpenConfirm,onOpen:onOpenConfirm,onClose:onCloseConfirm}=useDisclosure();
    const disableButton = (fromAmount>listprice[fromAsset]||fromAmount<=0);
    return(
    <>
    <Fade in={true}>
    <Box className="py-8 ">
    <Box className="flex justify-center items-baseline">
      <Box className="bg-[#fff] p-8 min-w-0 sm:3/4 md:w-4/6 lg:w-[600px]" style={{borderRadius: "48px"}}>
          <div className="flex justify-between">
            <Text className="text-2xl font-bold text-[#1E2185]">Swap</Text>
            <img src={settingIcon} width={24} height={24} className="cursor-pointer" onClick={onOpen}></img>
          </div>
          <Divider className="my-4" color="#E5E7EB" border="1px solid"/>
          <FlexC justifyContent="space-between" alignItems="flex-end">
            <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1 ">From</Text>
            <Text className="text-xs text-[#6B7280]">Balance: {listprice[fromAsset].toFixed(2)} {ListToken[fromAsset].name}</Text>
          </FlexC>
          <InputGroup size='sm' className="flex items center w-full py-3 mt-3" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px",backgroundColor:"#FAFAFA"}}>
             <InputLeftAddon  children={
              <div className="flex items-center cursor-pointer gap-2" onClick={onOpenCoinDialog}>
                <img src={ListToken[fromAsset].img} className="w-6 h-6 bg-[#EDF0F4]"style={{borderRadius:"50%"}}></img>
                <span className="text-normal">{ListToken[fromAsset].name}</span>
                <img src={downIcon}  style={{zIndex:1,position:"relative",top:"2px"}}></img>
              </div>
             } />
               <Input type={"number"} className="pr-1 text-right w-5/6 md:flex-1 fontCustom-bold md:w-auto text-[16px]" style={{outline:0,border:0,position:"relative",color:"#1E2185",backgroundColor:"#FAFAFA"}} value={fromAmount} onChange={(e)=>handleFromValueChange(e.target.value,fromAsset,toAsset)}/>
              <InputRightAddon children={<div style={{fontSize:"10px",color:"#6B7280", paddingLeft: "5px"}}>~${Number(listMarketPrice[fromAsset]*fromAmount).toFixed(2)}</div>} />
          </InputGroup>
          <Box className="flex items-center pt-6 pb-5">
          <Divider color="#E5E7EB" border="1px solid" className="flex-1"/>
          <img src={swapIcon} width={36} height={36} className="cursor-pointer" onClick={()=>toggleCoin()}></img>
          <Divider color="#E5E7EB" border="1px solid" className="flex-1"/>
          </Box>

          <FlexC justifyContent="space-between" alignItems="flex-end">
            <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1 ">To</Text>
            <Text className="text-xs text-[#6B7280]">Balance: {listprice[toAsset].toFixed(2)} {ListToken[toAsset].name}</Text>
          </FlexC>
          <InputGroup size='sm' className="flex items center w-full py-3 mt-3" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px",backgroundColor:"#FAFAFA"}}>
             <InputLeftAddon children={
              <div className="flex items-center cursor-pointer gap-2" onClick={onOpenCoinDialog1}>
                <img src={ListToken[toAsset].img} className="w-6 h-6" style={{borderRadius:"50%"}}></img>
                <div className="text-normal" style={{position:"relative"}}>{ListToken[toAsset].name}</div>
                <img src={downIcon}  style={{zIndex:1,position:"relative",top:"2px"}}></img>
              </div>
             } />
               <Input type={"number"} className="pr-1 text-right fontCustom-bold w-5/6 md:flex-1 md:w-auto disabled" style={{outline:0,border:0,position:"relative",color:"#1E2185",backgroundColor:"#FAFAFA"}} value={toAmount}/>
            <InputRightAddon children={<div style={{fontSize:"10px",color:"#6B7280", paddingLeft: "5px"}}>~${Number(listMarketPrice[toAsset]*toAmount).toFixed(2)}</div>} />
          </InputGroup>
          
          <FlexC justifyContent="space-between" alignItems="center" className="pb-3 pt-6">
              <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                Price
                {/* <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                      Add soon
                    </Card>
                  }
                /> */}
              </Text>
              <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>1 {ListToken[fromAsset].name} = {Number(toAmount/fromAmount).toFixed(4)} {ListToken[toAsset].name}</Text>
              
            </FlexC>
            <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
              <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                Expected output
                {/* <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                     Add soon
                    </Card>
                  }
                /> */}
              </Text>
              <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>{Decimal.from(toAmount).prettify(4)} {ListToken[toAsset].name}</Text>
              
            </FlexC>
            <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
              <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                Minimum Receive
                <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                      Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.
                    </Card>
                  }
                  placement={isMobile ? "top": undefined}
                />
              </Text>
              <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>{Decimal.from(Number(toAmount*(100-slippage)/100)).prettify(4)} {ListToken[toAsset].name}</Text>
              
            </FlexC>
            <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
              <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                Price Impact
                <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                      <div>
                      <b>AMM</b>: The difference between the market price and estimated price due to trade size.
                      </div>
                      <div>
                      <b>MM</b>: No slippage against quote from market maker
                      </div>
                    </Card>
                  }
                  placement={isMobile ? "top": undefined}
                />
              </Text>
              <Text className="text-[#22C55E]" style={{fontSize:"18px",color:priceImpact<0.05?"#22C55E":"red"}} >{(priceImpact*100).toFixed(2)}%</Text>
              
            </FlexC>
            <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
              <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1 ">
                Protocol Fee
                {/* <InfoIcon
                  tooltip={
                    <Card sx={{minWidth: '200px'}} style={{ borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                      Add soon
                    </Card>
                  }
                /> */}
              </Text>
              <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>0.03%</Text>
              
            </FlexC>
            {
            fromAmount<listprice[fromAsset]&& priceImpact<0.05&&
            <ActionDescription>
              Be careful of slipage tolerance and high price impact
            </ActionDescription>
            }
            {
            fromAmount>listprice[fromAsset]&&
            <ErrorDescription>
              The amount you're trying to swap exceeds your balance by <b> {Number(fromAmount-listprice[fromAsset]).toFixed(2)} {ListToken[fromAsset].name}</b>
            </ErrorDescription>
            }
            {
               fromAmount<listprice[fromAsset]&&priceImpact>=0.05&&
               <ActionDescription>
                 Price impact too high !
               </ActionDescription>

            }
            
            <Box className="pt-6"></Box>
            <button className="w-full bg-[#1E2185] py-2 mb-4 text-[#fff] animationCustom" style={{borderRadius:"100px",textAlign:"center",fontSize:"18px"}} onClick={()=>onOpenConfirm()} disabled={disableButton}>
              Swap
            </button>
      </Box>
    </Box>
    
  </Box>
  <SettingDialog isOpen={isOpen} onClose={onClose} slippage={slippage} setSlippage={setSlippage} setDeadline={setDeadline} deadline={deadline}></SettingDialog>
  <CoinDialog isOpen={isOpenCoinDialog} onClose={onCloseCoinDialog} removeIdx={toAsset} chosenIdx={fromAsset} setIdx={setFromAsset} listprice={listprice}></CoinDialog>
  <CoinDialog isOpen={isOpenCoinDialog1} onClose={onCloseCoinDialog1} removeIdx={fromAsset} chosenIdx={toAsset} setIdx={setToAsset} listprice={listprice}></CoinDialog>
  {isLoading&&<LoadingOverlay fromAmount={fromAmount} fromName={ListToken[fromAsset].name} toAmount={toAmount} toName={ListToken[toAsset].name}></LoadingOverlay>}
  <ResultDialog isSuccess={isSuccess} isOpen={isOpenResult} onClose={onCloseResult}></ResultDialog>
  <ConfirmDialog isOpen={isOpenConfirm} onClose={onCloseConfirm} fromAsset={fromAsset} toAsset={toAsset} toAmount={toAmount} fromAmount={fromAmount} slippage={slippage} priceImpact={priceImpact} deadline={deadline} handleSwap={handleSwap}></ConfirmDialog>
  </Fade>
  </>
    )
}
export default Swapping;
