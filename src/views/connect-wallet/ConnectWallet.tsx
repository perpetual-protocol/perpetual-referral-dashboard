import React from 'react';
import Wallet from '../../assets/subtract.svg';
import DiamondHands from '../../assets/diamond-hands.svg';

import Button from '../../components/Button';
import { useWeb3React } from '@web3-react/core';
import {
  ConnectorNames,
  connectorsByName
} from '../../components/WalletConnect';

type Props = {};

export default function ConnectWallet(props: Props) {
  const { activate } = useWeb3React();

  const activateWallet = (name: ConnectorNames) => {
    activate(connectorsByName[name]);
  };
  return (
    <div style={{ maxWidth: '1200px' }} className='w-full flex flex-col items-center justify-center mt-20 mx-auto'>
      <div className='mb-12'>
        <DiamondHands />
      </div>
      <div className='mb-8'>
        <h1 className='text-white text-3xl font-bold'>
          Please connect your wallet
        </h1>
      </div>
      <Button
        onClick={() => activateWallet(ConnectorNames.Injected)}
        icon={<Wallet />}
      >
        Connect your wallet
      </Button>
    </div>
  );
}
