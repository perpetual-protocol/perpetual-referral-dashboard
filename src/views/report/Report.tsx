import { formatUnits } from "@ethersproject/units";
import { groupBy, sum } from "lodash";
import React from "react";
import { useQuery } from "react-query";
import {
  calculateRefereeRewards,
  calculateReferrerRewards,
} from "../../hooks/useRewards";
import { getLastNWeeks } from "../../hooks/useTrading";
import { STAKED_SUBGRAPH, SUBGRAPH } from "../../utils/http";
import { parse } from "json2csv";
import { CSVLink } from "react-csv";
import Button from "../../components/Button";
import dayjs from "dayjs";

type Props = {};

const rewardsFields = [
  "owner",
  "rebate.rebateUSD",
  "rebate.tier.rebate",
  "totalFeesPaid",
];

const referrerRewardsFields = [
  "referrer",
  "tier",
  "rebateUSD"
];

async function getReferralCodes() {
  let allReferralCodes = [];
  let needToFetchMoreCodes = true;
  let skip = 0;
  // don't know how many total codes there are
  // so we run an exhaustive request loops to
  // check if there are more to get a full list
  while (needToFetchMoreCodes) {
    const referralCodesResponse = await SUBGRAPH(
      `query {
            referralCodes(first: 1000, skip: ${skip}) {
                id
                referrer {
                    id
                }
            }
        }`
    );
    const referralCodes = (
      referralCodesResponse?.data?.referralCodes || []
    ).map((code) => ({ id: code.id, owner: code.referrer.id }));
    allReferralCodes = [...allReferralCodes, ...referralCodes];
    if (referralCodes.length >= 1000) {
      needToFetchMoreCodes = true;
      skip = skip + 1000;
    } else {
      needToFetchMoreCodes = false;
    }
  }
  return allReferralCodes;
}

type ReferralAndOwner = {
  owner: string;
  id: string;
};

type TradingData = {
  owner: string;
  id: string;
  totalFeesPaid: number;
};

async function getStakedPerp(account: string) {
  const response = await STAKED_SUBGRAPH(`
        query {
            staker(id: "${account.toLowerCase()}") {
                totalStaked
            }
        }
    `);
  return Number(formatUnits(response?.data?.staker?.totalStaked || "0", 18));
}

async function getFeesPaidByReferralCode(referralCodes: ReferralAndOwner[]) {
  // last complete week Sunday UTC 00:00 to Sunday UTC 00:00
  const week = getLastNWeeks(2)[0];
  const feesPaid = await Promise.all(
    referralCodes.map(async (code) => {
      const dayDatasResponse = await SUBGRAPH(
        `query {
                referralCodeDayDatas(where: { referralCode: "${code.id}", date_gte: ${week.start}, date_lte: ${week.end}}) {
                    fees
                }
            }`
      );
      const dayDatas = dayDatasResponse.data.referralCodeDayDatas || [];
      const totalFeesPaid = sum(
        dayDatas.map((d) => Number(formatUnits(d.fees, 18)))
      );
      return {
        ...code,
        totalFeesPaid,
      };
    })
  );
  return feesPaid;
}

export async function getReferrerRewards(referralCode?: string) {
  // gets all the fees paid by traders
  const refereeFees = await getFeesPaidByReferees(referralCode, 1);
  // group them (the traders) by the referrer partner
  const refereeDataGroupedByReferrer = groupBy(refereeFees, "codeOwner");

  const rebates = await Promise.all(
    // calculate the rebate for the referrer partner by calculating
    // the rebate for the 'trader' with the amount of staked perp
    // for the 'referrer partner' but using the 'referrer partner' tiers
    (Object.keys(refereeDataGroupedByReferrer) || []).map(async (referrer) => {
      const stakedPerp = await getStakedPerp(referrer);
      let referrerRebate = 0;
      let tier = 0;
      let usd_cap = 0;
      for (const refereeData of refereeDataGroupedByReferrer[referrer]) {
        const rebate = calculateReferrerRewards(
          stakedPerp,
          refereeData.totalFeesPaid
        );
        referrerRebate = referrerRebate + rebate.rebateUSD;
        tier = rebate.tier.tier;
        usd_cap = rebate.tier.usd_cap;
      }
      return {
        referrer,
        rebateUSD: referrerRebate,
        tier,
        usd_cap
      };
    })
  );
  const csv = parse(rebates, { fields: referrerRewardsFields });
  return {
    csv,
    rebates
  }
}

