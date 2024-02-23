import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { CampaignCategory, CampaignCategoryDocument, CampaignCategoryModel } from '../models/CampaignCategory';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';

@injectable()
export class CampaignCategoryService {
  async create(
    data: {
      title: CampaignCategory['title'];
      description: CampaignCategory['description'];
    },
  ): Promise<CampaignCategory> {
    const campaignCategory = await new CampaignCategoryModel(pickBy(data)).save();

    return campaignCategory;
  }

  async update(
    CampaignCategoryId: string,
    update: {
      title?: CampaignCategory['title'];
      description?: CampaignCategory['description'];
      status?: CampaignCategory['status'];
    },
  ): Promise<CampaignCategory> {
    let campaignCategory = await CampaignCategoryModel.findById(CampaignCategoryId);

    if (!campaignCategory) throw new APIError({ message: 'Campaign Category not found', status: 404 });

    campaignCategory = await CampaignCategoryModel.findByIdAndUpdate(CampaignCategoryId, { $set: pickBy(update) }, { runValidators: true, new: true });

    return campaignCategory;
  }

  async findById(campaignCategoryId: string): Promise<CampaignCategory> {
    const campaignCategory = await CampaignCategoryModel.findById(campaignCategoryId);

    if (!campaignCategory) throw new APIError({ message: 'Campaign Category not found', status: 404 });

    return campaignCategory;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<CampaignCategoryDocument>> {
    let pageResult: PageResult<CampaignCategoryDocument>;

    const { q, page, limit, populate } = pageOptions;

    if (q) {
      const docs = await CampaignCategoryModel.look(q, { query, populate, page, limit });
      pageResult = { docs, limit: docs.length, total: docs.length, sort: '', page: 1, pages: 1 };
    } else {
      pageResult = await CampaignCategoryModel.page(pickBy(query), pageOptions);
    }
    return pageResult;
  }

  async delete(campaignCategoryId: string): Promise<CampaignCategory> {
    const campaignCategory = await CampaignCategoryModel.findById(campaignCategoryId);

    if (!campaignCategory) throw new APIError({ message: 'Campaign Category not found', status: 404 });

    await CampaignCategoryModel.findByIdAndDelete(campaignCategoryId);

    return campaignCategory;
  }
}
