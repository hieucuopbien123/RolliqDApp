import BigNumber from "bignumber.js";
import ABI from "../abi/ERC20Mock.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";

function getContractFactory(provider, contractAddress, options) {
  const decimals = options?.decimals || 18;
  const BASE = Math.pow(10, decimals);
  const web3Sender = new Web3(provider.provider);
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractSender = new web3Sender.eth.Contract(ABI, contractAddress);
  var contractReader = new web3Reader.eth.Contract(ABI, contractAddress);

  if (!contractReader || !contractSender) {
    throw new Error(`Cannot create contract from address ${contractAddress}`);
  }

  return {
    getAllowance: async function (ownerAddress, spenderAddress) {
      const raw = await contractReader.methods
        .allowance(ownerAddress, spenderAddress)
        .call();
      return BigNumber(raw).dividedBy(BASE);
    },
    approve: async function (spenderAddress, amount, accountAddress) {
      const _amount = BigNumber(amount).multipliedBy(BASE).toFixed();
      const emit = await contractSender.methods
        .approve(spenderAddress, _amount)
        .send({ from: accountAddress });
    },
    getBalance: async function (accountAddress) {
      const raw = await contractReader.methods.balanceOf(accountAddress).call();
      return BigNumber(raw).dividedBy(BASE);
    },
  };
}

export default {
  getContractFactory,
};
