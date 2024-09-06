import ABI from "../abi/Router.json";
import Web3 from "web3";
import BigNumber from "bignumber.js";
const HttpProvider = "https://zksync2-testnet.zksync.dev";
const RouterAddress = "0x23B17958Cce6d3da6A95F2e1529c9c729F91f289";
const BASE18 = BigNumber("1000000000000000000");

async function swapExactTokensForTokens(
  provider,
  amountIn,
  amountOutMin,
  path,
  to,
  deadline,
  accountAddr
) {
  const web3Sender = new Web3(provider.provider);
  const contractSender = new web3Sender.eth.Contract(ABI, RouterAddress);
  //   await contractSender.methods
  //     .swapExactETHForTokens(amountOutMin, path, to, deadline)
  //     .send({ from: accountAddr, value: value });
  await contractSender.methods
    .swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
    .send({ from: accountAddr });
}
async function swapExactETHForTokens(
  provider,
  value,
  amountOutMin,
  path,
  to,
  deadline,
  accountAddr
) {
  const web3Sender = new Web3(provider.provider);
  const contractSender = new web3Sender.eth.Contract(ABI, RouterAddress);
  // console.log("OK");
  //   await contractSender.methods
  //     .swapExactETHForTokens(amountOutMin, path, to, deadline)
  //     .send({ from: accountAddr, value: value });
  await contractSender.methods
    .swapExactETHForTokens(amountOutMin, path, to, deadline)
    .send({ from: accountAddr, value: value });
}
async function getAmountsOut(amountIn, path) {
  const web3Reader = new Web3(new Web3.providers.HttpProvider(HttpProvider));
  const contractReader = new web3Reader.eth.Contract(ABI, RouterAddress);
  const res = await contractReader.methods.getAmountsOut(amountIn, path).call();
  return res;
}
async function swapExactTokensForETH(
  provider,
  value,
  amountOutMin,
  path,
  to,
  deadline,
  accountAddr
) {
  const web3Sender = new Web3(provider.provider);
  const contractSender = new web3Sender.eth.Contract(ABI, RouterAddress);
  //   await contractSender.methods
  //     .swapExactETHForTokens(amountOutMin, path, to, deadline)
  //     .send({ from: accountAddr, value: value });
  // console.log(value, amountOutMin, path, to, deadline, accountAddr);

  await contractSender.methods
    .swapExactTokensForETH(value, amountOutMin, path, to, deadline)
    .send({ from: accountAddr });
}
export default {
  getAmountsOut,
  swapExactETHForTokens,
  swapExactTokensForETH,
  swapExactTokensForTokens,
};
