import { format, fromUnixTime } from 'date-fns';
import React, { ChangeEvent } from 'react';
import LineChart from '../../components/LineChart';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';
import useTrading from '../../hooks/useTrading';
import PerpLogoGreen from '../../assets/logo-green.svg';
import USDCLogo from '../../assets/usdc-logo.svg';
import useStaking from '../../hooks/useStaking';
import Button from '../../components/Button';
import Wallet from '../../assets/subtract.svg';
import RewardsTiers from '../../components/RewardsTiers';
import useRewards from '../../hooks/useRewards';
import Input from '../../components/Input';
import { useMutation } from 'react-query';
import { callReferrerContract } from '../../hooks/useReferral';
import { useWeb3React } from '@web3-react/core';
import { useReferee } from '../../hooks/useReferee';
import { useState } from 'react';
import Skeleton from '../../components/Skeleton';
import dayjs from 'dayjs';
import notify from 'bnc-notify';
import { useNotify } from '../../App';

type Props = {
  setActiveTab: Function;
};

export default function MyTrading(props: Props) {
  const [refereeCode, setRefereeCode] = useState('');
  const [isConfirmingTx, setIsConfirmingTx] = useState(false);
  const {
    volumeData,
    weeklyTradingVolume,
    isLoading: isLoadingTradeData
  } = useTrading();
  const { referralCodeExists, isReferee, retryRefereeRequest } =
    useReferee(refereeCode);
  const { library } = useWeb3React();
  const { data, isLoading: isLoadingStakingData } = useStaking();
  const {
    refereeRewards: { tier, rebateUSD },
    nextRefereeTier
  } = useRewards();
  const { notify } = useNotify();

  const isLoadingData = isLoadingTradeData || isLoadingStakingData;
  const cardState = nextRefereeTier ? 'error' : 'normal';
  const stakeMoreText = nextRefereeTier ? `Stake ${nextRefereeTier?.staked} PERP to reach the next tier and unlock more rewards.` : '';

  const chartData = {
    values: volumeData.map(v => v.volume),
    axis: volumeData.map(
      v =>
        `${dayjs(v.timestamp.start).utc().format('DD/MM/YY')} - \n${dayjs(
          v.timestamp.end
        )
          .utc()
          .format('DD/MM/YY')}`
    )
  };

  const { mutateAsync: setReferralCode } = useMutation(() =>
    callReferrerContract(library.getSigner(), 'setReferralCode', [refereeCode])
  );

  const onRefereeCodeChange = (e: ChangeEvent) => {
    setRefereeCode((e.target as any).value);
  };

  const addReferralCode = async () => {
    if (referralCodeExists) {
      const tx = await setReferralCode();
      if (tx) {
        setIsConfirmingTx(true);
        const { emitter } = notify.hash(tx.hash);
        emitter.on('txConfirmed', async () => {
          setIsConfirmingTx(false);
          await retryRefereeRequest();
        })
        emitter.on('txFailed', () => {
          setIsConfirmingTx(false);
        })
      }
    }
  };

  return (
    <>
      {!isReferee && (
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
              {isConfirmingTx ? 'Loading...' : 'Submit'}
            </Button>
            <Button
              onClick={() => props.setActiveTab('my-referrals')}
              className='mt-2'
              isFullWidth
              type='secondary'
            >
              I am a referrer
            </Button>
          </div>
        </Modal>
      )}
      <StatCard
        icon={<PerpLogoGreen />}
        value={Number(data)}
        title='Staked Perp'
        isLoading={isLoadingData}
      />
      <StatCard
        icon={<USDCLogo />}
        value={weeklyTradingVolume}
        title='Weekly Trading Volume'
        format='$0,0.0'
        isLoading={isLoadingData}
      />
      <StatCard
        icon={<USDCLogo />}
        value={rebateUSD}
        title='Weekly Rewards'
        max={tier?.usd_cap}
        isLoading={isLoadingData}
        subtext={stakeMoreText}
        tooltip={
          <div className='flex flex-col w-52'>
            <span className='mb-2'>Rewards are calculated in USD but are distributed in PERP</span>
            <span>The more transactions you make, the more perps rewards you will get, and the rewards will be credited to your account every week.</span>
          </div>
        }
        state={cardState}
      />
      <div className='col-span-12 mb-8'>
        <h5 className='text-white font-bold text-lg mb-4'>
          Weekly Trading Volume
        </h5>
        {isLoadingData && (
          <Skeleton height={350} className='bg-perp-gray-300 rounded-2xl p-4' />
        )}
        {!isLoadingData && (
          <div
            className='bg-perp-gray-300 rounded-2xl p-4'
            style={{ height: '350px' }}
          >
            <LineChart name='Weekly Trading Volume' data={chartData} />
          </div>
        )}
      </div>
      <div className='col-span-12 sm:col-span-6'>
        <h5 className='text-white text-lg mb-4'>Rewards Tiers</h5>
        <p className='text-perp-gray-50 mb-4'>
        You can increase your weekly caps by staking PERP with the address you use for trading. Please see caps (in USD) for each staking tier on the right. Keep in mind that all rewards are paid in PERP.
        </p>
        <a href='https://staking.perp.exchange' target='_blank'>
          <Button onClick={() => false} icon={<Wallet />}>
            Staked Perp
          </Button>
        </a>
      </div>
      <div
        className='col-span-12 sm:col-span-6 border border-opacity-10 rounded-lg p-4 pb-0 pt-3'
        style={{ height: 'fit-content' }}
      >
        <RewardsTiers type='referee' />
      </div>
    </>
  );
}
