import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import React from 'react';
import { useState } from 'react';
import Jazzicon from 'react-jazzicon';
import Button from './Button';
import Modal from './Modal';

import WalletConnectLogo from '../assets/walletconnect.svg';
import MetamaskLogo from '../assets/metamask.svg';
import { useEffect } from 'react';

type Props = {};

const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213'
};

export enum ConnectorNames {
  Injected = 'Metamask',
  WalletConnect = 'WalletConnect'
}

const LogoMap = {
  [ConnectorNames.Injected]: MetamaskLogo,
  [ConnectorNames.WalletConnect]: WalletConnectLogo
};

export const injected = new InjectedConnector({
  supportedChainIds: [100, 1337]
});

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: [1],
  qrcode: true,
  rpc: RPC_URLS,
  pollingInterval: 6000
});

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect
};

function shortenAddress(str) {
  return str.substr(0, 5) + '...' + str.substr(str.length - 4, str.length);
}

export default function WalletConnect(props: Props) {
  const { activate, account, active, deactivate, error } = useWeb3React();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    console.error('err', error);
  }, [error]);

  const activateWallet = (name: ConnectorNames) => {
    setIsModalVisible(false);
    activate(connectorsByName[name]);
  };

  const disconnect = () => {
    deactivate();
    setIsModalVisible(false);
  }

  const buttonType = active ? 'secondary' : 'primary';
  const icon = active ? (
    <Jazzicon diameter={17} seed={parseInt(account)} />
  ) : null;

  return (
    <div>
      <Button
        type={buttonType}
        size='sm'
        // onClick={() => activateWallet(ConnectorNames.Injected)}
        onClick={() => setIsModalVisible(true)}
        icon={icon}
      >
        {active && shortenAddress(account)}
        {!active && 'Connect Wallet'}
      </Button>
      {isModalVisible && (
        <Modal>
          <div className='bg-perp-gray-300 rounded-lg'>
            <h3 className='text-md text-center text-white font-medium mb-4'>
              Choose Wallet
            </h3>
            {Object.keys(connectorsByName).map(connector => {
              const Logo = LogoMap[connector];
              return (
                <Button
                  key={`connector-${connector}`}
                  icon={<Logo />}
                  isFullWidth
                  className='mb-2'
                  type='secondary'
                  size='sm'
                  onClick={() => activateWallet(connector as ConnectorNames)}
                >
                  {connector}
                </Button>
              );
            })}
            {active && (
              <Button
                isFullWidth
                size='sm'
                onClick={disconnect}
                type='destructive'
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
