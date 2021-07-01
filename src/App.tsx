import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import ethers from 'ethers';
import { Route } from 'wouter';
import Home from './views/home/Home';
import AppNav from './views/app-nav/AppNav';
import { Web3Provider } from '@ethersproject/providers';

function getLibrary(provider) {
  return new Web3Provider(provider);
}

export default function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className='flex flex-col w-full h-full bg-perp-body font-body subpixel-antialiased'>
        <AppNav />
        <Route path='/home' component={Home} />
      </div>
    </Web3ReactProvider>
  );
}
