import axios from 'axios';

export const POST = async (url: string, body: Record<string, any>) => {
  return await (
    await axios.post(url, body)
  ).data;
};

export const SUBGRAPH = (query: string) => {
  return POST(
    'https://api.thegraph.com/subgraphs/id/QmcnxiDutrFXquaa7kHpExzHJBqMMxD6FQEtZ584c8mDxz',
    {
      query
    }
  );
};

export const STAKED_SUBGRAPH = (query: string) => {
  return POST(
    'https://api.thegraph.com/subgraphs/name/1saf/perpetual-staking-subgraph',
    {
      query
    }
  );
};
