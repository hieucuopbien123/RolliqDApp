import { useCallback, useEffect, useReducer, useRef } from "react";
import { equals } from "../utils/equals";
import { useRolliqStore } from "./useRolliqStore";

export const useRolliqReducer = (reduce, init) => {
  const store = useRolliqStore();
  const oldStore = useRef(store);
  const state = useRef(init(store.state));
  const [, rerender] = useReducer(() => ({}), {});

  const dispatch = useCallback(
    (action) => {
      const newState = reduce(state.current, action);

      if (!equals(newState, state.current)) {
        state.current = newState;
        rerender();
      }
    },
    [reduce]
  );

  useEffect(
    () =>
      store.subscribe((params) => dispatch({ type: "updateStore", ...params })),
    [store, dispatch]
  );

  if (oldStore.current !== store) {
    state.current = init(store.state);
    oldStore.current = store;
  }

  return [state.current, dispatch];
};
