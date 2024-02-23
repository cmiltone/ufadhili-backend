import { Document } from 'mongodb';
import { Schema, model } from 'mongoose';

import { DefaultDocument, PagedModel, SearchableModel } from '../types/db';
import { defaultPlugin, initSearch } from '../util/search';

export type UserRole = 'contributor' | 'campaigner' | 'admin';

export const userWalletSchema = new Schema({
  amount: {
    type: Number,
    default: 0,
    required: true,
  },
  currency: {
    type: String,
    default: 'KES',
    required: true,
  },
  recipientCode: {
    type: String,
  }
});

export type User = {
  _id?: string;
  fullName: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  dob?: Date;
  avatarUrl?: string;
  role: UserRole[];
  status?: 'active' | 'blocked';
  suggestions?: string[];
  phone: string;
  hash?: string;
  wallet?: {
    amount: number;
    currency: "KES" | "USD";
    recipientCode: string;
  };
  createdAt?: Date;
  updatedAt?: Date; 
};

export type UserDocument = DefaultDocument &
  User & {
    addFields(): Promise<void>;
    _doc: Document;
  };

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      es_indexed: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      es_indexed: true,
    },
    phone: { type: String, unique: true },
    gender: {
      type: String,
      // required: true,
      enum: ['male', 'female', 'other'],
    },
    dob: {
      type: Date,
      // required: true,
    },
    suggestions: {
      type: [String],
      es_indexed: true,
      es_type: 'completion',
    },
    role: {
      type: [String],
      default: ['default'],
      enum: ['admin', 'contributor', 'campaigner'],
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'blocked', 'deleted'],
    },
    avatarUrl: {
      type: String,
      es_indexed: false,
    },
    hash: {
      type: String,
      select: false,
    },
    wallet: {
      type: userWalletSchema
    },
  },
  { timestamps: true },
);

userSchema.plugin(defaultPlugin, { searchable: true });

async function addFields(): Promise<void> {
  const doc = this as UserDocument;

  doc.suggestions = `${doc.fullName} ${doc.email || ''}`.trim().split(' ');

  await doc.save();
}

userSchema.methods.addFields = addFields;

export const UserModel = model<UserDocument, PagedModel<UserDocument> & SearchableModel<UserDocument>>(
  'User',
  userSchema,
);

initSearch(UserModel);
