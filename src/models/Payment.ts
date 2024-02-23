import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin } from '../util/search';
import { Campaign } from './Campaign';
import { User } from './User';

export type Payment = {
  _id?: string;
  ref: string;
  campaign: string | Campaign;
  user: string | User;
  amount: number;
  currency: string;
  status: 'paid' | 'pending';
  paystackRef?: string;
  paystackFee?: number;
  paymentMethod: 'mobile_money' | 'card';
  techFee: number;
  paidAt?: Date;
  authorizationCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PaymentDocument = DefaultDocument & Payment;

const PaymentSchema = new Schema(
  {
    ref: {
      type: String,
      required: true,
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['paid', 'pending'],
    },
    paystackRef: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
    },
    paystackFee: {
      type: Number,
    },
    techFee: {
      type: Number,
    },
    authorizationCode: {
      type: String,
    },
    paidAt: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['mobile_money', 'card']
    },
  },
  { timestamps: true },
);

PaymentSchema.plugin(defaultPlugin);

// PaymentSchema.index({ campaign: 1 }, { unique: true });

export const PaymentModel = model<PaymentDocument, PagedModel<PaymentDocument> & SearchableModel<PaymentDocument>>(
  'Payment',
  PaymentSchema,
);
