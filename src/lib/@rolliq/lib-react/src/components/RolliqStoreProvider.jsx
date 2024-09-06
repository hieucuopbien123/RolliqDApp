import React, { createContext, useEffect, useState } from "react";

export const RolliqStoreContext = createContext(undefined);

export const RolliqStoreProvider = ({ store, loader, children }) => {
  const [loadedStore, setLoadedStore] = useState();

  useEffect(() => {
    store.onLoaded = () => setLoadedStore(store);
    const stop = store.start();

    return () => {
      store.onLoaded = undefined;
      setLoadedStore(undefined);
      stop();
    };
  }, [store]);

  if (!loadedStore) {
    return <>{loader}</>;
  }

  return (
    <RolliqStoreContext.Provider value={loadedStore}>
      {children}
    </RolliqStoreContext.Provider>
  );
};
