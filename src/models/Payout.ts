import mongoose, { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin } from '../util/search';
import { User } from './User';

export type Payout = {
  _id?: string;
  ref: string;
  user: string | User;
  amount: number;
  currency: string;
  status: 'paid' | 'pending';
  paystackRef?: string;
  paystackFee?: number;
  paymentMethod: 'mobile_money' | 'card';
  paidAt?: Date;
  authorizationCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PayoutDocument = DefaultDocument & Payout;

const PayoutSchema = new Schema(
  {
    ref: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
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
    authorizationCode: {
      type: String,
    },
    paidAt: {
      type: Date
    },
    paymentMethod: {
      type: String,
      // enum: ['mobile_money', 'card']
    },
  },
  { timestamps: true },
);

PayoutSchema.plugin(defaultPlugin);

// PayoutSchema.index({ campaignEnrolment: 1 }, { unique: true });

export const PayoutModel = model<PayoutDocument, PagedModel<PayoutDocument> & SearchableModel<PayoutDocument>>(
  'Payout',
  PayoutSchema,
);
