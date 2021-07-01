import React from 'react';

import Pipe from '../../assets/pipe.svg';
import PerpLogo from '../../assets/logo.svg';
import WalletConnect from '../../components/WalletConnect';

type Props = {};

export default function AppNav(props: Props) {
  return (
    <div className='flex w-full p-6 justify-between items-center    '>
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
  );
}
