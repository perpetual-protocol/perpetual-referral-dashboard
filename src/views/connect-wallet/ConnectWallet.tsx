import React from "react";
import DiamondHands from "../../assets/diamond-hands.svg";

import WalletConnect, {
} from "../../components/WalletConnect";
import Input from "../../components/Input";
import { ChangeEvent } from "react";
import { isAddress } from "ethers/lib/utils";
import { useGlobalState } from "../../AppStateHolder";

type Props = {};

export default function ConnectWallet(props: Props) {
  const { setViewOnlyAddress } = useGlobalState();
  const onAddressChange = (event: ChangeEvent) => {
    const address = event.target.value;
    if (isAddress(address)) {
      setViewOnlyAddress(address);
    }
  }

  return (
    <div
      style={{ maxWidth: "1200px" }}
      className="w-full flex flex-col items-center justify-center mt-20 mx-auto"
    >
      <div className="mb-12">
        <DiamondHands />
      </div>
      <div className="mb-8">
        <h1 className="text-white text-center text-3xl font-bold">
          Please connect your wallet
        </h1>
      </div>
      <WalletConnect size="lg" />
      <h1 className="text-white text-center text-xl font-semibold mt-1">or</h1>
      <div className="w-full md:w-1/3 px-2 mt-2">
        <Input placeholder="Enter an address" onChange={onAddressChange} />
      </div>
    </div>
  );
}
