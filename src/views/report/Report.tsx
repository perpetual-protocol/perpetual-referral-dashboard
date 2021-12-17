import { formatUnits } from "@ethersproject/units";
import { sum } from "lodash";
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
  "referee",
  "usd_cap",
  "totalFeesPaid",
  "rebateUSD",
];

const referrerRewardsFields = ["referrer", "code", "usd_cap", "rebateUSD"];

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

export async function getStakedPerp(account: string) {
  const response = await STAKED_SUBGRAPH(`
        query {
            staker(id: "${account.toLowerCase()}") {
                totalStaked
            }
        }
    `);
  return Number(formatUnits(response?.data?.staker?.totalStaked || "0", 18));
}

async function getFeesByTraderByReferralCode(
  referralCodes: ReferralAndOwner[],
  weeksToGoBack: number
) {
  // last complete week Sunday UTC 00:00 to Sunday UTC 00:00
  const feesPaid = await Promise.all(
    referralCodes.map(async (code) => {
      const traderFeesPaid = await getTotalFeesPaidByReferralCode(
        weeksToGoBack,
        code.id
      );
      return {
        ...code,
        traderFeesPaid,
      };
    })
  );
  return feesPaid;
}

export async function getReferrerRewards(
  referralCodes: ReferralAndOwner[],
  weeksToGoBack: number
) {
  // gets all the fees paid by traders
  const codeFees = await getFeesByTraderByReferralCode(
    referralCodes,
    weeksToGoBack
  );

  const rebates = await Promise.all(
    // calculate the rebate for the referrer partner by calculating
    // the rebate for the 'trader' with the amount of staked perp
    // for the 'referrer partner' but using the 'referrer partner' tiers
    (Object.values(codeFees) || []).map(async (referrerAndFees) => {
      const stakedPerp = await getStakedPerp(referrerAndFees.owner);
      let referrerRebate = 0;
      let tier = 0;
      let usd_cap = 0;
      for (const feesPaidByTrader of Object.values(
        referrerAndFees.traderFeesPaid
      )) {
        const rebate = calculateReferrerRewards(stakedPerp, feesPaidByTrader);
        referrerRebate = referrerRebate + rebate.rebateUSD;
        usd_cap = rebate.tier.usd_cap;
        tier = rebate.tier.tier;
      }
      return {
        referrer: referrerAndFees.owner,
        rebateUSD: referrerRebate,
        code: referrerAndFees.id,
        tier,
        usd_cap,
      };
    })
  );
  const csv = parse(rebates, { fields: referrerRewardsFields });
  return {
    csv,
    rebates,
  };
}

async function getFeesPaidByReferees(
  weeksToGoBack: number,
  referralCode?: string
) {
  const week = getLastNWeeks(weeksToGoBack)[0];
  console.log("generating for", week);
  let allRefereesWithFeesPaid: Record<string, any>[] = [];
  let needToFetchMoreReferees = true;
  let skip = 0;
  let additionalFilter = referralCode ? `, refereeCode: "${referralCode}"` : "";
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
            dayData(where: { date_gte: ${week.start}, date_lt: ${week.end}}) {
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

async function getTotalFeesPaidByReferralCode(
  weeksToGoBack: number,
  referralCode?: string
) {
  const week = getLastNWeeks(weeksToGoBack)[0];
  let needToFetchMoreDays = true;
  let needToFetchMoreTraderData = true;
  let skip = 0;
  let skipTraderData = 0;
  let additionalFilter = referralCode
    ? `, referralCode: "${referralCode}"`
    : "";
  const feesPerTrader: Record<string, number> = {};

  // don't know how many total codes there are
  // so we run an exhaustive request loops to
  // check if there are more to get a full list
  while (needToFetchMoreDays) {
    while (needToFetchMoreTraderData) {
      const dayDatas = (
        await SUBGRAPH(`
        query {
          referralCodeDayDatas(where: { date_gte: ${week.start}, date_lt: ${week.end}${additionalFilter} }) {
            id
            tradingVolume
            date
            fees
            traderData(first: 1000, skip: ${skipTraderData}) {
              id
              fees
              trader {
                id
              }
            }
          }
        }
      `)
      ).data?.referralCodeDayDatas;
      for (const dayData of dayDatas) {
        const traderData = dayData?.traderData || [];
        for (const data of traderData) {
          if (!feesPerTrader[data.trader.id]) {
            feesPerTrader[data.trader.id] = Number(data.fees);
          } else {
            feesPerTrader[data.trader.id] =
              feesPerTrader[data.trader.id] + Number(data.fees);
          }
        }
      }

      if (dayDatas?.length >= 999) {
        needToFetchMoreDays = true;
        skip = skip + 999;
      } else {
        needToFetchMoreDays = false;
      }

      if (dayDatas?.traderData?.length >= 999) {
        needToFetchMoreTraderData = true;
        skipTraderData = skipTraderData + 999;
      } else {
        needToFetchMoreTraderData = false;
      }
    }
  }
  return feesPerTrader;
}

async function getRefereeRewards(
  referralCodes: ReferralAndOwner[],
  weeksToGoBack: number
) {
  // list of all referees and their paid fees
  // gets all the fees paid by traders
  const codeFees = await getFeesByTraderByReferralCode(
    referralCodes,
    weeksToGoBack
  );

  const aggregateFeesPaidByReferees: Record<string, number> = {};
  for (const feeData of codeFees) {
    const feesPaidByTraders = feeData.traderFeesPaid || {};
    for (const referee of Object.keys(feesPaidByTraders)) {
      const feesPaid = feesPaidByTraders[referee];
      if (!aggregateFeesPaidByReferees[referee]) {
        aggregateFeesPaidByReferees[referee] = feesPaid;
      } else {
        aggregateFeesPaidByReferees[referee] =
          aggregateFeesPaidByReferees[referee] + feesPaid;
      }
    }
  }

  const rewards = await Promise.all(
    Object.keys(aggregateFeesPaidByReferees).map(async (referee) => {
      const stakedPerp = await getStakedPerp(referee);
      const rebate = calculateRefereeRewards(
        Number(aggregateFeesPaidByReferees[referee]),
        stakedPerp
      );
      return {
        referee,
        totalFeesPaid: aggregateFeesPaidByReferees[referee],
        rebateUSD: rebate.rebateUSD,
        usd_cap: rebate?.tier.usd_cap,
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

  const { data: referrerRewardsCSV, isSuccess: generatedReferrerRewardsCSV } =
    useQuery(["referrerRewards"], () => getReferrerRewards(referralCodes, 1), {
      enabled: referralCodes?.length > 0,
    });

  const { data: refereeRewardsCSV, isSuccess: generatedRefereeRewardsCSV } =
    useQuery(["refereeRewards"], () => getRefereeRewards(referralCodes, 1), {
      enabled: referralCodes?.length > 0,
    });

  const week = getLastNWeeks(2)[0];
  const start = dayjs(week.start * 1000)
    .utc()
    .format("DD-MM-YYYY HH:mm");
  const end = dayjs(week.end * 1000)
    .utc()
    .format("DD-MM-YYYY HH:mm");

  return (
    <div className="flex items-center justify-center w-full h-full flex-col">
      <span className="text-white">
        Generated rewards for {start} to {end}
      </span>
      <div className="mb-2 mt-2">
        {generatedReferrerRewardsCSV && (
          <CSVLink
            filename={`perp-referrer-rewards-${start}to${end}.csv`}
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
