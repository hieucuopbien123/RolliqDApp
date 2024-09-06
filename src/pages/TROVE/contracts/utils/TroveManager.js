import zksync from "../../../../lib/@rolliq/lib-ethers/deployments/zksync.json";
import ABI from "../../../../lib/@rolliq/lib-ethers/abi/TroveManager.json";
import Web3 from "web3";
const HttpProvider = "https://zksync2-testnet.zksync.dev";

var contractReader = null;
function getContractReader() {
  if (!contractReader) {
    const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
    contractReader = new web3Reader.eth.Contract(ABI, zksync.addresses.troveManager);
  }
  return contractReader;
}

async function checkRecoveryMode(price) {
  const res = await getContractReader().methods.checkRecoveryMode(price).call();
  return res;
}

async function getTroveDebt(address) {
  const res = await getContractReader().methods.getTroveDebt(address).call();
  return res;
}

export default {
  ABI,
  checkRecoveryMode,
  getTroveDebt
};
