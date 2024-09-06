import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";
export const getETHBalance = async (address) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  return web3.eth.getBalance(address);
};
