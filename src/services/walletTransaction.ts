import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { WalletTransaction, WalletTransactionDocument, WalletTransactionModel } from '../models/WalletTransaction';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';

@injectable()
export class WalletTransactionService {
  async findById(walletTransactionId: string): Promise<WalletTransaction> {
    const walletTransaction = await WalletTransactionModel.findById(walletTransactionId);

    if (!walletTransaction) throw new APIError({ message: 'Wallet Transaction  not found', status: 404 });

    await walletTransaction.populate([{ path: 'user', }]);

    return walletTransaction;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<WalletTransactionDocument>> {
    const pageResult: PageResult<WalletTransactionDocument> = await WalletTransactionModel.page(pickBy(query), pageOptions);
    
    return pageResult;
  }

  async delete(walletTransactionId: string): Promise<WalletTransaction> {
    const walletTransaction = await WalletTransactionModel.findById(walletTransactionId);

    if (!walletTransaction) throw new APIError({ message: 'Wallet Transaction  not found', status: 404 });

    await WalletTransactionModel.findByIdAndDelete(walletTransactionId);

    await walletTransaction.populate({ path: 'user', });

    return walletTransaction;
  }
}
