import React from 'react';

import Pipe from '../../assets/pipe.svg';
import PerpLogo from '../../assets/logo.svg';
import WalletConnect from '../../components/WalletConnect';
import { useWeb3React } from '@web3-react/core';

type Props = {};

export default function AppNav(props: Props) {
  const { active } = useWeb3React();
  const bgClass = active ? 'bg-perp-gray-300' : 'bg-perp-body';
  return (
    <div className={`${bgClass} flex justify-center px-4`}>
      <div
        className={`flex w-full py-6 justify-between items-center`}
        style={{ maxWidth: '1200px' }}
      >
        <div className='flex'>
          <div className='mr-4'>
            <PerpLogo />
          </div>
          <div className='mr-4'>
            <Pipe />
          </div>
          <h3 className='text-white font-bold'>Referral</h3>
        </div>
        <div>
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}
