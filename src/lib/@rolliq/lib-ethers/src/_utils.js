import { Decimal } from "../../lib-base/index";

export const numberify = (bigNumber) => bigNumber.toNumber();

export const decimalify = (bigNumber) =>
  Decimal.fromBigNumberString(bigNumber.toHexString());

export const panic = (e) => {
  throw e;
};

export const promiseAllValues = (object) => {
  const keys = Object.keys(object);

  return Promise.all(Object.values(object)).then((values) =>
    Object.fromEntries(values.map((value, i) => [keys[i], value]))
  );
};
