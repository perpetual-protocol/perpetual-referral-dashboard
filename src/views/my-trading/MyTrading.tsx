import { format, fromUnixTime } from 'date-fns';
import React from 'react';
import LineChart from '../../components/LineChart';
import StatCard from '../../components/StatCard';
import useTrading from '../../hooks/useTrading';
import PerpLogoGreen from '../../assets/logo-green.svg';
import USDCLogo from '../../assets/usdc-logo.svg';
import useStaking from '../../hooks/useStaking';
import Button from '../../components/Button';
import Wallet from '../../assets/subtract.svg';
import { sum } from 'lodash';
import RewardsTiers from '../../components/RewardsTiers';
import useRewards from '../../hooks/useRewards';

type Props = {};

export default function MyTrading(props: Props) {
  const { volumeData, weeklyTradingVolume, weeklyTradingFee } = useTrading();
  const { data } = useStaking();
  const { tier, rebateUSD } = useRewards();

  const chartData = {
    values: volumeData.map(v => v.volume),
    axis: volumeData.map(v =>
      format(fromUnixTime(Number(v.timestamp || 0)), 'E')
    )
  };

  console.log('fee', weeklyTradingFee);

  return (
    <>
      <StatCard
        icon={<PerpLogoGreen />}
        value={Number(data)}
        title='Staked Perp'
      />
      <StatCard
        icon={<USDCLogo />}
        value={weeklyTradingVolume}
        title='Weekly Trading Volume'
        format='$0,0.0'
      />
      <StatCard
        icon={<USDCLogo />}
        value={rebateUSD}
        title='Weekly Rewards'
        max={tier?.usd_cap}
      />
      <div className='col-span-12 mb-8'>
        <h5 className='text-white font-bold text-lg mb-4'>
          Weekly Trading Volume
        </h5>
        <div
          className='bg-perp-gray-300 rounded-2xl p-4'
          style={{ height: '350px' }}
        >
          <LineChart data={chartData} />
        </div>
      </div>
      <div className='col-span-12 sm:col-span-6'>
        <h5 className='text-white text-lg mb-4'>Rewards Tiers</h5>
        <p className='text-perp-gray-50 mb-4'>
          Explainer text to go Lorem ipsum dolor sit amet, consectetur
          adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
          irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
          sunt in culpa qui officia deserunt mollit anim id est laborum."
        </p>
        <Button onClick={() => false} icon={<Wallet />}>
          Staked Perp
        </Button>
      </div>
      <div
        className='col-span-12 sm:col-span-6 border border-opacity-10 rounded-lg p-4 pb-0 pt-3'
        style={{ height: 'fit-content' }}
      >
        <RewardsTiers />
      </div>
    </>
  );
}
