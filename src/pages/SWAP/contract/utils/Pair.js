import ABI from "../abi/Pair.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";

async function getReserves(pairAddr) {
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractReader = new web3Reader.eth.Contract(ABI, pairAddr);
  const res = await contractReader.methods.getReserves().call();
  return res;
}

export default {
  ABI,
  getReserves,
};
