import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import React from "react";
import { useState } from "react";
import Jazzicon from "react-jazzicon";
import Button, { Size } from "./Button";
import Modal from "./Modal";

import WalletConnectLogo from "../assets/walletconnect.svg";
import Wallet from "../assets/wallet.svg";

import MetamaskLogo from "../assets/metamask.svg";
import { useEffect } from "react";
import { useGlobalState } from "../AppStateHolder";
import { WalletConnectConnector } from "../utils/WalletConnectConnector";

type Props = {
  size?: Size;
};

const RPC_URLS = {
  1: "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213",
};

export enum ConnectorNames {
  Injected = "Metamask",
  WalletConnect = "WalletConnect",
}

const LogoMap = {
  [ConnectorNames.Injected]: MetamaskLogo,
  [ConnectorNames.WalletConnect]: WalletConnectLogo,
};

export const injected = new InjectedConnector({});

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: [1],
  qrcode: true,
  rpc: RPC_URLS,
});

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect,
};

function shortenAddress(str) {
  return str.substr(0, 5) + "..." + str.substr(str.length - 4, str.length);
}

export default function WalletConnect({ size = "sm" }: Props) {
  const { activate, deactivate, error, active } = useWeb3React();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { canAccessApp, account, setViewOnlyAddress } = useGlobalState();

  useEffect(() => {
    console.error("err", error);
  }, [error]);

  const activateWallet = (name: ConnectorNames) => {
    setIsModalVisible(false);
    activate(connectorsByName[name]);
  };

  const disconnect = () => {
    if (active) {
      deactivate();
    }
    setViewOnlyAddress('');
    setIsModalVisible(false);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  }

  const buttonType = canAccessApp ? "secondary" : "primary";
  const icon = canAccessApp ? (
    <Jazzicon diameter={17} seed={parseInt(account)} />
  ) : <Wallet />;

  return (
    <div>
      <Button
        type={buttonType}
        size={size}
        onClick={() => setIsModalVisible(true)}
        icon={icon}
      >
        {canAccessApp && shortenAddress(account)}
        {!canAccessApp && "Connect Wallet"}
      </Button>
      {isModalVisible && (
        <Modal onClose={closeModal}>
          <div className="bg-perp-gray-300 rounded-lg flex flex-col justify-between">
            <h3 className="text-md text-center text-white font-medium mb-4">
              Choose Wallet
            </h3>
            {Object.keys(connectorsByName).map((connector) => {
              const Logo = LogoMap[connector];
              return (
                <Button
                  key={`connector-${connector}`}
                  icon={<Logo />}
                  isFullWidth
                  className="mb-2"
                  type="secondary"
                  size="sm"
                  onClick={() => activateWallet(connector as ConnectorNames)}
                >
                  {connector}
                </Button>
              );
            })}
            {canAccessApp && (
              <Button
                isFullWidth
                size="sm"
                onClick={disconnect}
                type="destructive"
              >
                Disconnect
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
