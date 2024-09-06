import Web3 from "web3";
import { ethers } from "ethers";
import { useRolliq } from "../../../hooks/RolliqContext";

//const { provider } = useRolliq();
let web3Reader;
let web3Sender;

async function initWeb3Reader() {
  web3Reader = new Web3(provider);
}
async function initWeb3Sender() {
  web3Reader = new Web3(provider);
}
function getWeb3Sender() {
  return web3Sender;
}
function getWeb3Reader() {
  return web3Reader;
}
export { web3Sender, web3Reader, getWeb3Reader, getWeb3Sender };
