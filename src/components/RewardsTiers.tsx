import React from 'react';
import numeral from 'numeral';
import { refereeTiers, referrerTiers } from '../hooks/useRewards';

type Props = {
  type: 'referee' | 'referrer';
};

const tiers = [
  {
    tier: 1,
    sperp_requirement: 0,
    usd_cap: 100
  },
  {
    tier: 2,
    sperp_requirement: 100,
    usd_cap: 500
  },
  {
    tier: 3,
    sperp_requirement: 1000,
    usd_cap: 1000
  },
  {
    tier: 4,
    sperp_requirement: 10000,
    usd_cap: 5000
  },
  {
    tier: 5,
    sperp_requirement: 100000,
    usd_cap: 10000
  }
];

export default function RewardsTiers({ type }: Props) {
  const tiers = type === 'referee' ?  refereeTiers : referrerTiers;
  return (
    <table className='text-white table-fixed w-full'>
      <thead className='uppercase font-medium text-xs text-perp-gray-50'>
        <tr>
          <th className='w-1 pb-4 pt-1 text-left'>Available On</th>
          <th className='w-1 pb-4 pt-1 text-right'>Staked Perp</th>
          <th className='w-1 pb-4 pt-1 text-right'>Amount</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(tiers).map(tier => (
          <tr key={`tier-${tier}`} className='border-t border-white border-opacity-10 font-normal'>
            <td className='w-1 py-4 text-left'>Tier {tiers[tier].tier}</td>
            <td className='w-1 py-4 text-right'>{numeral(tiers[tier].staked).format('0,0')}</td>
            <td className='w-1 py-4 text-right'>{numeral(tiers[tier].usd_cap).format('0,0')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
