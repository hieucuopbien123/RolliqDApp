import React, { useCallback, useState } from "react";
import { Text, Flex as FlexC, Tabs, TabList, Tab, TabPanels, TabPanel, Box, Fade } from "@chakra-ui/react";
import { AiOutlineClose } from "react-icons/ai";
import { useTroveView } from "../../components/Trove/context/TroveViewContext";
import { TroveSupply } from "./TroveSupply";
import { TroveWithdraw } from "./TroveWithdraw";
import { TroveBorrow } from "./TroveBorrow";
import { TrovePayback } from "./TrovePayback";

export const Adjusting = () => {
  const { dispatchEvent } = useTroveView();
  const [tabIndex, setTabIndex] = useState(0)

  const handleCancelPressed = useCallback(() => {
    dispatchEvent("CANCEL_ADJUST_TROVE_PRESSED");
  }, [dispatchEvent]);

  return (
    <Fade in={true}>
    <Box className="py-10">
      <Box className="flex justify-center">
        <Box className="bg-[#fff] p-8 min-w-0 sm:w-full lg:w-[808px]" style={{borderRadius: "48px"}}>
          <div className="flex justify-between gap-3">
            <Box className="flex">
              <Text className="text-[24px] fontCustom-bold text-[#1E2185]" style={{minHeight: "40px", lineHeight: "25px", paddingTop: "3px", paddingBottom: "20px"}}>Make changes to your trove</Text>
            </Box>
            <Box>
              <AiOutlineClose onClick={handleCancelPressed} size={"20px"}/>
            </Box>
          </div>
          <div className="py-1"></div>
          <Tabs variant='soft-rounded' isFitted colorScheme='green' onChange={(index) => setTabIndex(index)}>
            <TabList style={{justifyContent: "space-around", backgroundColor: "#E5E7EB", borderRadius: "20px"}}>
              <Tab style={{borderRadius: "20px"}} className="py-2 text-[16px] max-[500px]:text-[14px] fontCustom-bold flex-grow" _selected={{bg: "#1E2185", color: "white"}}>Supply</Tab>
              <Tab style={{borderRadius: "20px"}} className="py-2 text-[16px] max-[500px]:text-[14px] fontCustom-bold flex-grow" _selected={{bg: "#1E2185", color: "white"}}>Withdraw</Tab>
              <Tab style={{borderRadius: "20px"}} className="py-2 text-[16px] max-[500px]:text-[14px] fontCustom-bold flex-grow" _selected={{bg: "#1E2185", color: "white"}}>Borrow</Tab>
              <Tab style={{borderRadius: "20px"}} className="py-2 text-[16px] max-[500px]:text-[14px] fontCustom-bold flex-grow" _selected={{bg: "#1E2185", color: "white"}}>Payback</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <TroveSupply/>
              </TabPanel>
              <TabPanel>
                <TroveWithdraw/>
              </TabPanel>
              <TabPanel>
                <TroveBorrow/>
              </TabPanel>
              <TabPanel>
                <TrovePayback/>
              </TabPanel>
            </TabPanels>
          </Tabs>
          {/* {isTransactionPending && <LoadingOverlay />} */}
        </Box>
      </Box>
    </Box>
    </Fade>
  );
};