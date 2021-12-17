import { useWeb3React } from "@web3-react/core";
import { useQuery } from "react-query";
import { SUBGRAPH } from "../utils/http";
import PerpetualProtocolABI from "../contracts/PerpetualProtocolReferrer.json";
import { BaseProvider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { getLastNWeeks } from "./useTrading";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { last, nth, sumBy, zip } from "lodash";
import { formatUnits } from "@ethersproject/units";
import { useGlobalState } from "../AppStateHolder";
import { referrerTiers } from "./useRewards";
import useStaking from "./useStaking";

const CONTRACT_ADDRESS = "0xcf76A8365A218D799f36030d89f86C8FBCC65a6E";
const DOMAIN = "https://referral.perp.exchange";

export async function callReferrerContract(
  provider: BaseProvider,
  method: string,
  params: any[]
) {
  const contract = new Contract(
    CONTRACT_ADDRESS,
    PerpetualProtocolABI,
    provider
  );
  try {
    const tx = await contract[method](...params);
    if (typeof tx === "string") return tx;
    return tx;
  } catch (err) {
    console.error(err.message);
  }
}

export async function calculateRefereesWeeklyVolume(
  referralCode: string,
  weeks: number = 7
) {
  const _weeks = getLastNWeeks(weeks);
  const refereesDayData = await Promise.all(
    _weeks.map((week) => {
      return SUBGRAPH(`
      query {
        referralCodeDayDatas(where: { date_gte: ${week.start}, date_lt: ${week.end}, referralCode: "${referralCode}"} ) {
          tradingVolume
          fees
          date
        }
      }
    `);
    })
  );

  const dateLabels = _weeks.map(
    (w) =>
      `${dayjs(w.start * 1000)
        .utc()
        .format("DD/MM/YY")} - \n${dayjs(w.end * 1000)
        .utc()
        .format("DD/MM/YY")}`
  );

  const volumes = (refereesDayData || []).map((day) =>
    sumBy(day.data.referralCodeDayDatas, (dayData: any) =>
      Number(formatUnits(dayData.tradingVolume, 18))
    )
  );

  const fees = (refereesDayData || []).map((day) =>
    sumBy(day.data.referralCodeDayDatas, (dayData: any) =>
      Number(formatUnits(dayData.fees, 18))
    )
  );

  return volumes.map((volume, i) => ({
    volume: volume.toString(),
    week: dateLabels[i],
    fees: fees[i].toString(),
  }));
}

async function getWeeklyNewReferees(
  referralCode: string,
  customWeeks: number = 7
) {
  const timestamps = getLastNWeeks(customWeeks);
  const promises = timestamps.map((timestamp) => {
    return SUBGRAPH(`
        query {
            referralCodeDayDatas(where: { referralCode: "${referralCode}", date_gte: ${timestamp.start}, date_lt: ${timestamp.end} }, orderDirection: desc, orderBy: date) {
                date
                newReferees
            }
        }
    `);
  });
  return Promise.all(promises);
}

function getVolumeChange(current: number, last: number) {
  const change = (current - last) / last;
  if (last === 0 && current > 0) return 1;
  return change;
}

async function createReferralCode(code: string, provider: BaseProvider) {
  return await callReferrerContract(provider, 'createReferralCode', [code]);
}

export default function useReferral() {
  const { canAccessApp, account } = useGlobalState();
  const { data: sPerp } = useStaking();
  const [_referees, _setReferees] = useState([]);
  const [_referralCode, _setReferralCode] = useState("");
  const days = getLastNWeeks().map((d) => ({
    start: dayjs(d.start * 1000)
      .utc()
      .toDate(),
    end: dayjs(d.end * 1000)
      .utc()
      .toDate(),
  }));

  const { data: referrerResponse, isLoading: isLoadingReferralCodeData, refetch: refetchReferralCode } =
    useQuery(
      ["referrerCode", { account }],
      () =>
        SUBGRAPH(`
        query {
            trader(id: "${account.toLowerCase()}") {
            id
            referrerCode {
              id
              referees
              vipTier
            }
          }
        }
    `),
      {
        enabled: canAccessApp,
        onSuccess: (response) => {
          _setReferees(response?.data?.trader?.referrerCode?.referees);
          _setReferralCode(response?.data?.trader?.referrerCode?.id);
        },
      }
    );

  const { data: weeklyReferralCodeVolume, isLoading: isLoadingWeeklyVolume } =
    useQuery(
      ["refereesVolume", { _referees }],
      () => calculateRefereesWeeklyVolume(_referralCode),
      {
        enabled: _referralCode !== "",
      }
    );

  const { data: referralCodeDayDatasResponses, isLoading: isLoadingDayDatas } =
    useQuery(
      ["referralCodeDayDatas", { _referralCode }],
      () => getWeeklyNewReferees(_referralCode),
      {
        enabled: _referralCode !== "",
      }
    );

  const currentWeeklyReferralVolume = Number(
    last(weeklyReferralCodeVolume)?.volume
  );
  const lastWeekReferralVolume = Number(
    nth(weeklyReferralCodeVolume, -2)?.volume
  );

  const weeklyReferralVolumeChange = getVolumeChange(
    currentWeeklyReferralVolume,
    lastWeekReferralVolume
  );

  const referralCodeDayDatas =
    referralCodeDayDatasResponses?.map((r) => r.data?.referralCodeDayDatas) ||
    [];

  const formattedDayData = referralCodeDayDatas.map((dayDatas, i) => {
    return {
      newUsers: sumBy(dayDatas, (day: any) => {
        return Number((day?.newReferees || []).length);
      }),
      timestamp: days[i],
    };
  });

  const referralCode = referrerResponse?.data?.trader?.referrerCode?.id;
  const totalReferees =
    referrerResponse?.data?.trader?.referrerCode?.referees?.length;
  const referees = referrerResponse?.data?.trader?.referrerCode?.referees;
  const referralLink = `${DOMAIN}?code=${referralCode}`;
  const isVIP =
    Number(referrerResponse?.data?.trader?.referrerCode?.vipTier) >= 3;
  const _normalTier = Object.values(referrerTiers)
    .filter((t) => t.minFees === 0)
    .reverse()
    .find((t) => sPerp >= t.staked);
  const _vipTier = Number(
    referrerResponse?.data?.trader?.referrerCode?.vipTier
  );
  const vipTier = isVIP ? _vipTier : _normalTier?.tier || 1;
  const vipSince = Number(
    referrerResponse?.data?.trader?.referrerCode?.vipSince
  );

  return {
    referralCode,
    totalReferees,
    referees,
    referralCodeDayData: formattedDayData,
    weeklyRefereeVolumes: weeklyReferralCodeVolume || [],
    currentWeeklyReferralVolume,
    weeklyReferralVolumeChange,
    isLoadingDayDatas,
    isLoadingReferralCodeData,
    isLoadingWeeklyVolume,
    referralLink,
    isVIP,
    vipTier,
    vipSince,
    createReferralCode,
    refetchReferralCode
  };
}
