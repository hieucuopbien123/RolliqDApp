import { InputGroup, InputLeftAddon, InputRightAddon, Text as TextC, Input as InputC } from "@chakra-ui/react";
import React, { useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";

import {Icon} from "../../components/WalletConnector/Icon";

export const RowM5 = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
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

const PendingAmountM5 = ({ sx, value }) => (
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

export const StaticAmountsM5 = ({
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

        ...staticStyleM5,
        ...sx
      }}
    >
      {amount && (
        <Flex sx={{ justifyContent: "flex-end" }}>
          <TextC className="text-[16px] text-[#1E2185]">{amount}</TextC>

          {/* {unit && (
            <>
              &nbsp;
              <Text sx={{ fontWeight: "light", opacity: 0.8 }}>{unit}</Text>
            </>
          )} */}

          {pendingAmount && (
            <>
              &nbsp;
              <PendingAmountM5
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

const staticStyleM5 = {
  flexGrow: 1,

  mb: 0,
  pl: 3,
  // pr: "11px",
  pb: 0,
  pt: "5px",

  fontWeight: "bold",
  borderColor: "transparent",
  outline: "0"
};

const editableStyleM5 = {
  flexGrow: 1,

  pl: 3,
  // pr: "11px",
  pb: 2,
  pt: "5px",

  fontWeight: "bold",
  borderColor: "muted",
  outline: "0"
};

export const StaticRowM5 = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <RowM5
    label={label}
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
    sx={{ mt: [-2, -3], pb: [2, 3] }}
  >
    {amount ? (
      <StaticAmountsM5 amount={amount} {...props}>
        {children}
      </StaticAmountsM5>
    ) : (
      children
    )}
  </RowM5>
);

export const DisabledEditableAmountsM5 = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmountsM5
    sx={{ ...editableStyleM5, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmountsM5>
);

export const DisabledEditableRowM5 = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <RowM5 labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmountsM5 inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmountsM5>
    ) : (
      children
    )}
  </RowM5>
);

export const EditableRowM5 = ({
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
  maxedOut, 
  coin,
  img,
  riqPrice
}) => {
  const [editing, setEditing] = editingState;
  const [invalid, setInvalid] = useState(false);

  return (
    <InputGroup className="w-full" style={{paddingLeft: "10px", paddingRight: "10px", border: "1px solid #D4D4D4", borderRadius: "7px", backgroundColor: invalid ? "pink" : ""}}>
      <InputLeftAddon children={
        <div className="flex items-center gap-2 pr-5">
          <img src={img} style={{width: "24px"}}/>
          <span className="text-[16px] fontCustom-Medium">{coin}</span>
        </div>
      } />
      {/* <InputC className="flex-grow mx-3 text-lg text-[#1E2185] font-bold" style={{border: "none", outline: "none", textAlign: "right", minWidth: "20px"}}/> */}
      {
        editing === inputId ? (
          <RowM5 {...{ label, labelFor: inputId, unit }}>
            <Input
              autoFocus
              id={inputId}
              type="number"
              step="any"
              defaultValue={editedAmount}
              {...{ invalid }}
              onChange={e => {
                try {
                  setEditedAmount(e.target.value);
                  setInvalid(false);
                } catch {
                  setInvalid(true);
                }
              }}
              onBlur={() => {
                setEditing(undefined);
                setInvalid(false);
              }}
              variant="editor"
              sx={{
                ...editableStyleM5,
              }}
              style={{outline: 0, border: 0, color: "#1E2185", textAlign: "right"}}
              className="text-[16px] fontCustom-Medium"
            />
          </RowM5>
        ) : (
          <RowM5 labelId={`${inputId}-label`} {...{ label, unit }}>
            <StaticAmountsM5
              sx={{
                ...editableStyleM5,
                bg: invalid ? "invalid" : "background"
              }}
              labelledBy={`${inputId}-label`}
              onClick={() => setEditing(inputId)}
              {...{ inputId, amount, unit, color, pendingAmount, pendingColor, invalid }}
            >
              {/* {maxAmount && (
                <Button
                  // sx={{ fontSize: 1, p: 1, px: 3 }}
                  style={{fontSize: "small", padding: 0, paddingLeft: "20px", paddingRight: "5px", opacity: "0.8", color: "#6B7280", backgroundColor: "transparent", border: "0"}}
                  onClick={event => {
                    setEditedAmount(maxAmount);
                    event.stopPropagation();
                  }}
                  disabled={maxedOut}
                >
                  MAX
                </Button>
              )} */}
            </StaticAmountsM5>
          </RowM5>
        )
      }
      { 
        !isNaN(riqPrice) && !isNaN(parseFloat(riqPrice)) &&
        <InputRightAddon children={
          <TextC fontSize="small" className="text-[#6B7280] ml-2">~${(riqPrice*editedAmount).toFixed(2)}</TextC>
        } />
      }
    </InputGroup>
  )
};
