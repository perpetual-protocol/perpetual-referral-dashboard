import React, { ChangeEvent } from 'react';

import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Copy from '../../assets/copy.svg';
import useReferral, { callReferrerContract } from '../../hooks/useReferral';
import useStaking from '../../hooks/useStaking';
import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useMutation } from 'react-query';
import StatCard from '../../components/StatCard';
import PerpLogoGreen from '../../assets/logo-green.svg';
import { useEffect } from 'react';
import { useToast } from '../../App';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LineChart from '../../components/LineChart';
import Wallet from '../../assets/subtract.svg';
import RewardsTiers from '../../components/RewardsTiers';

type Props = {};

export default function MyReferral(props: Props) {
  const { referralCode, totalReferees } = useReferral();
  const { data } = useStaking();
  const { showToast } = useToast();

  // const { mutateAsync: setReferralCode } = useMutation(() =>
  //   callReferrerContract(library.getSigner(), 'setReferralCode', [refereeCode])
  // );

  // const onRefereeCodeChange = (e: ChangeEvent) => {
  //   setRefereeCode((e.target as any).value);
  // };

  // const addReferralCode = async () => {
  //   if (referralCodeExists) {
  //     setReferralCode();
  //   }
  // };

  return (
    <>
      {referralCode && (
        <>
          {/* {!isReferee && (
        <Modal>
          <h1 className='text-white font-semibold text-lg text-center mb-5'>
            Please enter a referral code to start trading.
          </h1>
          <Input onChange={onRefereeCodeChange} placeholder='Referral Code' />
          {!referralCodeExists && (
            <span className='text-perp-red text-sm'>
              This referral code does not exist.
            </span>
          )}
          <div className='mt-4'>
            <Button isFullWidth onClick={addReferralCode}>
              Submit
            </Button>
          </div>
        </Modal>
      )} */}
          <div className='flex justify-between col-span-12 p-6 border-opacity-10 border rounded-xl'>
            <span className='text-lg text-white font-bold'>
              My Code: {referralCode}
            </span>
            <CopyToClipboard
              text={referralCode}
              onCopy={() => showToast('Copied code to clipboard')}
            >
              <button>
                <div className='flex'>
                  <Copy />
                  <span className='ml-2 text-perp-cyan font-semibold hover:text-perp-cyan-secondary'>
                    Copy Referral Link
                  </span>
                </div>
              </button>
            </CopyToClipboard>
          </div>
          <StatCard
            icon={<PerpLogoGreen />}
            value={totalReferees}
            title='Total Traders Referred'
          />
          <StatCard
            icon={<PerpLogoGreen />}
            value={4000}
            title='Weekly Trading Volume'
          />
          <StatCard
            icon={<PerpLogoGreen />}
            value={4000}
            title='Weekly Rewards'
          />
          <div className='col-span-12 mb-8 mt-8'>
            <h5 className='text-white font-bold text-lg mb-4'>
              Weekly Trading Volume
            </h5>
            <div
              className='bg-perp-gray-300 rounded-2xl p-4'
              style={{ height: '350px' }}
            >
              <LineChart />
            </div>
          </div>
          <div className='col-span-12 mb-8'>
            <h5 className='text-white font-bold text-lg mb-4'>
              Weekly Trading Volume
            </h5>
            <div
              className='bg-perp-gray-300 rounded-2xl p-4'
              style={{ height: '350px' }}
            >
              <LineChart />
            </div>
          </div>
          <div className='col-span-6'>
            <h5 className='text-white text-lg mb-4'>Rewards Tiers</h5>
            <p className='text-perp-gray-50 mb-4'>
              Explainer text to go Lorem ipsum dolor sit amet, consectetur
              adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat. Duis aute irure dolor in reprehenderit in voluptate
              velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
              occaecat cupidatat non proident, sunt in culpa qui officia
              deserunt mollit anim id est laborum."
            </p>
            <Button onClick={() => false} icon={<Wallet />}>
              Staked Perp
            </Button>
          </div>
          <div
            className='col-span-6 border border-opacity-10 rounded-lg p-4 pb-0 pt-3'
            style={{ height: 'fit-content' }}
          >
            <RewardsTiers />
          </div>
        </>
      )}
      {
        !referralCode &&
        <div className='col-span-12'>
            <p className='text-center bg-perp-red p-4 rounded-lg'>
                Looks like you don't have a referral code yet. Contact the Perpetual team to arrange one.
            </p>
        </div>
      }
    </>
  );
}
