import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { Transaction, TransactionDocument, TransactionModel } from '../models/Transaction';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';

@injectable()
export class TransactionService {
  async findById(transactionId: string): Promise<Transaction> {
    const transaction = await TransactionModel.findById(transactionId);

    if (!transaction) throw new APIError({ message: ' Transaction  not found', status: 404 });

    await transaction.populate([{ path: 'campaign', }]);

    return transaction;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<TransactionDocument>> {
    const pageResult: PageResult<TransactionDocument> = await TransactionModel.page(pickBy(query), pageOptions);
    
    return pageResult;
  }

  async delete(transactionId: string): Promise<Transaction> {
    const transaction = await TransactionModel.findById(transactionId);

    if (!transaction) throw new APIError({ message: 'Transaction not found', status: 404 });

    await TransactionModel.findByIdAndDelete(transactionId);

    await transaction.populate({ path: 'campaign', });

    return transaction;
  }
}
