import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin } from '../util/search';
import { User } from './User';
import { Payment } from './Payment';
import { Payout } from './Payout';

export type WalletTransaction = {
  _id?: string;
  amount: number;
  user: string | User;
  currency: string;
  type: 'payin' | 'payout';
  walletBalance: number;
  payment?: Payment;
  payout?: Payout;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WalletTransactionDocument = DefaultDocument & WalletTransaction;

const walletTransactionSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['payin', 'payout'],
    },
    walletBalance: { // balance after transaction
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

walletTransactionSchema.plugin(defaultPlugin);

export const WalletTransactionModel = model<WalletTransactionDocument, PagedModel<WalletTransactionDocument> & SearchableModel<WalletTransactionDocument>>(
  'walletTransaction',
  walletTransactionSchema,
);
