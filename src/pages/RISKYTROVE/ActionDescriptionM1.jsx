import { Box, Flex, Text } from "theme-ui";

import { Icon } from "../../components/WalletConnector/Icon";

export const ActionDescriptionM1 = ({ children }) => (
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
    <Flex sx={{ alignItems: "center" }}>
      <Icon name="info-circle" size="md" style={{color:"#D97706"}}/>
      <Text sx={{ ml: 2 ,color:"#D97706",fontSize:"12px"}}>{children}</Text>
    </Flex>
  </Box>
);

export const Amount = ({ children }) => (
  <Text sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>{children}</Text>
);