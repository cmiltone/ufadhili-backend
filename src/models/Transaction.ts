import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin } from '../util/search';
import { Campaign } from './Campaign';
import { Payment } from './Payment';
import { Payout } from './Payout';

export type Transaction = {
  _id?: string;
  amount: number;
  campaign: string | Campaign;
  currency: string;
  type: 'payin' | 'payout';
  raised: number;
  current: number;
  payment?: Payment;
  payout?: Payout;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TransactionDocument = DefaultDocument & Transaction;

const transactionSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['payin', 'payout'],
    },
    raised: { // raised campaign balance after transaction
      type: Number,
      required: true,
    },
    current: { // current campaign balance after transaction
      type: Number,
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    payout: {
      type: Schema.Types.ObjectId,
      ref: 'Payout'
    }
  },
  { timestamps: true },
);

transactionSchema.plugin(defaultPlugin);

export const TransactionModel = model<TransactionDocument, PagedModel<TransactionDocument> & SearchableModel<TransactionDocument>>(
  'transaction',
  transactionSchema,
);
