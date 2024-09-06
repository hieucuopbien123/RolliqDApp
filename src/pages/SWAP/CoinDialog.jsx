import React,{useState} from "react";
import { Box } from "theme-ui";
import { Flex as FlexC} from "@chakra-ui/react"
import { Divider, Text } from "@chakra-ui/react";
import { InputGroup,Input,InputLeftAddon,InputRightAddon ,InputRightElement,Button} from "@chakra-ui/react";
import { Card ,Container} from "theme-ui";
import { InfoIcon } from "./InfoIcon";
import { useDisclosure, Fade } from "@chakra-ui/react";
import { ActionDescription } from "./ActionDescription";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,

  } from '@chakra-ui/react'
  import closeIcon from "./assets/close.svg";
  import searchIcon from "./assets/search.svg";
  import ETH from "./assets/ETH.png";
import USD from "./assets/USD.png";
import swapIcon from "./assets/swap.png";

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
const CoinDialog=({isOpen,onClose,removeIdx,chosenIdx,setIdx,listprice})=>{
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
        overflow: "hidden",
      }}
      backgroundColor="rgba(0, 0, 0, 0.5)"
    >
        <Box className="py-8">
          <Box className="block md:flex justify-center">
            <Box className="bg-[#fff] p-8 sm:w-[500px] md:w-[600px]" style={{borderRadius: "48px", minWidth: "350px"}}>
                <div className="flex justify-between">
                  <Text className="text-2xl font-bold text-[#1E2185]">Select a Token</Text>
                  <img src={closeIcon} className="cursor-pointer" onClick={onClose}></img>
                </div>
                <InputGroup className=" flex justify-between py-2 px-3 mt-6" style={{ border: "1px solid #D4D4D4", borderRadius: "48px",flex:25}}>
                      {/* <Input className="pr-1 flex-1" /> */}
                      <InputLeftAddon className="text-xs md:text-base font-bold"><img src={searchIcon}></img></InputLeftAddon>
                      <Input placeholder="Search by name ,token or address" className="flex-1 text-xs md:text-base mx-3" style={{border:0,outline:0,padding:0}}
                       />
                      
                    </InputGroup>
                    <Box className="pt-6"></Box>
                    <Text className="text-[#1E2185] text-sm font-bold">Common token</Text>
                    <Box className="pt-2"></Box>
                    <div className="flex flex-wrap gap-3">
                    {
                        ListToken.map((el,idx)=>{
                            return(
                            idx!=removeIdx&&<div key={idx} className="flex justify-between items-center py-2 px-4 cursor-pointer" style={{border:"1px solid #E5E7EB",borderRadius:"21px",backgroundColor:idx==chosenIdx?"#E5E7EB":"unset"}} onClick={()=>{setIdx(idx);onClose()}}>
                                <img src={el.img} width={24} height={24} className="mr-2"></img>
                                <Text>{el.name}</Text>
                            </div>
                            )
                        })
                    }
                    </div>
                    <Box className="pt-6"></Box>
                    <Box style={{maxHeight:"300px",overflowY:"auto"}}  sx={{
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#D4D4D4",
              },
              "&::-webkit-scrollbar": {
                width: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                borderRadius: "10px",
                backgroundColor: "#E5E7EB",
              },
            }}>
                    {
                       ListToken.map((el,idx)=>{
                            return(
                            <div key={idx} className="flex justify-between items-center py-2 px-4 " >
                                <Box className="flex items-center">
                                    <img src={el.img} width={24} height={24} className="mr-4"></img>
                                    <Box>
                                        <Text className="text-[#1E2185] ">{el.name}</Text>
                                        <Text className="text-sm text-[#4B5563]"> {el.name} </Text>
                                    </Box>

                                </Box>
                                <Text className="text-[#1E2185] text-sm font-bold">{listprice[idx].toFixed(5)}</Text>

                            </div>
                            )
                        })
                    }

                    </Box>
                    <Box className="text-center pt-6 text-[#1E2185] text-xl fontCustom-bold">Manage Tokens</Box>

                
                
            </Box>
          </Box>
        </Box>
        </FlexC>
        </Fade>
    );
}
export default CoinDialog;