import { useEffect, useReducer } from "react";

import { equals } from "../utils/equals";
import { useRolliqStore } from "./useRolliqStore";

export const useRolliqSelector = (select) => {
  const store = useRolliqStore();
  const [, rerender] = useReducer(() => ({}), {});

  useEffect(
    () =>
      store.subscribe(({ newState, oldState }) => {
        if (!equals(select(newState), select(oldState))) {
          rerender();
        }
      }),
    [store, select]
  );

  return select(store.state);
};
