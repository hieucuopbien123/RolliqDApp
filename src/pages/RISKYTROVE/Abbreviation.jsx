import React from "react";
import { Box } from "theme-ui";

export const Abbreviation = ({ children, short, ...boxProps }) => (
  <Box as="span" {...boxProps}>
    <Box as="span" sx={{ display: ["none", "unset"] }}>
      {children}
    </Box>

    <Box as="span" sx={{ display: ["unset", "none"] }}>
      {short}
    </Box>
  </Box>
);
