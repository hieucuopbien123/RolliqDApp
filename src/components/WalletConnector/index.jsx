import { getConfig } from "../../configs/configwallet";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { useAuthorizedConnection } from "../../hooks/useAuthorizedConnection";
import { injectedConnector } from "../../connectors/injectedConnector";
import MetaMaskIcon from "./MetaMaskIcon.jsx";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { makeWalletLinkConnector } from "../../connectors/walletLinkConnector";
import { makeWalletConnectConnector } from "../../connectors/walletConnectConnector";
import bgImage from "../Header/assets/bgImage.png";
import { Modal } from "./Modal";
import { RetryDialog } from "./RetryDialog";
import { Icon } from "./Icon";
import { Text, Link, Box } from "theme-ui";
import { ConnectionConfirmationDialog } from "./ConnectionConfirmationDialog";
import { NoEthereumProviderError, UserRejectedRequestError as UserRejectedRequestErrorInjected } from '@web3-react/injected-connector'

const connectionReducer = (
  state,
  action
) => {
  switch (action.type) {
    case "startActivating":
      return {
        type: "activating",
        connector: action.connector,
      };
    case "finishActivating":
      return {
        type: "active",
        connector:
          state.type === "inactive" ? injectedConnector : state.connector,
      };
    case "fail":
      if (state.type !== "inactive") {
        return {
          type: action.error.message.match(/user rejected/i)
            ? "rejectedByUser"
            : action.error.message.match(/already pending/i)
            ? "alreadyPending"
            : "failed",
          connector: state.connector,
        };
      }
      break;
    case "retry":
      if (state.type !== "inactive") {
        return {
          type: "activating",
          connector: state.connector,
        };
      }
      break;
    case "cancel":
      return {
        type: "inactive",
      };
    case "deactivate":
      return {
        type: "inactive",
      };
  }

  // console.warn("Ignoring connectionReducer action:");
  // console.log(action);
  // console.log("  in state:");
  // console.log(state);

  return state;
};

const addRPC = async () => {
  const provider = window.stargate?.wallet?.ethereum?.signer?.provider?.provider ?? window.ethereum
  if (provider) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x118` }],
      })
      return true
    } catch (switchError) {
      if (switchError?.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x118`,
                chainName: 'zkSync Era Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet.era.zksync.dev'],
                blockExplorerUrls: ['https://zksync2-testnet.zkscan.io/'],
              },
            ],
          })
          return true
        } catch (error) {
          console.error('Failed to setup the network', error)
          return false
        }
      }
      return false
    }
  }
}

const detectMetaMask = () =>
  window?.ethereum?.isMetaMask ?? false;
  
// const makeInfuraUrl = (network, apiKey) => `https://${network}.infura.io/v3/${apiKey}`;

