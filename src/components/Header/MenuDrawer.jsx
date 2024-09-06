import { AiOutlineMenu } from "react-icons/ai";
import { IconButton, Text, useDisclosure, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay } from "@chakra-ui/react";
import React from "react";
import { Box, Flex, Heading } from "theme-ui";
import { NavLink } from "react-router-dom";
import router from "../../configs/router.js";
import { Icon } from "../WalletConnector/Icon";
import { shortenAddress } from "../../utils/shortenAddress";
import { useRolliq } from "../../hooks/RolliqContext";
import { useWeb3React } from "@web3-react/core";

const MenuDrawer = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { account } = useRolliq();
  const { deactivate } = useWeb3React();
  return (
    <>
      <IconButton
        aria-label="Open drawer"
        bg="transparent"
        variant="outline"
        onClick={onOpen}
        icon={<AiOutlineMenu />}
      />
      <Drawer isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay bgColor="white"/>
        <DrawerContent>
          <DrawerCloseButton style={{justifyContent: "flex-end", padding: "20px"}}/>
          <DrawerBody>
            <Text className="font-bold text-3xl text-center text-[#1E2185]">Rolliq</Text>
            <Box py={20}></Box>
            <div className="flex flex-col gap-2 items-center">
            {
              router.map(route => (
                <NavLink
                  key={route.path}
                  className={({ isActive }) => (isActive ? "text-[#1E2185] text-lg font-semibold whitespace-nowrap" : "text-lg whitespace-nowrap font-semibold text-[#8E90C2]")}
                  to={route.path}
                  onClick={() => onClose()}
                >
                  {route.title}
                </NavLink>
              ))
            }
            </div>
            <Box py={20}></Box>
            <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
              <Flex sx={{ ml: 3, mr: 4, flexDirection: "column" }}>
                <Heading sx={{ fontSize: 1 }}>Wallet</Heading>
                <span>
                {shortenAddress(account)}
                &nbsp;
                &nbsp;
                <span onClick={() => deactivate()} style={{cursor: 'pointer'}}>
                  <Icon name="times-circle" />
                </span>
                </span>
              </Flex>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
};

export default MenuDrawer;
