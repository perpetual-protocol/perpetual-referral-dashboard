import { JsonRpcProvider } from "@ethersproject/providers";

export async function switchToXDAI(provider: JsonRpcProvider) {
  const params = [
    {
      chainId: "0x64",
      chainName: "xDAI POA Network",
      rpcUrls: ["https://rpc.xdaichain.com"],
      nativeCurrency: {
        name: "xDAI",
        symbol: "xDAI",
        decimals: 18,
      },
      blockExplorerUrls: ["https://blockscout.com/xdai/mainnet"],
    },
  ];
  await provider.send("wallet_addEthereumChain", params);
}
