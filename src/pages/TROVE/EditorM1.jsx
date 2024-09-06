import { InputGroup, InputLeftAddon, InputRightAddon, Text as TextC, Input as InputC } from "@chakra-ui/react";
import React, { useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";

import {Icon} from "../../components/WalletConnector/Icon";

export const RowM1 = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
  return (
    <Flex sx={{ alignItems: "stretch", position: "relative", width: "100%", ...sx }}>
      {/* <Label
        id={labelId}
        htmlFor={labelFor}
        sx={{
          p: 0,
          pl: 3,
          pt: "12px",
          position: "absolute",
          fontSize: 1,
          border: 1,
          borderColor: "transparent"
        }}
      >
        <Flex sx={{ alignItems: "center" }}>
          {label}
          {infoIcon && infoIcon}
        </Flex>
      </Label> */}
      {children}
    </Flex>
  );
};

const PendingAmountM1 = ({ sx, value }) => (
  <Text {...{ sx }}>
    (
    {value === "++" ? (
      <Icon name="angle-double-up" />
    ) : value === "--" ? (
      <Icon name="angle-double-down" />
    ) : value?.startsWith("+") ? (
      <>
        <Icon name="angle-up" /> {value.substr(1)}
      </>
    ) : value?.startsWith("-") ? (
      <>
        <Icon name="angle-down" /> {value.substr(1)}
      </>
    ) : (
      value
    )}
    )
  </Text>
);

export const StaticAmountsM1 = ({
  sx,
  inputId,
  labelledBy,
  amount,
  unit,
  color,
  pendingAmount,
  pendingColor,
  onClick,
  children
}) => {
  return (
    <Flex
      id={inputId}
      aria-labelledby={labelledBy}
      {...{ onClick }}
      sx={{
        justifyContent: "flex-end",
        alignItems: "center",

        ...(onClick ? { cursor: "text" } : {}),

        ...staticStyleM1,
        ...sx,
        backgroundColor: "#FAFAFA"
      }}
    >
      {amount && (
        <Flex sx={{ justifyContent: "flex-end" }}>
          <TextC className="text-[16px] text-[#1E2185] fontCustom-bold">{amount}</TextC>

          {/* {unit && (
            <>
              &nbsp;
              <Text sx={{ fontWeight: "light", opacity: 0.8 }}>{unit}</Text>
            </>
          )} */}

          {pendingAmount && (
            <>
              &nbsp;
              <PendingAmountM1
                sx={{ color: pendingColor, opacity: 0.8, fontSize: "0.666em" }}
                value={pendingAmount}
              />
            </>
          )}
        </Flex>
      )}

      {children}
    </Flex>
  );
};

const staticStyleM1 = {
  flexGrow: 1,

  mb: 0,
  pl: 3,
  pr: "11px",
  pb: 0,
  pt: "5px",

  fontSize: 3,

  fontWeight: "bold",
  borderColor: "transparent",
  outline: "0"
};

const editableStyleM1 = {
  flexGrow: 1,

  pl: 3,
  pr: "11px",
  pb: "5px",
  pt: "5px",

  // fontSize: 4,
  // fontWeight: "bold",
  borderColor: "muted",
  outline: "0"
};

export const StaticRowM1 = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <RowM1
    label={label}
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
    sx={{ mt: [-2, -3], pb: [2, 3] }}
  >
    {amount ? (
      <StaticAmountsM1 amount={amount} {...props}>
        {children}
      </StaticAmountsM1>
    ) : (
      children
    )}
  </RowM1>
);

export const DisabledEditableAmountsM1 = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmountsM1
    sx={{ ...editableStyleM1, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmountsM1>
);

export const DisabledEditableRowM1 = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <RowM1 labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmountsM1 inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmountsM1>
    ) : (
      children
    )}
  </RowM1>
);

export const EditableRowM1 = ({
  label,
  inputId,
  unit,
  amount,
  color,
  pendingAmount,
  pendingColor,
  editingState,
  editedAmount,
  setEditedAmount,
  maxAmount,
  priceUnit,
  maxedOut, 
  coin,
  img
}) => {
  const [editing, setEditing] = editingState;
  const [invalid, setInvalid] = useState(false);

  return (
    <InputGroup className="w-full" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px", backgroundColor: invalid ? "pink" : "#FAFAFA", paddingTop: "3px", paddingBottom: "3px"}}>
      <InputLeftAddon children={
        <div className="flex items-center gap-2 pr-5 width-[52px]">
          <img src={img}/>
          <span className="fontCustom-Medium">{coin}</span>
        </div>
      } />
      {/* <InputC className="flex-grow mx-3 text-lg text-[#1E2185] font-bold" style={{border: "none", outline: "none", textAlign: "right", minWidth: "20px"}}/> */}
      {
        editing === inputId ? (
          <RowM1 {...{ label, labelFor: inputId, unit }}>
            <Input
              autoFocus
              id={inputId}
              type="number"
              step="any" //
              defaultValue={editedAmount} //
              {...{ invalid }} //
              onChange={e => {
                try {
                  setEditedAmount(e.target.value);
                  setInvalid(false);
                } catch {
                  setInvalid(true);
                }
              }} //
              onBlur={() => {
                setEditing(undefined);
                setInvalid(false);
              }} //
              variant="editor"
              sx={{
                ...editableStyleM1,
                fontWeight: "medium",
              }}
              style={{outline: 0, border: 0, textAlign: "right"}}
              className="text-[16px] text-[#1E2185] fontCustom-bold"
            />
          </RowM1>
        ) : (
          <RowM1 labelId={`${inputId}-label`} {...{ label, unit }}>
            <StaticAmountsM1
              sx={{
                ...editableStyleM1,
                bg: invalid ? "invalid" : "background"
              }}
              labelledBy={`${inputId}-label`}
              onClick={() => setEditing(inputId)}
              {...{ inputId, amount, unit, color, pendingAmount, pendingColor, invalid }}
            >
            </StaticAmountsM1>
          </RowM1>
        )
      }
      <InputRightAddon children={
        <TextC fontSize="small" className="text-[#6B7280] text-[10px] min-w-[50px] text-right">~${!coin.includes("USD") ? parseFloat(editedAmount*priceUnit).toFixed(2) : parseFloat(editedAmount).toFixed(2)}</TextC>
      } />
    </InputGroup>
  )
};
