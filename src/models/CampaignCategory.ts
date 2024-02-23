import { Document } from 'mongodb';
import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin, initSearch } from '../util/search';

export type CampaignCategory = {
  _id?: string;
  title: string;
  description?: string; 
  status?: 'active' | 'inactive';
  suggestions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type CampaignCategoryDocument = DefaultDocument &
  CampaignCategory & {
    addFields(): Promise<void>;
    _doc: Document;
  };

const CampaignCategorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      es_indexed: true,
      unique: true,
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
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive'],
    },
  },
  { timestamps: true },
);

CampaignCategorySchema.plugin(defaultPlugin, { searchable: true });

async function addFields(): Promise<void> {
  const doc = this as CampaignCategoryDocument;

  doc.suggestions = `${doc.title}`.trim().split(' ');

  await doc.save();
}

CampaignCategorySchema.methods.addFields = addFields;

// CampaignCategorySchema.index({ title: 1, organization: 1 }, { unique: true });

export const CampaignCategoryModel = model<CampaignCategoryDocument, PagedModel<CampaignCategoryDocument> & SearchableModel<CampaignCategoryDocument>>(
  'CampaignCategory',
  CampaignCategorySchema,
);

initSearch(CampaignCategoryModel);
