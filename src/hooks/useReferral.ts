import { useWeb3React } from '@web3-react/core';
import { useQuery } from 'react-query';
import { PERP_SUBGRAPH, SUBGRAPH } from '../utils/http';
import PerpetualProtocolABI from '../contracts/PerpetualProtocolReferrer.json';
import { BaseProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { getLastNWeeks } from './useTrading';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { last, nth, sumBy, zip } from 'lodash';
import { formatUnits } from '@ethersproject/units';

const CONTRACT_ADDRESS = '0x19c65D0A09975D703A16e226BE39E3A2787C4d47';

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
  referees: string[] = [],
  weeks: number = 7
) {
  const _weeks = getLastNWeeks(weeks);
  const _referees = [
    '0xa73018C8c64D8b58f692da632255C8ac907C8d58'.toLowerCase()
  ];
  const refereesDayData = await Promise.all(
    _weeks.map(week => {
      return PERP_SUBGRAPH(`
      query {
        traderDayDatas(where: { date_gte: ${week.start}, date_lte: ${
        week.end
      }, trader_in: [${_referees.map(r => `"${r}"`).join(',')}] }) {
          trader {
            id
          }
          tradingVolume
          fee
          date
        }
      }
    `);
    })
  );

  console.log('days', refereesDayData);

  const dateLabels = _weeks.map(
    w =>
      `${dayjs(w.start * 1000).utc().format('DD/MM/YY')} - \n${dayjs(w.end * 1000)
        .utc()
        .format('DD/MM/YY')}`
  );

  const volumes = (refereesDayData || []).map(day =>
    sumBy(day.data.traderDayDatas, (dayData: any) => Number(formatUnits(dayData.tradingVolume, 18)))
  );

  const fees = (refereesDayData || []).map(day =>
    sumBy(day.data.traderDayDatas, (dayData: any) =>
      Number(formatUnits(dayData.fee, 18))
    )
  );

  return volumes.map((volume, i) => ({
    volume: volume.toString(),
    week: dateLabels[i],
    fees: fees[i].toString()
  }))
}

async function getWeeklyNewReferees(
  referralCode: string,
  customWeeks: number = 7
) {
  const timestamps = getLastNWeeks(customWeeks);
  const promises = timestamps.map(timestamp => {
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

export default function useReferral() {
  const { active, account } = useWeb3React();
  const [_referees, _setReferees] = useState([]);
  const [_referralCode, _setReferralCode] = useState('');
  const days = getLastNWeeks().map(d => ({
    start: dayjs(d.start * 1000)
      .utc()
      .toDate(),
    end: dayjs(d.end * 1000)
      .utc()
      .toDate()
  }));

  const { data: referrerResponse } = useQuery(
    ['refereeCode', { account }],
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
      onSuccess: response => {
        _setReferees(response?.data?.trader?.referrerCode?.referees);
        _setReferralCode(response?.data?.trader?.referrerCode?.id);
      }
    }
  );

  const { data: weeklyRefereeVolumes } = useQuery(
    ['refereesVolume', { _referees }],
    () => calculateRefereesWeeklyVolume(_referees),
    {
      enabled: _referees && _referees.length > 0
    }
  );

  const { data: referralCodeDayDatasResponses } = useQuery(
    ['referralCodeDayDatas', { _referralCode }],
    () => getWeeklyNewReferees(_referralCode),
    {
      enabled: _referralCode !== ''
    }
  );

  const currentWeeklyReferralVolume = Number(last(weeklyRefereeVolumes)?.volume);
  const lastWeekReferralVolume = Number(nth(weeklyRefereeVolumes, -2)?.volume);
  const weeklyReferralVolumeChange = (currentWeeklyReferralVolume - lastWeekReferralVolume) / lastWeekReferralVolume;

  const referralCodeDayDatas =
    referralCodeDayDatasResponses?.map(r => r.data?.referralCodeDayDatas) || [];

  const formattedDayData = referralCodeDayDatas.map((dayDatas, i) => {
    return {
      newUsers: sumBy(dayDatas, (day: any) => {
        return Number((day?.newReferees || []).length);
      }),
      timestamp: days[i]
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
    weeklyRefereeVolumes: weeklyRefereeVolumes || [],
    currentWeeklyReferralVolume,
    weeklyReferralVolumeChange
  };
}
