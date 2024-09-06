import Tippy from "@tippyjs/react";
import React from "react";
import { Box, Card, Link } from "theme-ui";
import { Icon } from "../WalletConnector/Icon";

export const LearnMoreLink = ({ link }) => {
  return (
    <Link href={link} target="_blank">
      Learn more <Icon size="xs" name="external-link-alt" />
    </Link>
  );
};

export const Tooltip = ({ children, message, placement = "top", link }) => {
  return (
    <Tippy
      interactive={true}
      placement={placement}
      content={
        <Card sx={{minWidth: '200px'}} variant="tooltip">
          {message}
          {link && (
            <Box mt={1}>
              <LearnMoreLink link={link} />
            </Box>
          )}
        </Card>
      }
    >
      <span>{children}</span>
    </Tippy>
  );
};
