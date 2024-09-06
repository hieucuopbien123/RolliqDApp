import { Decimal } from "../../lib/@rolliq/lib-base";
import React, { useEffect, useState } from "react";
import { Text, Flex, Label, Input, Button } from "theme-ui";

import {Icon} from "../../components/WalletConnector/Icon";

export const RowM4 = ({ sx, label, labelId, labelFor, children, infoIcon }) => {
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

const PendingAmountM4 = ({ sx, value }) => (
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

export const StaticAmountsM4 = ({
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

        ...staticStyleM4,
        ...sx
      }}
    >
      {amount && (
        <Flex sx={{ alignItems: "center"}}>
          <Text sx={{ color }} className="text-[16px]">{amount}</Text>

          {unit && (
            <>&nbsp;
              <Text sx={{ opacity: 0.8, fontSize: "13px" }}>{unit}</Text>
            </>
          )}

          {pendingAmount && (
            <>
              &nbsp;
              <PendingAmountM4
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

const staticStyleM4 = {
  flexGrow: 1,

  mb: 0,
  pl: 3,
  pr: "11px",
  pb: 0,
  pt: "7px",

  border: 1,
  borderColor: "#A3A3A3",
  outline: "0",
};
const editableStyleM4 = {
  flexGrow: 1,

  mb: [2, 3],
  pl: 3,
  pr: "11px",
  pb: 2,
  pt: "7px",

  borderRadius: "10px",
  border: 1,
  borderColor: "#A3A3A3",
  outline: "0",
};

export const StaticRowM4 = ({
  label,
  labelId,
  labelFor,
  infoIcon,
  amount,
  children,
  ...props
}) => (
  <RowM4
    label={label}
    labelId={labelId}
    labelFor={labelFor}
    infoIcon={infoIcon}
    sx={{ mt: [-2, -3], pb: [2, 3] }}
  >
    {amount ? (
      <StaticAmountsM4 amount={amount} {...props}>
        {children}
      </StaticAmountsM4>
    ) : (
      children
    )}
  </RowM4>
);

export const DisabledEditableAmountsM4 = ({
  inputId,
  children,
  sx,
  ...props
}) => (
  <StaticAmountsM4
    sx={{ ...editableStyleM4, boxShadow: 0, ...sx }}
    labelledBy={`${inputId}-label`}
    inputId={inputId}
    {...props}
  >
    {children}
  </StaticAmountsM4>
);

export const DisabledEditableRowM4 = ({
  inputId,
  label,
  amount,
  children,
  ...props
}) => (
  <RowM4 labelId={`${inputId}-label`} label={label}>
    {amount ? (
      <DisabledEditableAmountsM4 inputId={inputId} amount={amount} {...props}>
        {children}
      </DisabledEditableAmountsM4>
    ) : (
      children
    )}
  </RowM4>
);

export const EditableRowM4 = ({
  label,
  inputId,
  unit,
  color,
  pendingAmount,
  pendingColor,
  editingState,
  setEditedAmount,
  editedAmountF,
  maxAmountF,
  maxedOutF,
  amountF,
  debt
}) => {
  const [editing, setEditing] = editingState;
  const [invalid, setInvalid] = useState(false);
  
  const [editedAmount, setEditedAmountF] = useState(editedAmountF.toString(2));
  const [maxAmount, setMaxAmountF] = useState(undefined);
  const [maxedOut, setMaxedOutF] = useState(undefined);
  const [amount, setAmountF] = useState(amountF.prettify());

  useEffect(() => {
    setEditedAmountF(debt.sub(editedAmountF).toString(2));
  }, [editedAmountF]);
  // useEffect(() => {
  //   setMaxAmountF((maxAmountF.sub(troveCollateral)).toString());
  // }, [maxAmountF]);
  // useEffect(() => {
  //   setMaxedOutF(maxedOutF);
  // }, [maxedOutF]);
  useEffect(() => {
    setAmountF(debt.sub(editedAmountF).prettify());
  }, [amountF]);

  return editing === inputId ? (
    <RowM4 {...{ label, labelFor: inputId, unit }}>
      <Input
        autoFocus
        id={inputId}
        type="number"
        step="any"
        defaultValue={editedAmount}
        {...{ invalid }}
        onChange={e => {
          try {
            setEditedAmount(debt.sub(Decimal.from(e.target.value)));
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
          ...editableStyleM4,
          fontWeight: "medium",
          bg: invalid ? "invalid" : "background"
        }}
        className="text-[16px] fontCustom-Medium"
      />
    </RowM4>
  ) : (
    <RowM4 labelId={`${inputId}-label`} {...{ label, unit }}>
      <StaticAmountsM4
        sx={{
          ...editableStyleM4,
          bg: invalid ? "invalid" : "background"
        }}
        labelledBy={`${inputId}-label`}
        onClick={() => setEditing(inputId)}
        {...{ inputId, amount, unit, color, pendingAmount, pendingColor, invalid }}
      >
        {maxAmount && (
          <Button
            // sx={{ fontSize: 1, p: 1, px: 3 }}
            style={{fontSize: "10px", padding: 0, paddingRight: "5px", opacity: "0.8", color: "#6B7280", backgroundColor: "transparent", border: "0"}}
            onClick={event => {
              setEditedAmount(accountBalance.add(troveCollateral));
              event.stopPropagation();
            }}
            disabled={maxedOut} className="fontCustom-bold"
          >
            MAX
          </Button>
        )}
      </StaticAmountsM4>
    </RowM4>
  );
};
