import { formatUnits } from '@ethersproject/units';
import { eachDayOfInterval, endOfWeek, startOfWeek, subWeeks } from 'date-fns';
import dayjs from 'dayjs';
import { sum, sumBy } from 'lodash';
import { useQuery } from 'react-query';
import { SUBGRAPH } from '../utils/http';
import { calculateRefereesWeeklyVolume } from './useReferral';
import useStaking from './useStaking';
import useTrading, {
  getLastNWeeks,
  getTraderDayData
} from './useTrading';

export const refereeTiers = {
  1: {
    staked: 0,
    usd_cap: 200,
    rebate: 0.05
  },
  2: {
    staked: 100,
    usd_cap: 500,
    rebate: 0.1
  },
  3: {
    staked: 1000,
    usd_cap: 800,
    rebate: 0.15
  },
  4: {
    staked: 10000,
    usd_cap: 1200,
    rebate: 0.2
  },
  5: {
    staked: 100000,
    usd_cap: 25000,
    rebate: 0.3
  }
};

export const referrerTiers = {
  1: {
    staked: 0,
    usd_cap: 300,
    rebate: 0.05
  },
  2: {
    staked: 100,
    usd_cap: 900,
    rebate: 0.1
  },
  3: {
    staked: 1000,
    usd_cap: 1440,
    rebate: 0.15
  },
  4: {
    staked: 10000,
    usd_cap: 2160,
    rebate: 0.3
  },
  5: {
    staked: 50000,
    usd_cap: 5000,
    rebate: 0.4
  },
  6: {
    staked: 100000,
    usd_cap: 10000,
    rebate: 0.5
  }
};

function getCurrentWeek() {
  const startOfWeek = dayjs().utc().startOf('week');
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    daysOfWeek.unshift(startOfWeek.add(i, 'days'));
  }
  return daysOfWeek.map(d => ({
    start: Math.round(dayjs(d).utc().startOf('day').valueOf() / 1000),
    end: Math.round(dayjs(d).utc().endOf('day').valueOf() / 1000)
  }));
}

export function calculateRefereeRewards(fees: number, stakedPerp: number) {
  const tier = Object.values(refereeTiers)
    .reverse()
    .find(t => stakedPerp >= t.staked);
  if (tier) {
    const rebate = fees * tier.rebate;
    const cappedRebate = rebate > tier.usd_cap ? tier.usd_cap : rebate;
    return { tier, rebateUSD: cappedRebate };
  }
  return { tier, rebateUSD: 0 };
}

async function getWeeklyRefereeFee(account: string) {
  const dayDataResponse = await getTraderDayData(
    account,
    getLastNWeeks(1)
  );
  const dayDatas = (dayDataResponse || []).map(
    e => e.data?.traderDayDatas
  );
  const aggregatedFees = dayDatas.map(dayData => {
    return sumBy(dayData, (d: any) => Number(formatUnits(d.fee, 18)));
  });

  const weeklyTotalFees = sum(aggregatedFees);
  return weeklyTotalFees;
}

export function calculateReferrerRewards(
  stakedPerp: number,
  feesPaid: number
) {
  const tier = Object.values(referrerTiers)
    .reverse()
    .find(t => stakedPerp >= t.staked);
  if (tier) {
    const rebate = feesPaid * tier.rebate;
    const cappedRebate = rebate > tier.usd_cap ? tier.usd_cap : rebate;
    return { tier, rebateUSD: cappedRebate };
  }
  return { tier, rebateUSD: 0 };
}

export default function useRewards(referees: string[] = []) {
  const { weeklyTradingFee } = useTrading(getCurrentWeek());
  const { data: stakedPerp, isLoading: isLoadingStakingData } = useStaking();

  const { data: referrerRewards, isLoading } = useQuery(
    ['referrerRebate', { stakedPerp, weeklyTradingFee }],
    () => calculateReferrerRewards(Number(stakedPerp), 0),
    {
      enabled: referees.length > 0 && !isLoadingStakingData
    }
  );

  const refereeRewards = calculateRefereeRewards(
    weeklyTradingFee,
    Number(stakedPerp)
  );

  return {
    refereeRewards,
    referrerRewards,
    isLoading
  };
}
