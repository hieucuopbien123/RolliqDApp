import ABI from "../abi/PriceFeed.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";
const PriceFeedAddr = "0xF5915210A5496D91692A3Db73646531897F1c573";

async function lastGoodPrice() {
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractReader = new web3Reader.eth.Contract(ABI, PriceFeedAddr);
  const res = await contractReader.methods.lastGoodPrice().call();
  return res;
}

export default {
  lastGoodPrice,
};
