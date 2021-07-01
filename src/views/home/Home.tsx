import { useWeb3React } from '@web3-react/core';
import React from 'react';

import ConnectWallet from '../connect-wallet/ConnectWallet';

export default function Home(props: unknown) {
  const { active } = useWeb3React();

  return (
    <div className='flex flex-grow flex-col justify-center items-center'>
      {!active && <ConnectWallet />}
    </div>
  );
}
