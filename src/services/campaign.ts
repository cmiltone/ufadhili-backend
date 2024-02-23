import { injectable } from 'inversify';
import { pickBy } from 'lodash';

import { Campaign, CampaignDocument, CampaignModel } from '../models/Campaign';
import { PageOptions, PageResult, Query } from '../types/db';
import APIError from '../util/APIError';
import { File } from '../types/file';

@injectable()
export class CampaignService {
  async create(
    data: {
      title: Campaign['title'];
      description: Campaign['description'];
      owner: Campaign['owner'];
      target: Campaign['target'];
      category: Campaign['category'];
    },
  ): Promise<Campaign> {
    const campaign = await new CampaignModel(pickBy(data)).save();

    await campaign.populate([{ path: 'owner' }, { path: 'category' }]);

    return campaign;
  }

  async update(
    CampaignId: string,
    update: {
      title?: Campaign['title'];
      description?: Campaign['description'];
      owner?: Campaign['owner'];
      target?: Campaign['target'];
      status?: Campaign['status'];
      coverImage?: Campaign['coverImage'];
      category?: Campaign['category'];
    },
  ): Promise<Campaign> {
    let campaign = await CampaignModel.findById(CampaignId);

    if (!campaign) throw new APIError({ message: 'Campaign not found', status: 404 });

    campaign = await CampaignModel.findByIdAndUpdate(CampaignId, { $set: pickBy(update) }, { runValidators: true, new: true });

    await campaign.populate([{ path: 'owner' }, { path: 'category' }]);

    return campaign;
  }

  async findById(campaignId: string): Promise<Campaign> {
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) throw new APIError({ message: 'Campaign not found', status: 404 });

    await campaign.populate([{ path: 'owner' }, { path: 'category' }]);

    return campaign;
  }

  async page(query: Query, pageOptions: PageOptions): Promise<PageResult<CampaignDocument>> {
    let pageResult: PageResult<CampaignDocument>;

    const { q, page, limit, populate } = pageOptions;

    if (q) {
      const docs = await CampaignModel.look(q, { query, populate, page, limit });
      pageResult = { docs, limit: docs.length, total: docs.length, sort: '', page: 1, pages: 1 };
    } else {
      pageResult = await CampaignModel.page(pickBy(query), pageOptions);
    }
    return pageResult;
  }

  async delete(campaignId: string): Promise<Campaign> {
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) throw new APIError({ message: 'Campaign not found', status: 404 });

    await CampaignModel.findByIdAndDelete(campaignId);

    await campaign.populate([{ path: 'owner' }, { path: 'category' }]);

    return campaign;
  }

  async count(query: Query): Promise<number> {
    const num = await CampaignModel.countDocuments(query);

    return num;
  }

  async uploadCoverImage(data: { campaignId: string; file: File }): Promise<Campaign> {
    const { campaignId, file } = data;
    let campaign = await this.findById(campaignId);

    campaign = await this.update(campaign._id, { coverImage: `${file.filename}` });

    return campaign;
  }
}
