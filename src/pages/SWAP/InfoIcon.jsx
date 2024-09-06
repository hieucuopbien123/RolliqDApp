import React from "react";
import { Icon } from "../../components/WalletConnector/Icon";
import { Tooltip } from "../../components/Trasaction/Tooltip";

export const InfoIcon = ({
  link,
  placement = "right",
  tooltip,
  size = "1x"
}) => {
  return (
    <Tooltip message={tooltip} placement={placement} link={link}>
      &nbsp;
      <Icon name="exclamation-circle" size={size} style={undefined} className="text-gray-500" />
    </Tooltip>
  );
};
