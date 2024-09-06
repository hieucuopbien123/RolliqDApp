import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

export const makeWalletConnectConnector = (rpc) => new WalletConnectConnector({
  rpc: {
    1: rpc,
  },
});