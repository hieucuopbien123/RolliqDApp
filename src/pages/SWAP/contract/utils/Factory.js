import ABI from "../abi/Factory.json";
import Web3 from "web3";
import { ethers } from "ethers";
const HttpProvider = "https://zksync2-testnet.zksync.dev";

const factoryAddress = "0x0F931A6B42ce9287935b5dD1acCDbE4aCf0A78Ba";

async function getPair(addr1, addr2) {
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractReader = new web3Reader.eth.Contract(ABI, factoryAddress);
  const res = await contractReader.methods.getPair(addr1, addr2).call();
  return res;
}

export default {
  ABI,
  getPair,
};
