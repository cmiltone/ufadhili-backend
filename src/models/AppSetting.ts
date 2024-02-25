import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel } from '../types/db';
import { defaultPlugin } from '../util/search';

export type AppSetting = {
  _id?: string;
  techFeePercentage: number;
  adminEmail: string;
  payStackSecretKey: string;
  payStackPublicKey: string;
  createdAt?: Date;
  updatedAt?: Date; 
};

export type AppSettingDocument = DefaultDocument & AppSetting;

const appSettingSchema = new Schema(
  {
    techFeePercentage: {
      type: Number,
      max: 100,
      min: 0,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    payStackSecretKey: { type: String },
    payStackPublicKey: { type: String },
  },
  { timestamps: true },
);

appSettingSchema.plugin(defaultPlugin);

export const AppSettingModel = model<AppSettingDocument, PagedModel<AppSettingDocument>>(
  'AppSetting',
  appSettingSchema,
);
