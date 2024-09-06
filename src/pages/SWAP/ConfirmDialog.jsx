import React,{useState,useCallback, useEffect} from "react";
import { Box } from "theme-ui";
import { color, Fade, Flex as FlexC, useEditable} from "@chakra-ui/react"
import { Divider, Text } from "@chakra-ui/react";
import { InputGroup,Input,InputLeftAddon,InputRightAddon } from "@chakra-ui/react";
import { Card ,Container} from "theme-ui";
import { InfoIcon } from "../TROVE/InfoIcon";
import ETH from "./assets/ETH.png";
import USD from "./assets/USD.png";
import toIcon from "./assets/to.png";
import swapIcon from "./assets/swap.png"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,

} from '@chakra-ui/react'
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

const ConfirmDialog = ({isOpen,onClose,fromAmount,fromAsset,toAsset,toAmount,slippage,priceImpact,deadline,listPrice,handleSwap})=>{
   function handleConfirm(){
    onClose();
    handleSwap();

   }
   if(!isOpen) return null;
    return(
      <Fade  in={isOpen} >
      <FlexC
      sx={{
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        pl: 4,
        position: "fixed",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        overflow: "hidden"
      }}
      backgroundColor="rgba(0, 0, 0, 0.5)"
    >

    <Box className="py-8 ">
    <Box className="flex justify-center items-baseline">
      <Box className="bg-[#fff] min-w-0 md:w-[600px]" style={{borderRadius: "48px"}}>
          <div className="flex justify-between px-8 pt-8 pb-1">
            <Text className="text-[24px] fontCustom-bold text-[#1E2185]">Confirm Swap</Text>
            <div className="cursor-pointer text-2xl" onClick={onClose} >&times;</div>
          </div>

          <div className="p-7">
            <div className="p-2" style={{overflowY: "auto", maxHeight: "80vh", overscrollBehavior: "contain"}}>
              <Divider className="mb-4" color="#E5E7EB" border="1px solid"/>
              <InputGroup size='sm' className="flex items center w-full py-3 mt-3" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px",backgroundColor:"#FAFAFA"}}>
                 <InputLeftAddon style={{backgroundColor:"#FAFAFA"}} children={
                  <div className="flex items-center cursor-pointer " style={{backgroundColor:"#FAFAFA"}}>
                    <img src={ListToken[fromAsset].img} className="w-6 h-6 bg-[#FAFAFA] mr-2"style={{borderRadius:"50%"}}></img>
                    <span className="fontCustom-bold text-[#1E2185]">{fromAmount}</span>
                  </div>
                 } />
                   <Input disabled type={"number"} className="pr-1 text-right w-5/6 md:flex-1 md:w-auto" style={{outline:0,border:0,position:"relative",bottom:"2px",color:"#1E2185",backgroundColor:"#FAFAFA"}} />
                  <InputRightAddon style={{backgroundColor:"#FAFAFA"}} children={<div style={{fontSize:"16px",color:"#6B7280"}}>{ListToken[fromAsset].name}</div>} />
              </InputGroup>
              <Box className="flex items-center py-6">
              <Divider color="#E5E7EB" border="1px solid" className="flex-1"/>
              <img src={toIcon} width={36} height={36}></img>
              <Divider color="#E5E7EB" border="1px solid" className="flex-1"/>
              </Box>
              <InputGroup size='sm' className="flex items center w-full py-3 mt-3" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px",backgroundColor:"#FAFAFA"}}>
                 <InputLeftAddon style={{backgroundColor:"#FAFAFA"}} children={
                  <div className="flex items-center cursor-pointer " style={{backgroundColor:"#FAFAFA"}}>
                    <img src={ListToken[toAsset].img} className="w-6 h-6 bg-[#FAFAFA] mr-2"style={{borderRadius:"50%"}}></img>
                    <span className="fontCustom-bold text-[#1E2185]">{toAmount}</span>
                  </div>
                 } />
                   <Input disabled type={"number"} className="pr-1 text-right w-5/6 md:flex-1 md:w-auto" style={{outline:0,border:0,position:"relative",bottom:"2px",color:"#1E2185",backgroundColor:"#FAFAFA"}} />
                  <InputRightAddon style={{backgroundColor:"#FAFAFA"}} children={<div style={{fontSize:"16px",color:"#6B7280"}}>{ListToken[toAsset].name}</div>} />
              </InputGroup>
              <FlexC justifyContent="space-between" alignItems="center" className="pb-3 pt-6">
                  <Text className="text-[#1E2185] fontCustom-bold">
                    Slippage tolerance
                  </Text>
                  <Text className="text-[#1E2185]" style={{fontSize:"18px"}}>{slippage}%</Text>
              
                </FlexC>
              
                <Divider className="my-4" color="#E5E7EB" border="1px solid"/>
              <FlexC justifyContent="space-between" alignItems="center" className="pb-3 pt-6">
                  <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                    Price
                    <InfoIcon
                      tooltip={
                        <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                          ...
                        </Card>
                      }
                    />
                  </Text>
                  <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>1 {ListToken[fromAsset].name} = {Number(toAmount/fromAmount).toFixed(4)} {ListToken[toAsset].name}</Text>
              
                </FlexC>
                <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
                  <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                    Expected output
                    <InfoIcon
                      tooltip={
                        <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                          ...
                        </Card>
                      }
                    />
                  </Text>
                  <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>{toAmount.toFixed(4)} {ListToken[toAsset].name}</Text>
              
                </FlexC>
                <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
                  <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                    Minimum receive
                    <InfoIcon
                      tooltip={
                        <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                          Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.
                        </Card>
                      }
                    />
                  </Text>
                  <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>{Number(toAmount*(100-slippage)/100).toFixed(4)} {ListToken[toAsset].name}</Text>
              
                </FlexC>
                <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
                  <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1">
                    Price impact
                    <InfoIcon
                      tooltip={
                        <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                          <div>
                          <b>AMM</b>: The difference between the market price and estimated price due to trade size.
                          </div>
                          <div>
                          <b>MM</b>: No slippage against quote from market maker
                          </div>
                        </Card>
                      }
                    />
                  </Text>
                  <Text className="text-[#22C55E]" style={{fontSize:"18px",color:priceImpact<0.05?"#22C55E":"red"}} >{(priceImpact*100).toFixed(2)}%</Text>
              
                </FlexC>
                <FlexC justifyContent="space-between" alignItems="center" className="pb-3">
                  <Text className="text-[#1E2185] fontCustom-bold flex items-center gap-1 ">
                    Network fee
                    <InfoIcon
                      tooltip={
                        <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                          ...
                        </Card>
                      }
                    />
                  </Text>
                  <Text className="text-[#6B7280]" style={{fontSize:"18px"}}>0.03%</Text>
                </FlexC>
                <Box className="pt-6"></Box>
                <button className="w-full bg-[#1E2185] py-2 mb-4 text-[#fff] animationCustom" style={{borderRadius:"100px",textAlign:"center",fontSize:"18px"}}  onClick={()=>{handleConfirm()}}>
                  Swap
                </button>
            </div>
          </div>
      </Box>
    </Box>
    
    </Box>
    </FlexC></Fade>
  )
}
export default ConfirmDialog;
