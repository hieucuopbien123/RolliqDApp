import React, { useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";

import {Icon} from "../../components/WalletConnector/Icon";
import { Decimal } from "../../lib/@rolliq/lib-base";

export const RowM2 = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
  return (
    <Flex sx={{ position: "relative", ...sx }}>
      {children}
    </Flex>
  );
};

const PendingAmountM2 = ({ sx, value }) => (
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

export const StaticAmountsM2 = ({
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
        justifyContent: "space-between",
        alignItems: "center",

        ...(onClick ? { cursor: "text" } : {}),

        ...staticStyleM2,
        ...sx
      }}
    >
      {amount && (
        <Flex sx={{ alignItems: "center" }}>
          <Text sx={{color}} className="text-[18px] text-[#6B7280] fontCustom-Medium">{amount}</Text>

          {unit && (
            <>
              &nbsp;
              <Text className="text-[18px] fontCustom-Medium text-[#6B7280]">{unit}</Text>
            </>
          )}

          {/* {pendingAmount && (
            <>
              &nbsp;
              <PendingAmountM2
                // sx={{ color: pendingColor }}
                className="text-[18px] fontCustom-Medium text-[#6B7280]"
                value={pendingAmount}
              />
            </>
          )} */}
        </Flex>
      )}

      {children}
    </Flex>
  );
};

const staticStyleM2 = {
  flexGrow: 1,

  mb: 0,
  pl: 3,
  pr: "0",
  pb: 0,
  pt: "0",

  fontSize: 3,

  border: 1,
  borderColor: "transparent"
};

const editableStyleM2 = {
  flexGrow: 1,

  mb: [2, 3],
  pl: 3,
  pr: "0",
  pb: 2,
  pt: "0",

  fontSize: 4,

  boxShadow: [1, 2],
  border: 1,
  borderColor: "muted"
};

export const StaticRowM2 = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <RowM2
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
  >
    {amount ? (
      <StaticAmountsM2 amount={amount} {...props}>
        {children}
      </StaticAmountsM2>
    ) : (
      children
    )}
  </RowM2>
);

export const DisabledEditableAmountsM2 = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmountsM2
    sx={{ ...editableStyleM2, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmountsM2>
);

export const DisabledEditableRowM2 = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <RowM2 labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmountsM2 inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmountsM2>
    ) : (
      children
    )}
  </RowM2>
);

export const EditableRowM2 = ({
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
  maxedOut
}) => {
  const [editing, setEditing] = editingState;
  const [invalid, setInvalid] = useState(false);

  return editing === inputId ? (
    <RowM2 {...{ label, labelFor: inputId, unit }}>
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
          ...editableStyleM2,
          fontWeight: "medium",
          bg: invalid ? "invalid" : "background"
        }}
      />
    </RowM2>
  ) : (
    <RowM2 labelId={`${inputId}-label`} {...{ label, unit }}>
      <StaticAmountsM2
        sx={{
          ...editableStyleM2,
          bg: invalid ? "invalid" : "background"
        }}
        labelledBy={`${inputId}-label`}
        onClick={() => setEditing(inputId)}
        {...{ inputId, amount, unit, color, pendingAmount, pendingColor, invalid }}
      >
        {maxAmount && (
          <Button
            sx={{ fontSize: 1, p: 1, px: 3 }}
            onClick={event => {
              setEditedAmount(maxAmount);
              event.stopPropagation();
            }}
            disabled={maxedOut} className="fontCustom-bold"
          >
            MAX
          </Button>
        )}
      </StaticAmountsM2>
    </RowM2>
  );
};
