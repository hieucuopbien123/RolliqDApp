import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EthersRolliq,
  _connectByChainId
} from "../lib/@rolliq/lib-ethers";
import { getConfig } from "../configs/configwallet";
import { useWeb3React } from "@web3-react/core";

const RolliqContext = createContext(undefined);

// const wsParams = (network, infuraApiKey) => [
//   `wss://${network === "homestead" ? "mainnet" : network}.infura.io/ws/v3/${infuraApiKey}`,
//   network
// ];

// const supportedNetworks = ["homestead", "kovan", "rinkeby", "ropsten", "goerli"];

export const RolliqProvider = ({
  children,
  loader,
  unsupportedNetworkFallback,
  unsupportedMainnetFallback
}) => {
  const [config, setConfig] = useState();
  const { library: provider, account, chainId } = useWeb3React();
  
  const connection = useMemo(() => {
    // console.log(config);
    // console.log(provider);
    // console.log(chainId);
    // console.log(account);
    // console.log(config && provider && account && chainId);
    if (config && provider && account && chainId) {
      // console.log("Run set connection")
      try {
        return _connectByChainId(provider, provider.getSigner(account), chainId, {
          userAddress: account,
          frontendTag: config.frontendTag,
          useStore: "blockPolled"
        });
      } catch(e) {
        console.log(e);
      }
    }
  }, [config, provider, account, chainId]);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  // useEffect(() => {
  //   if (config && connection) {
  //     const { provider, chainId } = connection;

  //     if (isBatchedProvider(provider) && provider.chainId !== chainId) {
  //       provider.chainId = chainId;
  //     }

  //     if (isWebSocketAugmentedProvider(provider)) {
  //       const network = getNetwork(chainId);

        // if (network.name && supportedNetworks.includes(network.name) && config.infuraApiKey) {
        //   provider.openWebSocket(...wsParams(network.name, config.infuraApiKey));
        // } else if (connection._isDev) {
        //   provider.openWebSocket(`ws://${window.location.hostname}:8546`, chainId);
        // }

  //       return () => {
  //         provider.closeWebSocket();
  //       };
  //     }
  //   }
  // }, [config, connection]);

  // console.log(config);
  // console.log(provider);
  // console.log(account);
  // console.log(chainId);
  // console.log(connection);
  if (!config || !provider || !account || !chainId) {
    return <>{loader}</>;
  }

  if (config.testnetOnly && chainId === 1) {
    return <>{unsupportedMainnetFallback}</>;
  }

  if (!connection) {
    return unsupportedNetworkFallback ? <>{unsupportedNetworkFallback(chainId)}</> : null;
  }

  const rolliq = EthersRolliq._from(connection);
  // console.log(rolliq);
  rolliq.store.logging = true;

  return (
    <RolliqContext.Provider value={{ config, account, provider, rolliq }}>
      {children}
    </RolliqContext.Provider>
  );
}

export const useRolliq = () => {
  const rolliqContext = useContext(RolliqContext);

  if (!rolliqContext) {
    throw new Error("You must provide a RolliqContext via RolliqProvider");
  }

  return rolliqContext;
};
