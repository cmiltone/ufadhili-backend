/* eslint-disable @typescript-eslint/no-explicit-any */
import searchPlugin from 'mongoosastic';
import { query } from 'express';
import idValidator from 'mongoose-id-validator';
import { Document, Schema } from 'mongoose';

import { pagePlugin } from './page';
import { Populate, SearchableModel, Query } from '../types/db';

export const ELASTICSEARCH_STATUS = process.env.ELASTICSEARCH_STATUS as 'enabled' | 'disabled';
export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST;
export const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT;
export const ELASTICSEARCH_PROTOCOL = process.env.ELASTICSEARCH_PROTOCOL;


async function look(
  q: string,
  options: { query?: Query; populate?: Populate[]; page?: number; limit?: number } = {},
): Promise<Document[]> {
  const model = this as SearchableModel<Document>;

  if (ELASTICSEARCH_STATUS !== 'enabled') {
    const { page, limit, populate } = options;
    return model
      .find({ ...query, ...{ $text: { $search: q } } })
      .populate(populate)
      .skip(((page || 1) - 1) * (limit || 10))
      .limit(limit || 10);
  }

  return new Promise((resolve, reject) => {
    const { populate, query: queryOptions, page, limit } = options;

    const query = {
      query_string: {
        query: q,
      },
    };

    const opts = {
      suggest: {
        autocomplete: {
          prefix: q,
          completion: {
            field: 'suggestions',
            skip_duplicates: true,
            fuzzy: {
              fuzziness: 'auto',
            },
          },
        },
      },
      from: page ? (page - 1) * (limit ? limit : 10) : 0,
      size: limit || 10,
    };

    model.search(query, opts, async (error, results) => {
      if (error) return reject(error);

      let ids: string[] = [];

      if (results.hits) ids = [...ids, ...results.hits.hits.map((hit) => hit._id)];

      if (results.suggest && results.suggest.autocomplete[0])
        ids = [...ids, ...results.suggest.autocomplete[0].options.map((option) => option._id)];

      const _query = model.find({ ...queryOptions, ...{ _id: { $in: ids } } });

      if (populate) _query.populate(populate);

      const docs = await _query.exec();

      return resolve(docs);
    });
  });
}

function toJson(): any {
  const object = (this as Document).toObject();

  return object;
}

function plugin(schema: Schema, options: { searchable?: boolean } = {}): void {
  schema.plugin(idValidator);
  schema.plugin(pagePlugin);

  const { searchable } = options;

  if (searchable) {
    schema.plugin(searchPlugin, {
      host: ELASTICSEARCH_HOST,
      port: ELASTICSEARCH_PORT,
      protocol: ELASTICSEARCH_PROTOCOL,
    });
    schema.statics.look = look;
  }

  schema.methods.toJSON = toJson;

  // Index all text fields to allow easy search
  schema.index({ '$**': 'text' });

  schema.add({
    _status: {
      type: String,
      default: 'active',
      enum: ['active', 'deleted'],
    },
  });
}

export function initSearch(model: SearchableModel<Document>): void {
  if (ELASTICSEARCH_STATUS !== 'enabled') return;

  const title = model.collection.collectionName.toLowerCase();

  model.bulkError().on('error', (error, res) => {
    console.error('mongoosastic-bulkError %o : %o', title, error);
    console.info('mongoosastic-bulkError-res %o : %o', title, res);
  });

  model.esTruncate((error) => {
    if (error && error.status != 404) console.error('mongoosastic-esTruncate-error %o : %o', title, error);

    model.createMapping({}, (error, mapping) => {
      if (mapping) console.info('mongoosastic-createMapping %o : %o', title, mapping);
      if (error) console.error('mongoosastic-createMapping-error %o : %o', title, error);
    });

    const stream = model.synchronize();

    let count = 0;

    stream.on('data', async (err, doc) => {
      count += 1;

      if (err) console.error('mongoosastic-data-error %o : %o : %o : %o', title, count, doc, err);

      try {
        if (doc.addFields) await doc.addFields();
      } catch (error) {
        if (error) console.error('mongoosastic-data-addFields %o : %o : %o : %o', title, count, doc, error);
      }
    });

    stream.on('close', () => {
      console.info('mongoosastic-close %o : %o', title, count);
    });

    stream.on('error', (e) => {
      if (e) console.info('mongoosastic-error %o : %o : %o', title, count, e);
    });
  });
}

export const defaultPlugin = plugin;
