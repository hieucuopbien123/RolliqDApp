import { Contract } from "@ethersproject/contracts";

import activePoolAbi from "../abi/ActivePool.json";
import borrowerOperationsAbi from "../abi/BorrowerOperations.json";
import troveManagerAbi from "../abi/TroveManager.json";
import rusdTokenAbi from "../abi/RUSDToken.json";
import collSurplusPoolAbi from "../abi/CollSurplusPool.json";
import communityIssuanceAbi from "../abi/CommunityIssuance.json";
import defaultPoolAbi from "../abi/DefaultPool.json";
import riqTokenAbi from "../abi/RIQToken.json";
import hintHelpersAbi from "../abi/HintHelpers.json";
import lockupContractFactoryAbi from "../abi/LockupContractFactory.json";
import riqStakingAbi from "../abi/RIQStaking.json";
import multiTroveGetterAbi from "../abi/MultiTroveGetter.json";
import priceFeedAbi from "../abi/PriceFeed.json";
import priceFeedTestnetAbi from "../abi/PriceFeedTestnet.json";
import sortedTrovesAbi from "../abi/SortedTroves.json";
import stabilityPoolAbi from "../abi/StabilityPool.json";
import gasPoolAbi from "../abi/GasPool.json";
import unipoolAbi from "../abi/Unipool.json";
import iERC20Abi from "../abi/IERC20.json";
import erc20MockAbi from "../abi/ERC20Mock.json";

const buildEstimatedFunctions = (estimateFunctions, functions) =>
  Object.fromEntries(
    Object.keys(estimateFunctions).map((functionName) => [
      functionName,
      async (overrides, adjustEstimate, ...args) => {
        if (overrides.gasLimit === undefined) {
          const estimatedGas = await estimateFunctions[functionName](
            ...args,
            overrides
          );

          overrides = {
            ...overrides,
            gasLimit: adjustEstimate(estimatedGas),
          };
        }

        return functions[functionName](...args, overrides);
      },
    ])
  );

export class _RolliqContract extends Contract {
  constructor(addressOrName, contractInterface, signerOrProvider) {
    super(addressOrName, contractInterface, signerOrProvider);
    // this.estimateAndCall = buildEstimatedFunctions(this.estimateGas, this);
    this.estimateAndPopulate = buildEstimatedFunctions(
      this.estimateGas,
      this.populateTransaction
    );
  }

  extractEvents(logs, name) {
    return logs
      .filter((log) => log.address === this.address)
      .map((log) => this.interface.parseLog(log))
      .filter((e) => e.name === name);
  }
}

/** @internal */
export const _priceFeedIsTestnet = (priceFeed) => "setPrice" in priceFeed;

/** @internal */
export const _uniTokenIsMock = (uniToken) => "mint" in uniToken;

const getAbi = (priceFeedIsTestnet, uniTokenIsMock) => ({
  activePool: activePoolAbi,
  borrowerOperations: borrowerOperationsAbi,
  troveManager: troveManagerAbi,
  rusdToken: rusdTokenAbi,
  communityIssuance: communityIssuanceAbi,
  defaultPool: defaultPoolAbi,
  riqToken: riqTokenAbi,
  hintHelpers: hintHelpersAbi,
  lockupContractFactory: lockupContractFactoryAbi,
  riqStaking: riqStakingAbi,
  multiTroveGetter: multiTroveGetterAbi,
  priceFeed: priceFeedIsTestnet ? priceFeedTestnetAbi : priceFeedAbi,
  sortedTroves: sortedTrovesAbi,
  stabilityPool: stabilityPoolAbi,
  gasPool: gasPoolAbi,
  collSurplusPool: collSurplusPoolAbi,
  unipool: unipoolAbi,
  uniToken: uniTokenIsMock ? erc20MockAbi : iERC20Abi,
});

const mapRolliqContracts = (contracts, f) => {
  // console.log(contracts);
  // console.log(Object.entries(contracts));
  // console.log(Object.entries(contracts).map(([key, t]) => [key, key]));
  return Object.fromEntries(
    Object.entries(contracts).map(([key, t]) => [key, f(t, key)])
  );
};

/** @internal */
export const _connectToContracts = (
  signerOrProvider,
  { addresses, _priceFeedIsTestnet, _uniTokenIsMock }
) => {
  // console.log(addresses, _priceFeedIsTestnet, _uniTokenIsMock);
  const abi = getAbi(_priceFeedIsTestnet, _uniTokenIsMock);
  // console.log(abi);
  return mapRolliqContracts(
    addresses,
    (address, key) => new _RolliqContract(address, abi[key], signerOrProvider)
  );
};
