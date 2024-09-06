import { WalletLinkConnector } from "@web3-react/walletlink-connector";

export const makeWalletLinkConnector = (rpc) =>
  new WalletLinkConnector({
    appName: "Rolliq.app",
    url: rpc,
  });
