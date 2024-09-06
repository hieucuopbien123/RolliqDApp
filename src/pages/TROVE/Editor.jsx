import React, { useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";

import {Icon} from "../../components/WalletConnector/Icon";

export const Row = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
  return (
    <Flex sx={{ alignItems: "stretch", position: "relative", width: "100%", ...sx }}>
      <Label
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
      </Label>
      {children}
    </Flex>
  );
};

const PendingAmount = ({ sx, value }) => (
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

export const StaticAmounts = ({
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

        ...staticStyle,
        ...sx
      }}
    >
      {amount && (
        <Flex sx={{ alignItems: "center" }}>
          <Text sx={{ color, fontWeight: "medium" }}>{amount}</Text>

          {unit && (
            <>
              &nbsp;
              <Text sx={{ fontWeight: "light", opacity: 0.8 }}>{unit}</Text>
            </>
          )}

          {pendingAmount && (
            <>
              &nbsp;
              <PendingAmount
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

const staticStyle = {
  flexGrow: 1,

  mb: 0,
  pl: 3,
  pr: "11px",
  pb: 0,
  pt: "28px",

  fontSize: 3,

  border: 1,
  borderColor: "transparent"
};

const editableStyle = {
  flexGrow: 1,

  mb: [2, 3],
  pl: 3,
  pr: "11px",
  pb: 2,
  pt: "28px",

  fontSize: 4,

  boxShadow: [1, 2],
  border: 1,
  borderColor: "muted"
};

export const StaticRow = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <Row
    label={label}
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
    sx={{ mt: [-2, -3], pb: [2, 3] }}
  >
    {amount ? (
      <StaticAmounts amount={amount} {...props}>
        {children}
      </StaticAmounts>
    ) : (
      children
    )}
  </Row>
);

export const DisabledEditableAmounts = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmounts
    sx={{ ...editableStyle, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmounts>
);

export const DisabledEditableRow = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <Row labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmounts inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmounts>
    ) : (
      children
    )}
  </Row>
);

export const EditableRow = ({
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
    <Row {...{ label, labelFor: inputId, unit }}>
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
          ...editableStyle,
          fontWeight: "medium",
          bg: invalid ? "invalid" : "background"
        }}
      />
    </Row>
  ) : (
    <Row labelId={`${inputId}-label`} {...{ label, unit }}>
      <StaticAmounts
        sx={{
          ...editableStyle,
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
      </StaticAmounts>
    </Row>
  );
};
