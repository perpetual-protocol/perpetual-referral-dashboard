import { useWeb3React } from '@web3-react/core';
import { useQuery } from 'react-query';
import { SUBGRAPH } from '../utils/http';
import PerpetualProtocolABI from '../contracts/PerpetualProtocolReferrer.json';
import { BaseProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

const CONTRACT_ADDRESS = '0xA202F19C8Ae405Ff0e795C9F8DBb7987ea475E75';

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

export default function useReferral() {
  const { active, account } = useWeb3React();
  const { data: referrerResponse } = useQuery(
    ['refereeCode', { account }],
    () =>
      SUBGRAPH(`
        query {
            referrer(id: "${account.toLowerCase()}") {
            id
            referralCode {
              id
              referees
            }
          }
        }
    `),
    {
      enabled: active
    }
  );

  // const { data: refCodeExistsResponse } = useQuery(
  //   ['referralCode', { referralCode }],
  //   () =>
  //     SUBGRAPH(`
  //   query {
  //       referralCode(id: "${referralCode}") {
  //           id
  //       }
  //   }
  // `),
  //   {
  //     enabled: !!referralCode
  //   }
  // );

  // const referralCodeExists =
  //   !referralCode || refCodeExistsResponse?.data?.referralCode?.id;
  const referralCode = referrerResponse?.data?.referrer?.referralCode?.id;
  const totalReferees = referrerResponse?.data?.referrer?.referralCode?.referees?.length;
  return {
    referralCode,
    totalReferees
  };
}
