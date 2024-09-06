import { useContext } from "react";

import { RolliqStoreContext } from "../components/RolliqStoreProvider";

export const useRolliqStore = () => {
  const store = useContext(RolliqStoreContext);

  if (!store) {
    throw new Error("You must provide a RolliqStore via RolliqStoreProvider");
  }

  return store;
};
