import { useQuery } from 'react-query';
import { SUBGRAPH } from '../utils/http';
import dayjs, { Dayjs } from 'dayjs';
import { formatUnits } from '@ethersproject/units';
import utc from 'dayjs/plugin/utc';
import { sum, sumBy } from 'lodash';
import { useWeb3React } from '@web3-react/core';
import { fromUnixTime } from 'date-fns';
dayjs.extend(utc);

export function getLast7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(dayjs().subtract(i, 'day'));
  }
  return days
    .map((day: Dayjs) => {
      return {
        start: Math.round(day.utc().startOf('day').valueOf() / 1000),
        end: Math.round(day.utc().endOf('day').valueOf() / 1000)
      };
    })
    .reverse();
}

export function getLastNWeeks(window = 7) {
  const weeks = [];
  for (let i = 0; i < window; i++) {
    weeks.push(dayjs().utc().subtract(i, 'weeks').startOf('week'));
  }

  return weeks
    .map((week: Dayjs) => {
      return {
        start: Math.round(week.utc().startOf('week').valueOf() / 1000),
        end: Math.round(week.utc().endOf('week').endOf('day').valueOf() / 1000)
      };
    })
    .reverse();
}

export function getTraderDayData(
  account: string,
  customWeeks: { start: number; end: number }[]
) {
  const timestamps = customWeeks || getLastNWeeks(7);
  const promises = timestamps.map(timestamp => {
    return SUBGRAPH(`
        query {
            traderDayDatas(where: { trader: "${account.toLowerCase()}", date_gte: ${timestamp.start}, date_lte: ${timestamp.end}}, orderDirection: desc, orderBy: date) {
                id
                tradingVolume
                date
                fee
            }
        }
    `);
  });
  return Promise.all(promises);
}

export default function useTrading(
  customTimestamps?: { start: number; end: number }[]
) {
  const { account, active } = useWeb3React();
  const days = getLastNWeeks().map(d => ({
    start: dayjs(d.start * 1000)
      .utc()
      .toDate(),
    end: dayjs(d.end * 1000)
      .utc()
      .toDate()
  }));

  const { data, isLoading } = useQuery(
    ['traderDayDatas', { account, customTimestamps }],
    () => getTraderDayData(account, customTimestamps),
    {
      enabled: active
    }
  );

  const dayDatas = (data || []).map(
    d => d.data?.traderDayDatas
  );

  if (customTimestamps?.length) {
  }

  const volumeData = dayDatas.map((events, i) => {
    return {
      volume: sumBy(events, (e: any) => {
        return Number(formatUnits(e?.tradingVolume, 18));
      }),
      fee: sumBy(events, (e: any) => {
        return Number(formatUnits(e?.fee, 18));
      }),
      timestamp: days[i]
    };
  });

  const weeklyTradingVolume = sum(volumeData.map(v => v.volume));
  const weeklyTradingFee = sum(volumeData.map(v => v.fee));

  return {
    volumeData,
    days,
    weeklyTradingVolume,
    weeklyTradingFee,
    isLoading
  };
}
