import { Document } from 'mongodb';
import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin, initSearch } from '../util/search';
import { CampaignCategory } from './CampaignCategory';
import { User } from './User';

export type Campaign = {
  _id?: string;
  title: string;
  owner: string | User;
  description: string;
  status?: 'active' | 'inactive';
  target: {
    amount: number;
    currency: 'KES' | 'USD',
  };
  coverImage?: string;
  category: CampaignCategory;
  suggestions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type CampaignDocument = DefaultDocument &
  Campaign & {
    addFields(): Promise<void>;
    _doc: Document;
  };

export const priceSchema = new Schema({
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, enum: ['KES', 'USD'], required: true },
}, { _id: false, timestamps: false });

const CampaignSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      es_indexed: true,
    },
    description: {
      type: String,
      required: true,
    },
    suggestions: {
      type: [String],
      es_indexed: true,
      es_type: 'completion',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: priceSchema,
      required: true,
      default: 0,
    },
    coverImage: {
      type: String,
      es_indexed: false,
      required: false,
    },
    category: { type: Schema.Types.ObjectId, ref: 'CampaignCategory' },
    status: {
      type: String,
      default: 'inactive',
      enum: ['active', 'inactive'],
    },
  },
  { timestamps: true },
);

CampaignSchema.plugin(defaultPlugin, { searchable: true });

async function addFields(): Promise<void> {
  const doc = this as CampaignDocument;

  doc.suggestions = `${doc.title}`.trim().split(' ');

  await doc.save();
}

CampaignSchema.methods.addFields = addFields;

// CampaignSchema.index({ title: 1, organization: 1 }, { unique: true });

export const CampaignModel = model<CampaignDocument, PagedModel<CampaignDocument> & SearchableModel<CampaignDocument>>(
  'Campaign',
  CampaignSchema,
);

initSearch(CampaignModel);
