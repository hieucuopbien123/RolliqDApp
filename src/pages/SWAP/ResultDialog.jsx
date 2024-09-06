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
            overflow: "hidden"
          }}
          backgroundColor="rgba(0, 0, 0, 0.5)"
        >
        
        <Box className="py-8" onClick={onClose}>
            <Box className="block justify-center md:flex">
                <Box className="bg-[#fff] p-8 rounded-3xl min-w-0 shadow-md md:w-4/6 lg:w-[600px]">
                    <div className="flex justify-center">
                    <Text className="text-2xl font-bold text-[#1E2185]">Confirm Swap</Text>
                    </div>
                    <Divider className="mt-6" color="#E5E7EB" border="1px solid"/>
                    <Box className="pt-6"></Box>
                    <Box className="flex justify-center items-center">
                        <img src={isSuccess?successIcon:failIcon}></img>
                    </Box>
                    <Box className="pt-5 flex justify-center items-center">
                    <Text style={{color:isSuccess?"#22C55E":"#EF4444"}}>Transaction {isSuccess?"successful":"rejected"}</Text>
                    </Box>
                </Box>
            </Box>
        </Box>
        </Flex></Fade>
    )
}
export default ResultDialog;
