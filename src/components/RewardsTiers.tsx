import React from 'react';

type Props = {};

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

export default function RewardsTiers(props: Props) {
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
        {tiers.map(tier => (
          <tr key={`tier-${tier.tier}`} className='border-t border-white border-opacity-10 font-normal'>
            <td className='w-1 py-4 text-left'>Tier {tier.tier}</td>
            <td className='w-1 py-4 text-right'>{tier.sperp_requirement}</td>
            <td className='w-1 py-4 text-right'>{tier.usd_cap}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
