import React from "react";
import { Container, Box, Text, Divider } from "theme-ui";
import LoadingGif from "./assets/loading.gif"

export const LoadingOverlay = () => (
  <Container
    variant="disabledOverlay"
    sx={{ p: "14px", display: "flex", justifyContent: "center", background: "rgba(0, 0, 0, 0.5)" }}
  >
    <Box className="py-10" style={{ width: "600px", paddingTop: "112px" }}>
      <Box className="bg-[#fff] p-8 rounded-3xl shadow-md text-center">
        <Box marginBottom="32px">
          <Text className="text-2xl text-[#1E2185] font-semibold">Supplying 200 ETH</Text>
        </Box>
        <Box sx={{ my: "24px" }}>
          <Divider color="#E5E7EB" />
        </Box>
        <Box className="flex justify-center">
          <img src={LoadingGif} />
        </Box>
        <Text>Please approve this transaction in your wallet</Text>
      </Box>
    </Box>
  </Container>
);
