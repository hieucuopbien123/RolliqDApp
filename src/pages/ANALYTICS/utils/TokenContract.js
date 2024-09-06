import ABI from "../../../lib/@rolliq/lib-ethers/abi/RUSDToken.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";
import zksync from "../../../lib/@rolliq/lib-ethers/deployments/zksync.json";

async function totalSupply(address) {
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractReader = new web3Reader.eth.Contract(
    ABI,
    address
  );
  const res = await contractReader.methods.totalSupply().call();
  return res;
}

export default {
  totalSupply,
};
