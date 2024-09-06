import React, { useState } from "react";
import { Card, Box, Flex, Button, Label, Input } from "theme-ui";
import { Input as InputC, InputGroup, InputRightElement, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Text } from "@chakra-ui/react";

import { useRolliq } from "../../hooks/RolliqContext";
import { Transaction } from "../../components/Trasaction";

export const LiquidationManager = () => {
  const {
    rolliq: { send: rolliq }
  } = useRolliq();
  const [numberOfTrovesToLiquidate, setNumberOfTrovesToLiquidate] = useState("90");
  return (
    <Box>
      <Flex className="gap-5 items-center">
        {/* <Input
          type="number"
          min="1"
          step="1"
          value={numberOfTrovesToLiquidate}
          onChange={e => setNumberOfTrovesToLiquidate(e.target.value)}
        />
        <Label>Troves</Label> */}

        <Box style={{minHeight: "40px", position: "relative"}}>
          {/* <InputC onChange={e => changeInput} className="bg-[#FAFAFA] rounded-lg" placeholder="Enter a number" style={{outline: 0, border: "1px solid", paddingRight: "70px", paddingLeft: "10px"}} value={numberOfTrovesToLiquidate}/> */}
          <NumberInput defaultValue={""} min={1} max={100}>
            <NumberInputField onChange={(valueString) => setNumberOfTrovesToLiquidate(valueString)} value={numberOfTrovesToLiquidate} className="bg-[#FAFAFA] rounded-lg" placeholder="Enter a number" style={{outline: 0, border: "1px solid #D4D4D4", paddingRight: "70px", paddingLeft: "10px", paddingTop: "8px", paddingBottom: "8px"}}/>
          </NumberInput>
          <Text style={{position: "absolute", right: "10px", top: "8px"}}>Troves</Text>
        </Box>

          <Transaction
            id="batch-liquidate"
            tooltipPlacement="bottom"
            send={overrides => {
              if (!numberOfTrovesToLiquidate) {
                throw new Error("Invalid number");
              }
              return rolliq.liquidateUpTo(parseInt(numberOfTrovesToLiquidate, 10), overrides);
            } } showFailure={undefined} requires={undefined}
            topmessage="Confirm liquidate"
          >
            <Button style={{backgroundColor: "transparent", color: "#1E2185", borderRadius: "20px", paddingTop: "5px", paddingBottom: "5px", paddingLeft: "25px", paddingRight: "25px", marginRight: "5px"}} className="fontCustom-bold text-[18px] animationCustom">
              Liquidate
            </Button>
          </Transaction>
      </Flex>
    </Box>
  );
};
