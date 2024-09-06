import React from "react";
import { Icon } from "../../components/WalletConnector/Icon";
import { Tooltip } from "../../components/Trasaction/Tooltip";
import excl from "./assets/excl.png";

export const InfoIcon = ({
  link,
  placement = "right",
  tooltip,
  size = "1x"
}) => {
  return (
    <Tooltip message={tooltip} placement={placement} link={link}>
      <img src={excl} style={{width: "14px"}}/>
    </Tooltip>
  );
};
