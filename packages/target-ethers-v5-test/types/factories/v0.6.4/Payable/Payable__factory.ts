/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  Payable,
  PayableInterface,
} from "../../../v0.6.4/Payable/Payable";

const _abi = [
  {
    inputs: [],
    name: "non_payable_func",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "payable_func",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export class Payable__factory {
  static readonly abi = _abi;
  static createInterface(): PayableInterface {
    return new utils.Interface(_abi) as PayableInterface;
  }
  static connect(
    address: string,
    signerOrProvider?: Signer | Provider
  ): Payable {
    return new Contract(address, _abi, signerOrProvider) as Payable;
  }
}
