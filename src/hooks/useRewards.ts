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
  getPositionChangedEvents
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

const referrerTiers = {
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

function getFixedLastWeek() {
  const startOfLastWeek = dayjs().utc().subtract(1, 'week').startOf('week');
  const daysOfLastWeek = [];
  for (let i = 0; i < 7; i++) {
    daysOfLastWeek.unshift(startOfLastWeek.add(i, 'days'));
  }
  return daysOfLastWeek.map(d => ({
    start: Math.round(dayjs(d).utc().startOf('day').valueOf() / 1000),
    end: Math.round(dayjs(d).utc().endOf('day').valueOf() / 1000)
  }));
}

function calculateRefereeRewards(fees: number, stakedPerp: number) {
  const tier = Object.values(refereeTiers)
    .reverse()
    .find(t => stakedPerp >= t.staked);
  if (tier) {
    const cappedFee = fees > tier.usd_cap ? tier.usd_cap : fees;
    const rebateUSD = cappedFee * tier.rebate;
    return { tier, rebateUSD };
  }
  return { tier, rebateUSD: 0 };
}

async function getWeeklyRefereeFee(account: string) {
  const eventsResponse = await getPositionChangedEvents(
    account,
    getLastNWeeks(1)
  );
  const positionChangedEvents = (eventsResponse || []).map(
    e => e.data?.positionChangedEvents
  );
  const aggregatedFees = positionChangedEvents.map(pce => {
    return sumBy(pce, (e: any) => Number(formatUnits(e.fee, 18)));
  });

  const weeklyTotalFees = sum(aggregatedFees);
  return weeklyTotalFees;
}

export async function calculateReferrerRewards(
  stakedPerp: number,
  referees: string[] = []
) {
  const weeklyRefererrerFees = await calculateRefereesWeeklyVolume(referees, 1);
  const currentWeek = weeklyRefererrerFees[0];
  const tier = Object.values(referrerTiers)
    .reverse()
    .find(t => stakedPerp >= t.staked);
  if (tier) {
    const cappedFee = Number(currentWeek.fees) > tier.usd_cap ? tier.usd_cap : Number(currentWeek.fees);
    const rebateUSD = cappedFee * tier.rebate;
    return { tier, rebateUSD };
  }
  return { tier, rebateUSD: 0 };
}

export default function useRewards(referees: string[] = []) {
  const { weeklyTradingFee } = useTrading(getFixedLastWeek());
  const { data: stakedPerp, isLoading: isLoadingStakingData } = useStaking();

  const { data: referrerRewards, isLoading } = useQuery(
    ['referrerRebate', { stakedPerp, weeklyTradingFee }],
    () => calculateReferrerRewards(Number(stakedPerp), referees),
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