const WalletConnector = ({children, loader}) => {
  const { activate, deactivate, active, error } = useWeb3React();
  const [config, setConfig] = useState();
  const triedAuthorizedConnection = useAuthorizedConnection();
  const [connectionState, dispatch] = useReducer(connectionReducer, {
    type: "inactive",
  });
  const isMetaMask =
  connectionState.type === "inactive"
    ? detectMetaMask()
    : connectionState.connector === injectedConnector && detectMetaMask();

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  useEffect(() => {
    if (active) {
      dispatch({ type: "finishActivating" });
    } else {
      dispatch({ type: "deactivate" });
    }
  }, [active]);

  useEffect(() => {
    if (error) {
      dispatch({ type: "fail", error });
      deactivate();
    }
  }, [error, deactivate]);

  const login = useCallback(
    (connector) => {
      if (connector) {
        activate(connector, async (error) => {
          if (error instanceof UnsupportedChainIdError) {
            const hasSetup = await addRPC();
            if (hasSetup) {
              activate(connector)
            }
          } else {
            if (error instanceof NoEthereumProviderError) {
              console.log('No provider was found');
            } else if (error instanceof UserRejectedRequestErrorInjected) {
              console.log('User denied account authorization');
            } else {
              console.log(error.message)
            }
          }
        })
      } else {
        console.log('The connector config is wrong')
      }
    },
    [activate],
  )

  // console.log(config);
  if (!config) {
    return <>{loader}</>;
  }

  // let walletLinkConnector;
  // let walletConnectConnector;
  // let infuraAvailable = false;

  // if (config.infuraApiKey) {
  //   walletLinkConnector = makeWalletLinkConnector(
  //     makeInfuraUrl("mainnet", config.infuraApiKey)
  //   );
  //   walletConnectConnector = makeWalletConnectConnector(
  //     makeInfuraUrl("mainnet", config.infuraApiKey)
  //   );
  //   infuraAvailable = true;
  // }

  if (!triedAuthorizedConnection) {
    return <>{loader}</>;
  }

  if (connectionState.type === "active") {
    return <>{children}</>;
  }

  return (
    <>
      <div style={{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 0,
      }}>
      </div>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 0,
      }}></div>
      <div style={{
        zIndex: 2,
        position: "relative",
        padding: "40px"
      }}>
        <h1 style={{fontSize: "1.875rem", fontWeight: "bold", paddingBottom: "40px", textAlign: "center"}}>Connect your wallet to Rolliq</h1>
        <div className="text-center">
          <button
            className="w-fit animationCustom"
            onClick={() => {
              dispatch({
                type: "startActivating",
                connector: injectedConnector,
              });
              // console.log("Popup");
              // activate(injectedConnector);
              login(injectedConnector);
              // console.log("Close");
            }}
          >
            {
              isMetaMask ? (
                <>
                  <div className="flex gap-2 bg-[#1E2185] rounded-md w-fit p-2 items-center m-0 mx-auto">
                    <MetaMaskIcon />
                    <div className="text-[#fff] fontCustom-bold">Connect to MetaMask</div>
                  </div>
                </>
              ) : (
                <>
                  <div>Connect to Web3 Wallet</div>
                </>
              )
            }
          </button>
        </div>
        {/* {infuraAvailable && (
          <>
            <button
              className={"mt-3 w-full"}
              onClick={() => {
                dispatch({
                  type: "startActivating",
                  connector: walletConnectConnector,
                });
                activate(walletConnectConnector);
              }}
            >
              Connect via WalletConnect
            </button>
            <button
              className={"mt-3 w-full"}
              onClick={() => {
                dispatch({
                  type: "startActivating",
                  connector: walletLinkConnector,
                });
                activate(walletLinkConnector);
              }}
            >
              Connect via Coinbase Wallet
            </button>
          </>
        )} */}
      </div>
      {connectionState.type === "failed" && (
        <Modal>
          <RetryDialog
            title={
              isMetaMask
                ? "Failed to connect to MetaMask"
                : "Failed to connect wallet"
            }
            onCancel={() => dispatch({ type: "cancel" })}
            onRetry={() => {
              dispatch({ type: "retry" });
              // activate(connectionState.connector);
              login(connectionState.connector);
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              You might need to install MetaMask or use a different browser.
            </Box>
            <Link
              sx={{ lineHeight: 3 }}
              href="https://metamask.io/download.html"
              target="_blank"
            >
              Learn more <Icon size="xs" name="external-link-alt" />
            </Link>
          </RetryDialog>
        </Modal>
      )}

      {connectionState.type === "activating" && (
        <Modal>
          <ConnectionConfirmationDialog
            title={
              isMetaMask
                ? "Confirm connection in MetaMask"
                : "Confirm connection in your wallet"
            }
            icon={
              isMetaMask ? <MetaMaskIcon /> : <Icon name="wallet" size="lg" />
            }
            onCancel={() => dispatch({ type: "cancel" })}
          >
            <Text sx={{ textAlign: "center" }}>
              Confirm the request that&apos;s just appeared.
              {isMetaMask ? (
                <>
                  {" "}
                  If you can&apos;t see a request, open your MetaMask extension
                  via your browser.
                </>
              ) : (
                <>
                  {" "}
                  If you can&apos;t see a request, you might have to open your
                  wallet.
                </>
              )}
            </Text>
          </ConnectionConfirmationDialog>
        </Modal>
      )}

      {connectionState.type === "rejectedByUser" && (
        <Modal>
          <RetryDialog
            title="Cancel connection?"
            onCancel={() => dispatch({ type: "cancel" })}
            onRetry={() => {
              dispatch({ type: "retry" });
              login(connectionState.connector);
              // activate(connectionState.connector);
            }}
          >
            <Text>
              To use Rolliq, you need to connect your Ethereum account.
            </Text>
          </RetryDialog>
        </Modal>
      )}

      {connectionState.type === "alreadyPending" && (
        <Modal>
          <RetryDialog
            title="Connection already requested"
            onCancel={() => dispatch({ type: "cancel" })}
            onRetry={() => {
              dispatch({ type: "retry" });
              // activate(connectionState.connector);
              login(connectionState.connector);
            }}
          >
            <Text>
              Please check your wallet and accept the connection request before
              retrying.
            </Text>
          </RetryDialog>
        </Modal>
      )}
    </>
  )
}

export default WalletConnector;