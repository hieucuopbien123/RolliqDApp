import { Signer } from "@ethersproject/abstract-signer";

import { Decimal } from "../../lib-base/index";

import devOrNull from "../deployments/dev.json";
import goerli from "../deployments/goerli.json";
import kovan from "../deployments/kovan.json";
import rinkeby from "../deployments/rinkeby.json";
import ropsten from "../deployments/ropsten.json";
import mainnet from "../deployments/mainnet.json";
import kiln from "../deployments/kiln.json";
import zksync from "../deployments/zksync.json";

import { numberify, panic } from "./_utils";

import { _connectToContracts } from "./contracts";

import { _connectToMulticall } from "./_Multicall";

const dev = devOrNull;

const deployments = {
  [mainnet.chainId]: mainnet,
  [ropsten.chainId]: ropsten,
  [rinkeby.chainId]: rinkeby,
  [goerli.chainId]: goerli,
  [kovan.chainId]: kovan,
  [kiln.chainId]: kiln,
  [zksync.chainId]: zksync,

  ...(dev !== null ? { [dev.chainId]: dev } : {}),
};

const branded = (t) => t;

const connectionFrom = (
  provider,
  signer,
  _contracts,
  _multicall,
  {
    deploymentDate,
    totalStabilityPoolRIQReward,
    liquidityMiningRIQRewardRate,
    ...deployment
  },
  optionalParams
) => {
  if (
    optionalParams &&
    optionalParams.useStore !== undefined &&
    !validStoreOptions.includes(optionalParams.useStore)
  ) {
    throw new Error(`Invalid useStore value ${optionalParams.useStore}`);
  }

  return branded({
    provider,
    signer,
    _contracts,
    _multicall,
    deploymentDate: new Date(deploymentDate),
    totalStabilityPoolRIQReward: Decimal.from(totalStabilityPoolRIQReward),
    liquidityMiningRIQRewardRate: Decimal.from(liquidityMiningRIQRewardRate),
    ...deployment,
    ...optionalParams,
  });
};

/** @internal */
export const _getContracts = (connection) => connection._contracts;

const getMulticall = (connection) => connection._multicall;

const getTimestampFromBlock = ({ timestamp }) => timestamp;

/** @internal */
export const _getBlockTimestamp = (connection, blockTag = "latest") =>
  // Get the timestamp via a contract call whenever possible, to make it batchable with other calls
  getMulticall(connection)
    ?.getCurrentBlockTimestamp({ blockTag })
    .then(numberify) ??
  _getProvider(connection).getBlock(blockTag).then(getTimestampFromBlock);

/** @internal */
export const _requireSigner = (connection) =>
  connection.signer ?? panic(new Error("Must be connected through a Signer"));

/** @internal */
export const _getProvider = (connection) => connection.provider;

// TODO parameterize error message?
/** @internal */
export const _requireAddress = (connection, overrides) =>
  overrides?.from ??
  connection.userAddress ??
  panic(new Error("A user address is required"));

/** @internal */
export const _requireFrontendAddress = (connection) =>
  connection.frontendTag ?? panic(new Error("A frontend address is required"));

/** @internal */
export const _usingStore = (connection) => connection.useStore !== undefined;

/**
 * Thrown when trying to connect to a network where Rolliq is not deployed.
 *
 * @remarks
 * Thrown by {@link ReadableEthersRolliq.(connect:2)} and {@link EthersRolliq.(connect:2)}.
 *
 * @public
 */
export class UnsupportedNetworkError extends Error {
  /** Chain ID of the unsupported network. */

  /** @internal */
  constructor(chainId) {
    super(`Unsupported network (chainId = ${chainId})`);
    this.name = "UnsupportedNetworkError";
    this.chainId = chainId;
  }
}

const getProviderAndSigner = (signerOrProvider) => {
  const provider = Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider ??
      panic(new Error("Signer must have a Provider"))
    : signerOrProvider;

  const signer = Signer.isSigner(signerOrProvider)
    ? signerOrProvider
    : undefined;

  return [provider, signer];
};

/** @internal */
export const _connectToDeployment = (
  deployment,
  signerOrProvider,
  optionalParams
) =>
  connectionFrom(
    ...getProviderAndSigner(signerOrProvider),
    _connectToContracts(signerOrProvider, deployment),
    undefined,
    deployment,
    optionalParams
  );

const validStoreOptions = ["blockPolled"];

/** @internal */
export function _connectByChainId(provider, signer, chainId, optionalParams) {
  const deployment =
    deployments[chainId] ?? panic(new UnsupportedNetworkError(chainId));

  // console.log(provider);
  // console.log(signer);
  // console.log(_connectToContracts(signer ?? provider, deployment));
  // console.log(_connectToMulticall(signer ?? provider, chainId));
  // console.log(deployment);
  // console.log(optionalParams);
  return connectionFrom(
    provider,
    signer,
    _connectToContracts(signer ?? provider, deployment),
    _connectToMulticall(signer ?? provider, chainId),
    deployment,
    optionalParams
  );
}

/** @internal */
export const _connect = async (signerOrProvider, optionalParams) => {
  const [provider, signer] = getProviderAndSigner(signerOrProvider);

  if (signer) {
    if (optionalParams?.userAddress !== undefined) {
      throw new Error(
        "Can't override userAddress when connecting through Signer"
      );
    }

    optionalParams = {
      ...optionalParams,
      userAddress: await signer.getAddress(),
    };
  }

  return _connectByChainId(
    provider,
    signer,
    (await provider.getNetwork()).chainId,
    optionalParams
  );
};
