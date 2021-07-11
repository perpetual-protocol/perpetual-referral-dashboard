import useStaking from './useStaking';
import useTrading from './useTrading';

export const refereeTiers = {
  1: {
    staked: 0,
    usd_cap: 500,
    rebate: 0.05
  },
  2: {
    staked: 100,
    usd_cap: 1000,
    rebate: 0.1
  },
  3: {
    staked: 1000,
    usd_cap: 5000,
    rebate: 0.15
  },
  4: {
    staked: 10000,
    usd_cap: 10000,
    rebate: 0.2
  },
  5: {
    staked: 100000,
    usd_cap: 25000,
    rebate: 0.3
  }
};

function calculateRefereeRewards(fees: number, stakedPerp: number) {
  const tier = Object.values(refereeTiers).reverse().find(t => stakedPerp >= t.staked);
  if (tier) {
    const cappedFee = fees > tier.usd_cap ? tier.usd_cap : fees;
    const rebateUSD = cappedFee * tier.rebate;
    return { tier, rebateUSD };
  }
  return { tier, rebateUSD: 0 };
}

export default function useRewards() {
  const { weeklyTradingFee } = useTrading();
  const { data: stakedPerp } = useStaking();

  const rewardsUSD = calculateRefereeRewards(
    weeklyTradingFee,
    Number(stakedPerp)
  );

  return {
    ...rewardsUSD
  };
}
