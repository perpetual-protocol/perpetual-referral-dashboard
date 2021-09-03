import { useWeb3React } from "@web3-react/core";
import React, { ReactElement, useContext, useState } from "react";
import { Dispatch } from "react";
import { SetStateAction } from "react";

export const ReferralGlobalState = React.createContext<GlobalState>({} as any);
export const useGlobalState = () => useContext(ReferralGlobalState);

type GlobalState = {
  setViewOnlyAddress: Dispatch<SetStateAction<string>>;
  viewOnlyAddress: string;
  account: string;
  canAccessApp: boolean;
}

export default function AppStateProvider(props: { children: ReactElement }) {
  const { active, account: web3Account } = useWeb3React();
  const [viewOnlyAddress, setViewOnlyAddress] = useState("");

  const canAccessApp = active || viewOnlyAddress !== '';
  const account = web3Account || viewOnlyAddress
  return (
    <ReferralGlobalState.Provider
      value={{ viewOnlyAddress, setViewOnlyAddress, canAccessApp, account }}
    >
      {props.children}
    </ReferralGlobalState.Provider>
  );
}
