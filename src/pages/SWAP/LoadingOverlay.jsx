import React from "react";
import { Container, Box, Text, Divider } from "theme-ui";
import LoadingGif from "./assets/loading.gif"
import { Fade } from "@chakra-ui/react";

export const LoadingOverlay = ({fromAmount,fromName,toAmount,toName}) => (
  <Fade in={true}>
  <Container
    variant="modalOverlay"
    sx={{ p: "14px", display: "flex", justifyContent: "center", background: "rgba(0, 0, 0, 0.5)" }}
  >
    <Box className="py-10" style={{ width: "600px", paddingTop: "112px" }}>
      <Box className="bg-[#fff] p-8 rounded-3xl shadow-md text-center">
        <Box marginBottom="32px">
          <Text className="text-2xl text-[#1E2185] font-semibold">Confirm Swap</Text>
        </Box>
        <Box sx={{ my: "24px" }}>
          <Divider color="#E5E7EB" />
        </Box>
        <Box className="flex justify-center">
          <img src={LoadingGif} />
        </Box>
        <Box>
        <Text className="pb-2 font-bold" style={{fontSize:"20px",color:"#1E2185"}}>Waiting for Confirmation</Text>
        </Box>
        <Box>
        <Text className="pb-2 font-bold" style={{fontSize:"16px",color:"#1E2185"}}>Swapping {fromAmount} {fromName} for {toAmount} {toName}</Text>
        </Box>
        <Text>Please approve this transaction in your wallet</Text>
      </Box>
    </Box>
  </Container></Fade>
);
