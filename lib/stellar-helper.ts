import * as StellarSdk from '@stellar/stellar-sdk';
import {
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from '@creit.tech/stellar-wallets-kit';

export class StellarHelper {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private kit: StellarWalletsKit | null = null;
  private network: WalletNetwork;
  private publicKey: string | null = null;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.server = new StellarSdk.Horizon.Server(
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
    );
    this.networkPassphrase =
      network === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;

    this.network = network === 'testnet' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;
  }

  isFreighterInstalled(): boolean {
    return true;
  }

  async connectWallet(): Promise<string> {
    try {
      const kit = this.getKit();

      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
        },
      });

      const { address } = await kit.getAddress();

      if (!address) {
        throw new Error('No wallet address was returned.');
      }

      this.publicKey = address;
      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error(`Wallet connection failed: ${error.message || 'Please try again.'}`);
    }
  }

  async getBalance(publicKey: string): Promise<{
    xlm: string;
    assets: Array<{ code: string; issuer: string; balance: string }>;
  }> {
    try {
      const account = await this.server.loadAccount(publicKey);

      const xlmBalance = account.balances.find((balance) => balance.asset_type === 'native');

      const assets = account.balances
        .filter((balance) => balance.asset_type !== 'native')
        .map((balance: any) => ({
          code: balance.asset_code,
          issuer: balance.asset_issuer,
          balance: balance.balance,
        }));

      return {
        xlm: xlmBalance && 'balance' in xlmBalance ? xlmBalance.balance : '0',
        assets,
      };
    } catch (error: any) {
      throw new Error(`Balance fetch failed: ${error.message || 'Account may not be funded.'}`);
    }
  }

  async sendPayment(params: {
    from: string;
    to: string;
    amount: string;
    memo?: string;
  }): Promise<{ hash: string; success: boolean }> {
    try {
      const account = await this.server.loadAccount(params.from);

      const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      }).addOperation(
        StellarSdk.Operation.payment({
          destination: params.to,
          asset: StellarSdk.Asset.native(),
          amount: params.amount,
        })
      );

      if (params.memo) {
        transactionBuilder.addMemo(StellarSdk.Memo.text(params.memo));
      }

      const transaction = transactionBuilder.setTimeout(180).build();

      const { signedTxXdr } = await this.getKit().signTransaction(transaction.toXDR(), {
        networkPassphrase: this.networkPassphrase,
      });

      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        this.networkPassphrase
      );

      const result = await this.server.submitTransaction(
        transactionToSubmit as StellarSdk.Transaction
      );

      return {
        hash: result.hash,
        success: result.successful,
      };
    } catch (error: any) {
      console.error('Payment error:', error);
      throw new Error(`Payment failed: ${error.message || 'Please check the transaction details.'}`);
    }
  }

  async getRecentTransactions(
    publicKey: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string;
      type: string;
      amount?: string;
      asset?: string;
      from?: string;
      to?: string;
      createdAt: string;
      hash: string;
    }>
  > {
    const payments = await this.server
      .payments()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();

    return payments.records.map((payment: any) => ({
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
      from: payment.from,
      to: payment.to,
      createdAt: payment.created_at,
      hash: payment.transaction_hash,
    }));
  }

  getExplorerLink(hash: string, type: 'tx' | 'account' = 'tx'): string {
    const network =
      this.networkPassphrase === StellarSdk.Networks.TESTNET ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${network}/${type}/${hash}`;
  }

  formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
      return address;
    }

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  disconnect() {
    this.publicKey = null;
    return true;
  }

  private getKit(): StellarWalletsKit {
    if (typeof window === 'undefined') {
      throw new Error('Wallet actions are only available in the browser.');
    }

    if (!this.kit) {
      this.kit = new StellarWalletsKit({
        network: this.network,
        selectedWalletId: FREIGHTER_ID,
        modules: allowAllModules(),
      });
    }

    return this.kit;
  }
}

export const stellar = new StellarHelper('testnet');
