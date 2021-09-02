import dayjs from "dayjs";
import { useQuery } from "react-query";
import { getReferrerRewards } from "../views/report/Report";
import useStaking from "./useStaking";
import useTrading from "./useTrading";

export const refereeTiers = {
  1: {
    staked: 0,
    usd_cap: 200,
    rebate: 0.4,
    tier: 1
  },
  2: {
    staked: 100,
    usd_cap: 500,
    rebate: 0.4,
    tier: 2
  },
  3: {
    staked: 1000,
    usd_cap: 800,
    rebate: 0.4,
    tier: 3
  },
  4: {
    staked: 10000,
    usd_cap: 1200,
    rebate: 0.4,
    tier: 4
  },
  5: {
    staked: 100000,
    usd_cap: 25000,
    rebate: 0.4,
    tier: 5
  },
};

export const referrerTiers = {
  1: {
    staked: 0,
    usd_cap: 300,
    rebate: 0.7,
    tier: 1
  },
  2: {
    staked: 100,
    usd_cap: 900,
    rebate: 0.7,
    tier: 2
  },
  3: {
    staked: 1000,
    usd_cap: 1440,
    rebate: 0.7,
    tier: 3
  },
  4: {
    staked: 10000,
    usd_cap: 2160,
    rebate: 0.7,
    tier: 4
  },
  5: {
    staked: 50000,
    usd_cap: 5000,
    rebate: 0.7,
    tier: 5
  },
  6: {
    staked: 100000,
    usd_cap: 10000,
    rebate: 0.7,
    tier: 6
  },
};

function getCurrentWeek() {
  const startOfWeek = dayjs().utc().startOf("week");
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    daysOfWeek.unshift(startOfWeek.add(i, "days"));
  }
  return daysOfWeek.map((d) => ({
    start: Math.round(dayjs(d).utc().startOf("day").valueOf() / 1000),
    end: Math.round(dayjs(d).utc().endOf("day").valueOf() / 1000),
  }));
}

export function calculateRefereeRewards(fees: number, stakedPerp: number) {
  const tier = Object.values(refereeTiers)
    .reverse()
    .find((t) => stakedPerp >= t.staked);
  if (tier) {
    const rebate = fees * tier.rebate;
    const cappedRebate = rebate > tier.usd_cap ? tier.usd_cap : rebate;
    return { tier, rebateUSD: cappedRebate };
  }
  return { tier, rebateUSD: 0 };
}

export function calculateReferrerRewards(stakedPerp: number, feesPaid: number) {
  const tier = Object.values(referrerTiers)
    .reverse()
    .find((t) => stakedPerp >= t.staked);
  if (tier) {
    const rebate = feesPaid * tier.rebate;
    const cappedRebate = rebate > tier.usd_cap ? tier.usd_cap : rebate;
    return { tier, rebateUSD: cappedRebate };
  }
  return { tier, rebateUSD: 0 };
}

export default function useRewards(referralCode?: string) {
  const { weeklyTradingFee } = useTrading(getCurrentWeek());
  const { data: stakedPerp, isLoading: isLoadingStakingData } = useStaking();

  const { data: referrerRewards, isLoading } = useQuery(
    ["referrerRebate"],
    () =>
    getReferrerRewards(referralCode),
    {
      enabled: !isLoadingStakingData && referralCode != null,
    }
  );

  const refereeRewards = calculateRefereeRewards(
    weeklyTradingFee,
    Number(stakedPerp)
  );

  const nextRefereeTier = refereeTiers[refereeRewards?.tier?.tier + 1];
  const nextReferrerTier = referrerTiers[referrerRewards?.rebates[0]?.tier + 1];

  return {
    refereeRewards,
    referrerRewards,
    nextRefereeTier,
    nextReferrerTier,
    isLoading,
  };
}
