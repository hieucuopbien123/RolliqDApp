import { Box, Flex, Text } from "theme-ui";
import exclR from "./assets/exclRed.png";

export const ErrorDescription = ({ children }) => (
  <>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        // border: 1,
        borderRadius: "4px",
        borderColor: "danger",
        // boxShadow: 2,
        bg: "#FEE2E2",
        p: 2,
      }}
    >
      <Flex sx={{ alignItems: "flex-start"}}>
        <img src={exclR} style={{paddingTop: "2px"}}/>
        <Text sx={{ ml: 2 ,color:"#DC2626",fontSize:"12px"}}>{children}</Text>
      </Flex>
    </Box>
    <div className="pb-1"></div>
  </>
);
