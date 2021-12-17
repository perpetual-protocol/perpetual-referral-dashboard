import { BaseProvider } from "@ethersproject/providers";
import { formatUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { differenceInCalendarDays, fromUnixTime } from "date-fns";
import { sumBy } from "lodash";
import { useQuery } from "react-query";
import { SUBGRAPH } from "../utils/http";
import { getStakedPerp } from "../views/report/Report";
import { callReferrerContract } from "./useReferral";
import { referrerTiers } from "./useRewards";
import { getLastNWeeks } from "./useTrading";

const minimumVIPTier = Object.values(referrerTiers).find(tier => tier.minFees > 0)
export const vipTiers = Object.values(referrerTiers).filter(
  (tier) => tier.minFees > 0
);

async function assignVip(
  provider: BaseProvider,
  partnerAddress: string,
  vipTier: string
) {
  return await callReferrerContract(provider, "_upsertUncappedPartner", [
    partnerAddress,
    vipTier,
  ]);
}

async function removeVip(provider: BaseProvider, partnerAddress: string) {
  return await callReferrerContract(provider, "_removeUncappedPartner", [
    partnerAddress,
  ]);
}

async function batchUpdatePartners(
  provider: BaseProvider,
  partnerAddresses: string[],
  tiersToUpdateTo: string[]
) {
  return await callReferrerContract(provider, "_batchUpdateUncappedPartner", [
    partnerAddresses,
    tiersToUpdateTo,
  ]);
}

async function getOwner(
  provider: BaseProvider,
) {
  const owner = await callReferrerContract(provider, "owner", []);
  return owner;
}

export type Eligibility = {
  isEligible: boolean;
  isDowngradable: boolean;
  stakedPerp: number;
  totalFees: number;
  address: string;
  code: string;
  tier: string;
  vipSince: string;
  isInTrialPeriod: boolean;
  maximumTierEligibleFor: number;
};

export function checkPartnerEligibility(
  tier: string,
  sPerp: number,
  totalFees: number
) {
  const tierReqs = referrerTiers[tier];
  if (sPerp >= tierReqs.staked && totalFees >= tierReqs.minFees) {
    return true;
  }
  return false;
}

async function getVIPEligibility() {
  let needToFetchMore = true;
  let skip = 0;
  const week = getLastNWeeks(1)[0];
  const eligibility = [];
  while (needToFetchMore) {
    const vipData = (
      await SUBGRAPH(`
          query {
            referralCodes(where: { vipTier_not: null }) {
                id
                dayData(where: { date_gte: ${week.start}, date_lt: ${week.end} }) {
                    fees
                }
                vipTier
                vipSince
                referrer {
                    id
                }
            }
          }
        `)
    ).data?.referralCodes;

    console.log('esk', vipData)
    for (const data of vipData) {
      const stakedPerp = 4000 || (await getStakedPerp(data?.referrer?.id));
      const totalFees =
        60001 ||
        sumBy(data?.dayData, (day: any) => Number(formatUnits(day.fees, 18)));
      const isEligible = checkPartnerEligibility(
        data.vipTier,
        stakedPerp,
        totalFees
      );
      const isDowngradable = checkPartnerEligibility(
        String(Number(data.vipTier) - 1),
        stakedPerp,
        totalFees
      );
      const isInTrialPeriod = differenceInCalendarDays(
        Date.now(),
        fromUnixTime(data.vipSince)
      ) <= 30;

      let maximumTierEligibleFor = 0;
      for (const tier of vipTiers) {
        const eligiblityForTier = checkPartnerEligibility(
          String(tier.tier),
          stakedPerp,
          totalFees
        );
        if (eligiblityForTier) maximumTierEligibleFor = tier.tier;
      }

      eligibility.push({
        isEligible,
        isDowngradable,
        stakedPerp,
        totalFees,
        address: data.referrer.id,
        code: data.id,
        tier: data.vipTier,
        vipSince: data.vipSince,
        isInTrialPeriod,
        maximumTierEligibleFor
      });
    }

    if (vipData?.length >= 1000) {
      needToFetchMore = true;
      skip = skip + 1000;
    } else {
      needToFetchMore = false;
    }
  }
  return eligibility;
}

export default function useAdmin() {
  const { library, active } = useWeb3React();
  const {
    data: eligiblePartners,
    isLoading: isLoadingEligiblePartners,
    refetch: refreshEligibility,
  } = useQuery<Eligibility[]>(["partnerEligibility"], () => getVIPEligibility());

  const {
    data: owner,
    isLoading: isLoadingOwner,
  } = useQuery<string>(["owner", { active }], () => getOwner(library), {
    enabled: active
  });

  return {
    eligiblePartners,
    isLoadingEligiblePartners,
    minimumVIPTier,
    owner,
    isLoadingOwner,
    assignVip,
    removeVip,
    refreshEligibility,
    batchUpdatePartners
  };
}
