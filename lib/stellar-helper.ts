import * as StellarSdk from '@stellar/stellar-sdk';
import {
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
} from '@creit.tech/stellar-wallets-kit';

export const DEFAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID || 'CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W';
export const DEFAULT_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-rpc.testnet.stellar.org';

export type ContractEventRecord = {
  id: string;
  type: string;
  topic: string[];
  value: unknown;
  ledger: number;
  txHash: string;
  inSuccessfulContractCall: boolean;
  createdAt: string;
};

export type ContractSubmission = {
  hash: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  contractId: string;
  action: 'deploy' | 'increment' | 'set_message' | 'read';
  createdAt: string;
  returnValue?: string;
  events?: ContractEventRecord[];
  error?: string;
};

export type ContractState = {
  counter: number;
  latestWriter: string;
  lastMessage: string;
};

export class StellarHelper {
  private server: StellarSdk.Horizon.Server;
  private rpcServer: StellarSdk.SorobanRpc.Server;
  private networkPassphrase: string;
  private kit: StellarWalletsKit | null = null;
  private network: WalletNetwork;
  private publicKey: string | null = null;
  private contractId: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.server = new StellarSdk.Horizon.Server(
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
    );
    this.networkPassphrase =
      network === 'testnet' ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
    this.rpcServer = new StellarSdk.SorobanRpc.Server(
      network === 'testnet' ? DEFAULT_RPC_URL : 'https://soroban-rpc.publicnode.com'
    );

    this.network = network === 'testnet' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;
    this.contractId = DEFAULT_CONTRACT_ID;
  }

  isFreighterInstalled(): boolean {
    return true;
  }

  async connectWallet(walletId?: string): Promise<string> {
    try {
      const kit = this.getKit();

      if (walletId) {
        kit.setWallet(walletId);
      }

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

  getContractId(): string {
    return this.contractId;
  }

  setContractId(contractId: string) {
    this.contractId = contractId;
  }

  async readContractState(publicKey: string, contractId: string = this.contractId): Promise<ContractState> {
    try {
      const sourceAccount = await this.server.loadAccount(publicKey);
      const contract = new StellarSdk.Contract(contractId);
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('get_state'))
        .setTimeout(30)
        .build();

      const simulation = await this.rpcServer.simulateTransaction(transaction);

      if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) {
        throw new Error(simulation.error);
      }

      const result = simulation.result?.retval ? StellarSdk.scValToNative(simulation.result.retval) : null;

      if (Array.isArray(result)) {
        return {
          counter: Number(result[0] || 0),
          latestWriter: String(result[1] || ''),
          lastMessage: String(result[2] || ''),
        };
      }

      return {
        counter: 0,
        latestWriter: '',
        lastMessage: '',
      };
    } catch (error: any) {
      throw new Error(`Contract read failed: ${error.message || 'Unable to query the contract.'}`);
    }
  }

  async invokeContractWrite(params: {
    publicKey: string;
    contractId?: string;
    method: 'increment' | 'set_message';
    message?: string;
  }): Promise<ContractSubmission> {
    const contractId = params.contractId || this.contractId;

    try {
      const sourceAccount = await this.server.loadAccount(params.publicKey);
      const contract = new StellarSdk.Contract(contractId);
      const operationArgs =
        params.method === 'set_message'
          ? [StellarSdk.nativeToScVal(params.message || '', { type: 'string' })]
          : [];

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(params.method, ...operationArgs))
        .setTimeout(30)
        .build();

      const { signedTxXdr } = await this.getKit().signTransaction(transaction.toXDR(), {
        networkPassphrase: this.networkPassphrase,
        address: params.publicKey,
      });

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        this.networkPassphrase
      );

      const sendResponse = await this.rpcServer.sendTransaction(signedTransaction);

      return {
        hash: sendResponse.hash,
        status: sendResponse.status === 'PENDING' ? 'PENDING' : 'FAILED',
        contractId,
        action: params.method,
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Contract invocation failed: ${error.message || 'Please try again.'}`);
    }
  }

  async pollContractStatus(hash: string): Promise<ContractSubmission> {
    try {
      const response = await this.rpcServer.getTransaction(hash);

      if (response.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
        return {
          hash,
          status: 'PENDING',
          contractId: this.contractId,
          action: 'read',
          createdAt: new Date().toISOString(),
        };
      }

      if (response.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.FAILED) {
        return {
          hash,
          status: 'FAILED',
          contractId: this.contractId,
          action: 'read',
          createdAt: new Date().toISOString(),
          error: 'The network rejected the contract transaction.',
        };
      }

      return {
        hash,
        status: 'SUCCESS',
        contractId: this.contractId,
        action: 'read',
        createdAt: new Date().toISOString(),
        returnValue: response.returnValue ? String(StellarSdk.scValToNative(response.returnValue)) : undefined,
      };
    } catch (error: any) {
      throw new Error(`Transaction status lookup failed: ${error.message || 'Unable to track status.'}`);
    }
  }

  async getContractEvents(contractId: string = this.contractId, limit: number = 8): Promise<ContractEventRecord[]> {
    try {
      const latestLedger = await this.rpcServer.getLatestLedger();
      const response = await this.rpcServer.getEvents({
        startLedger: Math.max(0, latestLedger.sequence - 20),
        filters: [{ type: 'contract', contractIds: [contractId] }],
        limit,
      });

      return response.events.map((event) => ({
        id: event.id,
        type: event.type,
        topic: event.topic.map((item) => String(StellarSdk.scValToNative(item))),
        value: StellarSdk.scValToNative(event.value),
        ledger: event.ledger,
        txHash: event.txHash,
        inSuccessfulContractCall: event.inSuccessfulContractCall,
        createdAt: event.ledgerClosedAt,
      }));
    } catch (error: any) {
      throw new Error(`Event sync failed: ${error.message || 'Unable to load contract events.'}`);
    }
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
