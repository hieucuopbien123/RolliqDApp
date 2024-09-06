import zksync from "../../../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import ABI from "../../../../lib/@rolliq/lib-ethers/abi/PriceFeed.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";

var contractReader = null;
function getContractReader() {
  if (!contractReader) {
    const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
    contractReader = new web3Reader.eth.Contract(ABI, zksync.addresses.priceFeed);
  }
  return contractReader;
}

async function getLastGoodPrice() {
  const res = await getContractReader().methods.lastGoodPrice().call();
  return res;
}

export default {
  ABI,
  getLastGoodPrice,
};
