import React, { useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";
import { Text as TextC} from "@chakra-ui/react";
import {Icon} from "../../components/WalletConnector/Icon";

export const RowM6 = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
  return (
    <Flex sx={{ position: "relative", ...sx }}>
      {children}
    </Flex>
  );
};

const PendingAmountM6 = ({ sx, value }) => (
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

export const StaticAmountsM6 = ({
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

        // ...staticStyleM6,
        ...sx
      }}
    >
      {amount && (
        <Flex sx={{ alignItems: "center" }}>
          <TextC  className="fontCustom-Medium text-[18px] text-[#6B7280]">{amount}</TextC>

          {unit && (
            <>
              &nbsp;
              <TextC  className="fontCustom-Medium text-[18px] text-[#6B7280]">{unit}</TextC>
            </>
          )}

          {pendingAmount && (
            <>
              &nbsp;
              <PendingAmountM6
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

const staticStyleM6 = {
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

const editableStyleM6 = {
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

export const StaticRowM6 = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <RowM6
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
  >
    {amount ? (
      <StaticAmountsM6 amount={amount} {...props}>
        {children}
      </StaticAmountsM6>
    ) : (
      children
    )}
  </RowM6>
);

export const DisabledEditableAmountsM6 = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmountsM6
    sx={{ ...editableStyleM6, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmountsM6>
);

export const DisabledEditableRowM6 = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <RowM6 labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmountsM6 inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmountsM6>
    ) : (
      children
    )}
  </RowM6>
);

export const EditableRowM6 = ({
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
    <RowM6 {...{ label, labelFor: inputId, unit }}>
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
    </RowM6>
  ) : (
    <RowM6 labelId={`${inputId}-label`} {...{ label, unit }}>
      <StaticAmountsM6
        sx={{
          ...editableStyleM6,
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
      </StaticAmountsM6>
    </RowM6>
  );
};
