import React from "react";
import logo from "./assets/logo.png";
import router from "../../configs/router.js";
import { NavLink } from "react-router-dom";
import { Icon } from "../WalletConnector/Icon";
import { Flex, Heading, Text } from "theme-ui";
import { shortenAddress } from "../../utils/shortenAddress";
import { useWeb3React } from "@web3-react/core";
import { useRolliq } from "../../hooks/RolliqContext";
import MenuDrawer from "./MenuDrawer";

const NavBar = () => {
  const { account } = useRolliq();
  const { deactivate } = useWeb3React();

  return (
    <>
      <div className="flex mx-auto justify-around py-3 items-center gap-2 max-[1100px]:hidden">
        <img src={logo}/>
        <div className="flex gap-7">
          {
            router.map(route => (
              <NavLink
                key={route.path}
                className={({ isActive }) => (isActive ? "text-[#1E2185] whitespace-nowrap text-[16px] fontCustom-bold" : "whitespace-nowrap text-[#8E90C2] text-[16px] fontCustom-bold")}
                to={route.path}
              >
                {route.title}
              </NavLink>
            ))
          }
        </div>
        <Flex sx={{ alignItems: "center" }}>
          <Icon name="user-circle" size="lg" />
          <Flex sx={{ ml: 3, mr: 4, flexDirection: "column" }}>
            <Heading sx={{ fontSize: 1 }}>Connected as</Heading>
            <Text as="span" sx={{ fontSize: 1 }}>
            {shortenAddress(account)}
            &nbsp;
            &nbsp;
            <span onClick={() => deactivate()} style={{cursor: 'pointer'}}>
              <Icon name="times-circle" />
            </span>
            </Text>
          </Flex>
        </Flex>
      </div>
      <div className="flex container mx-auto px-3 justify-between py-3 items-center gap-2 min-[1100px]:hidden">
        <img src={logo}/>
        <MenuDrawer/>
      </div>
    </>
  )
}

export default NavBar;