async function getFeesPaidByReferees(referralCode?: string, weeksToGoBack = 2) {
  const week = getLastNWeeks(weeksToGoBack)[0];
  let allRefereesWithFeesPaid: Record<string, any>[] = [];
  let needToFetchMoreReferees = true;
  let skip = 0;
  let additionalFilter = referralCode ? `, refereeCode: "${referralCode}"` : '';
  // don't know how many total codes there are
  // so we run an exhaustive request loops to
  // check if there are more to get a full list
  while (needToFetchMoreReferees) {
    const referees = (
      await SUBGRAPH(`
        query {
          traders(where: { refereeCode_not: null${additionalFilter} }, first: 1000, skip: ${skip}) {
            id
            refereeCode {
              id
              referrer {
                id
              }
            }
            dayData(where: { date_gte: ${week.start}, date_lte: ${week.end}}) {
              fee
            }
          }
        }
      `)
    ).data?.traders;
    for (const referee of referees) {
      const feesPaid = sum(
        (referee.dayData || []).map((d) => Number(formatUnits(d.fee, 18)))
      );
      allRefereesWithFeesPaid.push({
        totalFeesPaid: feesPaid,
        owner: referee.id,
        code: referee.refereeCode.id,
        codeOwner: referee.refereeCode.referrer.id,
      });
    }

    if (referees?.length >= 1000) {
      needToFetchMoreReferees = true;
      skip = skip + 1000;
    } else {
      needToFetchMoreReferees = false;
    }
  }
  return allRefereesWithFeesPaid;
}

async function getRefereeRewards() {
  // list of all referees and their paid fees
  const refereeList = await getFeesPaidByReferees();
  const rewards = await Promise.all(
    refereeList.map(async (referee) => {
      const stakedPerp = await getStakedPerp(referee.owner);
      const rebate = calculateRefereeRewards(
        Number(referee.totalFeesPaid),
        stakedPerp
      );
      return {
        ...referee,
        rebate,
      };
    })
  );
  const csv = parse(rewards, { fields: rewardsFields });
  return csv;
}

export default function Report(props: Props) {
  const { data: referralCodes } = useQuery(["reportReferralCodes"], () =>
    getReferralCodes()
  );

  const { data: referralCodesTradingData } = useQuery(
    ["reportReferralCodesTradingData"],
    () => getFeesPaidByReferralCode(referralCodes),
    {
      enabled: referralCodes?.length > 0,
    }
  );

  const { data: referrerRewardsCSV, isSuccess: generatedReferrerRewardsCSV } =
    useQuery(["referrerRewards"], () => getReferrerRewards());

  const { data: refereeRewardsCSV, isSuccess: generatedRefereeRewardsCSV } =
    useQuery(["refereeRewards"], () => getRefereeRewards());

  const week = getLastNWeeks(2)[0];
  const start = dayjs(week.start * 1000).format("DD-MM-YYYY");
  const end = dayjs(week.end * 1000).format("DD-MM-YYYY");

  return (
    <div className="flex items-center justify-center w-full h-full flex-col">
      <span className="text-white">
        Generated rewards for {start}-{end}
      </span>
      <div className="mb-2 mt-2">
        {generatedReferrerRewardsCSV && (
          <CSVLink
            filename={`perp-referrer-rewards-${start}-${end}.csv`}
            data={referrerRewardsCSV.csv || ""}
          >
            <Button onClick={() => false}>Download Referrer CSV</Button>
          </CSVLink>
        )}
      </div>
      <div>
        {generatedRefereeRewardsCSV && (
          <CSVLink
            filename={`perp-referee-rewards-${start}-${end}.csv`}
            data={refereeRewardsCSV || ""}
          >
            <Button onClick={() => false}>Download Referee CSV</Button>
          </CSVLink>
        )}
      </div>
    </div>
  );
}
