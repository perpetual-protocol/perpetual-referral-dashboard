import axios from 'axios';

export const POST = async (url: string, body: Record<string, any>) => {
  return await (
    await axios.post(url, body)
  ).data;
};

export const SUBGRAPH = (query: string) => {
  return POST('http://localhost:8000/subgraphs/name/perp-local-subgraph', {
    query
  });
};

export const PERP_SUBGRAPH = (query: string) => {
  return POST('https://api.thegraph.com/subgraphs/name/perpetual-protocol/perp-position-subgraph', {
    query
  });
};

