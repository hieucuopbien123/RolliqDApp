import { Box, Flex, Heading, Text } from "theme-ui";

export const InfoMessage = ({ title, children, icon }) => (
  <Box sx={{ mx: 1, mb: 3 }}>
    <Flex sx={{ alignItems: "center", mb: "10px" }}>
      {icon ? <Box sx={{ mr: "12px", fontSize: "20px" }}>{icon}</Box> : ''}
    
      <Heading as="h3">{title}</Heading>
    </Flex>

    <Text sx={{ fontSize: 2 }}>{children}</Text>
  </Box>
);
