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

const CONTRACT_ADDRESS = "0xF1d5BA04a25A6D88c468af932BFe2B1e78db7B45";

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
    const response = await contract[method](...params);
    return response;
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
        referralCodeDayDatas(where: { date_gte: ${week.start}, date_lte: ${week.end}, referralCode: "${referralCode}"} ) {
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
            referralCodeDayDatas(where: { referralCode: "${referralCode}", date_gte: ${timestamp.start}, date_lte: ${timestamp.end} }, orderDirection: desc, orderBy: date) {
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

export default function useReferral() {
  const { active, account } = useWeb3React();
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

  const { data: referrerResponse, isLoading: isLoadingReferralCodeData } =
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
            }
          }
        }
    `),
      {
        enabled: active,
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
  };
}
