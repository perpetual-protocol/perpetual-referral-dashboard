import axios from 'axios';

export const POST = async (url: string, body: Record<string, any>) => {
  return await (
    await axios.post(url, body)
  ).data;
};

export const SUBGRAPH = (query: string) => {
<<<<<<< HEAD
  return POST('https://api.thegraph.com/subgraphs/name/1saf/perpetual-staking-subgraph-beta', {
    query
  });
=======
  return POST(
    'https://api.thegraph.com/subgraphs/id/QmPt33vtKqSxCdYneSjFgt7T3m9HUW4PeVntgcNB55U89U',
    {
      query
    }
  );
>>>>>>> origin/v2-rewards-1
};

export const STAKED_SUBGRAPH = (query: string) => {
  return POST(
    'https://api.thegraph.com/subgraphs/name/1saf/perpetual-staking-subgraph',
    {
      query
    }
  );
};
