import { useQuery } from 'react-query';
import { PERP_SUBGRAPH } from '../utils/http';
import dayjs, { Dayjs } from 'dayjs';
import { formatUnits } from '@ethersproject/units';
import utc from 'dayjs/plugin/utc';
import { sum, sumBy } from 'lodash';
import { useWeb3React } from '@web3-react/core';
import { fromUnixTime } from 'date-fns';
dayjs.extend(utc);

function getDaysOfPastWeek() {
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

function getPositionChangedEvents(account: string) {
  const timestamps = getDaysOfPastWeek();
  const promises = timestamps.map(timestamp => {
    return PERP_SUBGRAPH(`
        query {
            positionChangedEvents(where: { trader: "${account}", timestamp_gte: ${timestamp.start}, timestamp_lte: ${timestamp.end}}, orderDirection: desc, orderBy: timestamp) {
                id
                positionNotional
                timestamp
                fee
            }
        }
    `);
  });
  return Promise.all(promises);
}

export default function useTrading() {
  const { account, active } = useWeb3React();
  const days = getDaysOfPastWeek()
    .map(d => fromUnixTime(d.start))
    .reverse();
  const { data } = useQuery(
    ['positionChangedEvents', { account }],
    () => getPositionChangedEvents(account),
    {
      enabled: active
    }
  );

  const positionChangedEvents = (data || []).map(
    d => d.data?.positionChangedEvents
  );

  const volumeData = positionChangedEvents.map((events, i) => {
    return {
      volume: sumBy(events, (e: any) => {
        return Number(formatUnits(e?.positionNotional, 18));
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
    weeklyTradingFee
  };
}
