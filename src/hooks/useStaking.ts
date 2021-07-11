import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { useWeb3React } from '@web3-react/core';
import { Contract } from '@ethersproject/contracts';
import StakingContractABI from '../contracts/Staking.json';
import { useQuery } from 'react-query';
import { formatUnits } from '@ethersproject/units';

const CONTRACT_ADDRESS = '0x0f346e19F01471C02485DF1758cfd3d624E399B4';

const getStakedPerp = async (account: string) => {
  const provider = new JsonRpcProvider('https://main-light.eth.linkpool.io/');
  const contract = new Contract(CONTRACT_ADDRESS, StakingContractABI, provider);
  const response = (await contract.balanceOf(account)) as BigNumber;
  return formatUnits(response.toString(), 18);
};

export default function useStaking() {
  const { account, active } = useWeb3React();

  const { isLoading, data } = useQuery(
    ['staked_perp', { account }],
    () => getStakedPerp(account),
    {
      enabled: active
    }
  );

  return {
    isLoading,
    data
  };
}
