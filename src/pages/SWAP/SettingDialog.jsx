import React,{useState} from "react";
import { Box } from "theme-ui";
import { Fade, Flex, Flex as FlexC} from "@chakra-ui/react"
import { Divider, Text } from "@chakra-ui/react";
import { InputGroup,Input,InputLeftAddon,InputRightAddon ,InputRightElement,Button} from "@chakra-ui/react";
import { Card ,Container} from "theme-ui";
import { InfoIcon } from "../TROVE/InfoIcon";
import { useDisclosure } from "@chakra-ui/react";
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
  import USD from "./assets/USD.png";
  import closeIcon from "./assets/close.svg";
const listSlipage=[0.1,0.5,1];
const SettingDialog=({isOpen,onClose,slippage,setSlippage,deadline,setDeadline})=>{
  if(!isOpen) return null;
  return(
    <Fade  in={isOpen} >
    <Flex
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
      <Box className="py-8">
        <Box className="flex justify-center">
          <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md md:w-[600px]">
              <div className="flex justify-between">
                <Text className="text-2xl fontCustom-bold text-[#1E2185]">Setting</Text>
                <img src={closeIcon} className="cursor-pointer" onClick={onClose}></img>
              </div>
              <Divider className="my-4" color="#E5E7EB" border="1px solid"/>
              <FlexC justifyContent="space-between" alignItems="flex-end">
                <Text className="text-[#1E2185] fontCustom-bold">Slippage tolerance</Text>
                <InfoIcon
                placement="left"
                tooltip={
                  <Card sx={{minWidth: '200px'}} style={{borderRadius: "10px", color: "white", padding: "10px"}} variant="tooltip">
                    Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Use with caution
                  </Card>
                }
                />
              
              </FlexC>
              <Box className="py-2"></Box>
              <Box className="flex justify-between w-full items-center gap-3">
                  {
                      listSlipage.map((el,idx)=>{
                          return(
                              <Box
                              key={idx} 
                              className="py-2 px-4 flex justify-center items-center cursor-pointer text-xs md:text-base fontCustom-bold"
                                style={{border:"1px solid #E5E7EB",borderRadius:"48px",backgroundColor:slippage==el?"#E5E7EB":"unset",flex:19}}
                                onClick={()=>setSlippage(el)}>
                                  {el}% 
                              </Box>
                          )
                      })
                  }
                  <InputGroup className=" flex justify-between py-2 px-3" style={{ border: "1px solid #D4D4D4", borderRadius: "48px",flex:25}}>
                    {/* <Input className="pr-1 flex-1" /> */}
                    <Input value={slippage} className="w-2/3 text-xs md:text-base fontCustom-bold" style={{border:0,outline:0,padding:0}}
                    onChange={(e)=>setSlippage(Number(e.target.value))} />
                    <InputRightAddon className="text-xs md:text-base fontCustom-bold">%</InputRightAddon>
                  </InputGroup>
                  
              </Box>
              <Text className="text-[#1E2185] fontCustom-bold py-6">Transaction deadline</Text>
              <InputGroup className=" flex justify-between py-4 px-4" style={{ border: "1px solid #D4D4D4"}}>
                    <Input value={deadline} className="w-3/4 text-[#1E2185] fontCustom-bold" style={{border:0,outline:0,padding:0}} onChange={(e)=>setDeadline(Number(e.target.value))}/>
                    <InputRightAddon className="text-[#6B7280] fontCustom-bold">minutes</InputRightAddon>
              </InputGroup>
              <Box className="pt-6"></Box>
              <button className="w-full fontCustom-bold bg-[#1E2185] py-2 mb-4 text-[#fff] animationCustom" style={{borderRadius:"100px",textAlign:"center",fontSize:"18px"}} onClick={onClose}>
                Done
              </button>
              
              
          </Box>
        </Box>
      </Box>
    </Flex ></Fade>
  );
}
export default SettingDialog;