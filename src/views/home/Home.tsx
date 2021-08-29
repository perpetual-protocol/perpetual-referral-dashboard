import React from "react";

import ConnectWallet from "../connect-wallet/ConnectWallet";
import Tabs, { TabOption } from "../../components/Tabs";
import MyReferral from "../my-referral/MyReferral";
import MyTrading from "../my-trading/MyTrading";

import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import AppNav from "../app-nav/AppNav";
import { useEffect } from "react";
import { switchToXDAI } from "../../utils/switcher";

const tabs = [
  {
    value: "my-trading",
    label: "My Trading",
  },
  {
    value: "my-referrals",
    label: "My Referral",
  },
];

export default function Home(props: unknown) {
  const { active, chainId, library } = useWeb3React();
  const [activeTab, setActiveTab] = useState(tabs[0].value);

  const onTabSelected = (tab: TabOption) => {
    setActiveTab(tab.value);
  };

  useEffect(() => {
    if (chainId && chainId !== 100) {
      switchToXDAI(library);
    }
  }, [chainId])

  return (
    <div>
      <AppNav />
      <div className="flex flex-grow flex-col items-center">
        {!active && <ConnectWallet />}
        {active && (
          <div className="flex justify-center bg-perp-gray-300 w-full px-4">
            <Tabs
              onTabSelected={onTabSelected}
              activeTab={activeTab}
              tabs={tabs}
            />
          </div>
        )}
        {active && (
          <div
            className="grid grid-cols-12 mt-8 w-full gap-6 mb-20 px-4"
            style={{ maxWidth: "1200px" }}
          >
            {activeTab === "my-referrals" && (
              <MyReferral setActiveTab={setActiveTab} />
            )}
            {activeTab === "my-trading" && (
              <MyTrading setActiveTab={setActiveTab} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
