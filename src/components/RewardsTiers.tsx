import React from 'react';
import numeral from 'numeral';
import { refereeTiers, referrerTiers } from '../hooks/useRewards';

type Props = {
  type: 'referee' | 'referrer';
};

export default function RewardsTiers({ type }: Props) {
  const tiers = type === 'referee' ?  refereeTiers : referrerTiers;
  return (
    <table className='text-white table-fixed w-full'>
      <thead className='uppercase font-medium text-xs text-perp-gray-50'>
        <tr>
          <th className='w-1 pb-4 pt-1 text-left'>Available On</th>
          <th className='w-1 pb-4 pt-1 text-right'>Staked Perp</th>
          <th className='w-1 pb-4 pt-1 text-right'>Rebate</th>
          <th className='w-1 pb-4 pt-1 text-right'>Min Fees</th>
          <th className='w-1 pb-4 pt-1 text-right'>Cap</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(tiers).map(tier => (
          <tr key={`tier-${tier}`} className='border-t border-white border-opacity-10 font-normal'>
            <td className='w-1 py-4 text-left'>Tier {tier}</td>
            <td className='w-1 py-4 text-right'>{numeral(tiers[tier].staked).format('0,0')}</td>
            <td className='w-1 py-4 text-right'>{numeral(tiers[tier].rebate).format('0.0%')}</td>
            <td className='w-1 py-4 text-right'>{numeral(tiers[tier].minFees).format('$0,0')}</td>
            <td className='w-1 py-4 text-right'>{tiers[tier].usd_cap === Infinity ? 'Uncapped' : numeral(tiers[tier].usd_cap).format('$0,0')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
