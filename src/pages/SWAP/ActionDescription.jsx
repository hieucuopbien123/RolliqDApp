import { Box, Flex, Text } from "theme-ui";

import exclO from "./assets/exclOrange.png";

export const ActionDescription = ({ children }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",

      p: 2,
      borderRadius: "4px",
      bg: "#FEF3C7"
    }}
  >
    <Flex sx={{ alignItems: "flex-start"}}>
      <img src={exclO} style={{paddingTop: "2px"}}/>
      <Text sx={{ ml: 2 , color:"#D97706", fontSize:"12px"}} className="fontCustom-Medium">{children}</Text>
    </Flex>
  </Box>
);
