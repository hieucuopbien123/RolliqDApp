import React from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { BatchedWebSocketAugmentedWeb3Provider } from "./lib/@rolliq/providers";
import WalletConnector from "./components/WalletConnector";
import { FadeLoader } from "react-spinners";
import { RolliqProvider } from "./hooks/RolliqContext";
import { TransactionProvider } from "./components/Trasaction";
import App from "./App";
import { getConfig } from "./configs/configwallet";
import { ThemeProvider } from "theme-ui";
import theme from "./theme";
// import { DisposableWalletProvider } from "./DisposableWalletProvider";

if (window.ethereum) {
  Object.assign(window.ethereum, { autoRefreshOnNetworkChange: true });
}

// if (import.meta.env.VITE_APP_DEMO_MODE === "true") {
//   const ethereum = new DisposableWalletProvider(
//     import.meta.env.VITE_APP_RPC_URL || `http://${window.location.hostname}:8545`,
//     "0xde3a7a8d98210b07d87e79740094139c368c3c9fcce5abe8212c13591d215c36"
//   );

//   Object.assign(window, { ethereum });
// }
// const ethereum = new DisposableWalletProvider(
//   "https://rpc.tenderly.co/fork/6d754089-a637-42b6-8d13-bd6c8bfc790e",
//   "0xde3a7a8d98210b07d87e79740094139c368c3c9fcce5abe8212c13591d215c36"
// );

// Object.assign(window, { ethereum });

Object.assign(window, getConfig());

const EthersWeb3ReactProvider = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={provider => new BatchedWebSocketAugmentedWeb3Provider(provider)}>
      {children}
    </Web3ReactProvider>
  );
};

const UnsupportedMainnetFallback = () => (
  <div
    className="flex flex-col items-center justify-center h-screen text-center"
  >
    <h1 className="mb-3">
      This app is for testing purposes only.
    </h1>

    <p className="mb-3">
      Please change your network to Ropsten, Rinkeby, Kovan, Görli, Kiln or zkSync
    </p>

    <p>
      If you'd like to use the Rolliq Protocol on mainnet, please pick a frontend{" "}
      <a href="https://www.rolliq.org/frontend">
        here
      </a>
      .
    </p>
  </div>
);

const SetupWeb3 = () => {
  const loader = (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)"}}>
      <FadeLoader
        color={"#1E2185"}
        size={100}
        speedMultiplier={2}
      />
    </div>
  );

  const unsupportedNetworkFallback = () => (
    <div
      className="flex flex-col items-center justify-center text-center h-screen"
    >
      <h1 className="mb-3">
        Please switch network to Zksync Testnet!
      </h1>
    </div>
  );

  return (
    <EthersWeb3ReactProvider>
      <ThemeProvider theme={theme}>
        <WalletConnector loader={loader}>
          <RolliqProvider
            loader={loader}
            unsupportedNetworkFallback={unsupportedNetworkFallback}
            unsupportedMainnetFallback={<UnsupportedMainnetFallback />}
          >
            <TransactionProvider>
              <App loader={loader} />
            </TransactionProvider>
          </RolliqProvider>
        </WalletConnector>
      </ThemeProvider>
    </EthersWeb3ReactProvider>
  )
}

export default SetupWeb3;
