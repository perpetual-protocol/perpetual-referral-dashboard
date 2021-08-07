import { useWeb3React } from '@web3-react/core';
import { useQuery } from 'react-query';
import { SUBGRAPH } from '../utils/http';

export function useReferee(referralCode: string) {
  const { account, active } = useWeb3React();
  const { data: refCodeExistsResponse } = useQuery(
    ['referralCode', { referralCode }],
    () =>
      SUBGRAPH(`
        query {
            referralCode(id: "${referralCode}") {
                id
            }
        }
  `),
    {
      enabled: !!referralCode
    }
  );

  const { data: refereeResponse, refetch: retryRefereeRequest } = useQuery(
    ['referee', { account }],
    () =>
      SUBGRAPH(`
        query {
            referralCodes(where: { referees_contains: ["${account.toLowerCase()}"] }) {
                id
            }
        }
  `),
    {
      enabled: active
    }
  );

  const referralCodeExists =
    !referralCode || refCodeExistsResponse?.data?.referralCode?.id;
  const isReferee = refereeResponse?.data?.referralCodes?.length;

  return {
    referralCodeExists,
    isReferee,
    retryRefereeRequest
  };
}
