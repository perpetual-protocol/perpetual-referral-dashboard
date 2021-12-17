import { ConnectorUpdate } from "@web3-react/types";
import { AbstractConnector } from "@web3-react/abstract-connector";
import { IWCEthRpcConnectionOptions } from "@walletconnect/types";

export const URI_AVAILABLE = "URI_AVAILABLE";
const __DEV__ = process.env.NODE_ENV !== "production";

export interface WalletConnectConnectorArguments
  extends IWCEthRpcConnectionOptions {
  supportedChainIds?: number[];
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = "The user rejected the request.";
  }
}

function getSupportedChains({
  supportedChainIds,
  rpc,
}: WalletConnectConnectorArguments): number[] | undefined {
  if (supportedChainIds) {
    return supportedChainIds;
  }

  return rpc ? Object.keys(rpc).map((k) => Number(k)) : undefined;
}

export class WalletConnectConnector extends AbstractConnector {
  private readonly config: WalletConnectConnectorArguments;

  public walletConnectProvider?: any;

  constructor(config: WalletConnectConnectorArguments) {
    super({ supportedChainIds: getSupportedChains(config) });

    this.config = config;

    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  private handleChainChanged(chainId: number | string): void {
    if (__DEV__) {
      console.log("Handling 'chainChanged' event with payload", chainId);
    }
    this.emitUpdate({ chainId });
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      console.log("Handling 'accountsChanged' event with payload", accounts);
    }
    this.emitUpdate({ account: accounts[0] });
  }

  private handleDisconnect(): void {
    if (__DEV__) {
      console.log("Handling 'disconnect' event");
    }
    this.emitDeactivate();
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.walletConnectProvider) {
      const WalletConnectProvider = await import(
        "@walletconnect/ethereum-provider"
      ).then((m) => m?.default ?? m);
      this.walletConnectProvider = new WalletConnectProvider(this.config);
    }

    this.walletConnectProvider.on("chainChanged", this.handleChainChanged);
    this.walletConnectProvider.on(
      "accountsChanged",
      this.handleAccountsChanged
    );
    this.walletConnectProvider.on("disconnect", this.handleDisconnect);
    try {
      const accounts = await this.walletConnectProvider.enable();
      return { provider: this.walletConnectProvider, account: accounts[0] };
    } catch (error) {
      await this.walletConnectProvider.
      console.error(error);
    }
  }

  public async getProvider(): Promise<any> {
    return this.walletConnectProvider;
  }

  public async getChainId(): Promise<number | string> {
    return Promise.resolve(this.walletConnectProvider.chainId);
  }

  public async getAccount(): Promise<null | string> {
    return Promise.resolve(this.walletConnectProvider.accounts).then(
      (accounts: string[]): string => {
        const acc = (accounts || [])[0];
        if (!acc) throw new Error("Invalid account");
        return acc;
      }
    );
  }

  public deactivate() {
    if (this.walletConnectProvider) {
      this.walletConnectProvider.removeListener(
        "disconnect",
        this.handleDisconnect
      );
      this.walletConnectProvider.removeListener(
        "chainChanged",
        this.handleChainChanged
      );
      this.walletConnectProvider.removeListener(
        "accountsChanged",
        this.handleAccountsChanged
      );
      this.walletConnectProvider.disconnect();
    }
  }

  public async close() {
    this.emitDeactivate();
  }
}
