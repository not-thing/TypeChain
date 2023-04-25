/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  ISimpleToken,
  ISimpleTokenInterface,
} from "../../v0.8.9/ISimpleToken";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class ISimpleToken__factory {
  static readonly abi = _abi;
  static createInterface(): ISimpleTokenInterface {
    return new utils.Interface(_abi) as ISimpleTokenInterface;
  }
  static connect(
    address: string,
    signerOrProvider?: Signer | Provider
  ): ISimpleToken {
    return new Contract(address, _abi, signerOrProvider) as ISimpleToken;
  }
}
