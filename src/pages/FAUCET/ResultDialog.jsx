import { Box, Container } from "theme-ui";
import { Divider,Fade,Flex,Text } from "@chakra-ui/react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,

  } from '@chakra-ui/react'
  import failIcon from "./assets/fail.svg";
  import successIcon from "./assets/success.svg";

const ResultDialog = ({isSuccess,isOpen,onClose})=>{

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
        overflow: "hidden",
      }}
      backgroundColor="rgba(0, 0, 0, 0.5)"
    >
        <Box className="py-8 " onClick={onClose}>
            <Box className="block justify-center md:flex">
                <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md md:w-4/6 lg:w-[400px]">
                    {/* <div className="flex"> */}
                    <Text className="text-[24px] fontCustom-bold text-[#1E2185] text-center">Faucet ETH</Text>
                    {/* <Text className="cursor-pointer" onClick={onClose}>x</Text> */}
                    {/* </div> */}
                    <Divider className="mt-6" color="#E5E7EB" border="1px solid"/>
                    <Box className="pt-6"></Box>
                    <Box className="flex justify-center items-center">
                        <img src={isSuccess?successIcon:failIcon}></img>
                    </Box>
                    <Box className="pb-6"></Box>
                    <Box className="flex justify-center items-center">
                        <Text className="fontCustom-bold" style={{color:isSuccess?"#22C55E":"#EF4444"}}>{isSuccess?"Faucet successfully. You got 0.01 ETH":"Faucet failed"}</Text>
                    </Box>
                </Box>
            </Box>
        </Box>
      </Flex>
      </Fade>
    )
}
export default ResultDialog;
