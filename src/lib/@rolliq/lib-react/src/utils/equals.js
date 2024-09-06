const hasOwnProperty = (o, key) => Object.prototype.hasOwnProperty.call(o, key);

const shallowEquals = (a, b) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  return (
    keysA.length === keysB.length &&
    keysA.every((key) => hasOwnProperty(b, key) && Object.is(a[key], b[key]))
  );
};

const isObject = (a) => a !== null && typeof a === "object";

export const equals = (a, b) =>
  isObject(a) && isObject(b) ? shallowEquals(a, b) : Object.is(a, b);
