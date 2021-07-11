import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import React from 'react';
import Jazzicon from 'react-jazzicon';
import Button from './Button';

type Props = {};

export enum ConnectorNames {
  Injected = 'Injected'
}

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 1337]
});

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected
};

function shortenAddress(str) {
  return str.substr(0, 5) + '...' + str.substr(str.length - 4, str.length);
}

export default function WalletConnect(props: Props) {
  const { activate, account, active } = useWeb3React();

  const activateWallet = (name: ConnectorNames) => {
    activate(connectorsByName[name]);
  };

  const buttonType = active ? 'secondary' : 'primary';
  const icon = active ? (
    <Jazzicon diameter={17} seed={parseInt(account)} />
  ) : null;

  return (
    <Button
      type={buttonType}
      size='sm'
      onClick={() => activateWallet(ConnectorNames.Injected)}
      icon={icon}
    >
      {active && shortenAddress(account)}
      {!active && 'Connect Wallet'}
    </Button>
  );
}
