import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import {
  httpPut,
  controller,
  BaseHttpController,
  httpGet,
  httpDelete,
  httpPost,
  requestParam,
} from 'inversify-express-utils';

import { CampaignService } from '../../services/campaign';
import { Query } from '../../types/db';
import { AuthMiddleware } from '../middlewares/auth';
import { upload, UploadMiddleware } from '../middlewares/upload';
import { FILE_PATH } from '../../config/multer';
import { fileJoi } from '../../util/joi';

@controller('/v1/campaign', AuthMiddleware)
export class CampaignController extends BaseHttpController {
  @inject(CampaignService)
  private campaignService: CampaignService;

  @httpPost(
    '/',
    celebrate({
      body: Joi.object({
        ownerId: Joi.string().required(),
        title: Joi.string().required(),
        description: Joi.string(),
        target: Joi.object({
          amount: Joi.number().min(0),
          currency: Joi.string().allow('KES'),
        }).required(),
        category: Joi.string(),
      }),
    }),
  )
  async create(): Promise<void> {
    const {
      request: {
        body: { ownerId, title,description, target, category },
      },
      response,
    } = this.httpContext;

    const campaign = await this.campaignService.create({ owner: ownerId, title, description, target, category });

    response.json({ campaign });
  }

  @httpPut(
    '/:campaignId/cover-image',
    upload({ filePath: FILE_PATH, fileName: 'file' }),
    UploadMiddleware,
    celebrate({
      body: Joi.object({
        file: fileJoi,
      }),
    }),
  )
  async updateCoverImage(): Promise<void> {
    const {
      request: {
        body: { file },
        params: { campaignId },
      },
      response,
    } = this.httpContext;

    const campaign = await this.campaignService.uploadCoverImage({ campaignId, file });

    response.json({ campaign });
  }

  @httpPut(
    '/:campaignId',
    celebrate({
      body: Joi.object({
        ownerId: Joi.string(),
        title: Joi.string(),
        description: Joi.string(),
        target: Joi.object({
          amount: Joi.number().min(0),
          currency: Joi.string().allow('KES'),
        }),
        category: Joi.string(),
        status: Joi.string().allow('active', 'inactive'),
      }),
    }),
  )
  async update(): Promise<void> {
    const {
      request: {
        body: { ownerId, title, description, target, category, status },
        params: { campaignId },
      },
      response,
    } = this.httpContext;

    const campaign = await this.campaignService.update(campaignId, { owner: ownerId, title, description, target, category, status });

    response.json({ campaign });
  }

  @httpGet(
    '/',
    celebrate({
      query: Joi.object({
        campaignId: Joi.string(),
        ownerId: Joi.string(),
        categoryIds: Joi.array().items(Joi.string()),
        status: Joi.string(),
        q: Joi.string().allow(''),
        sort: Joi.string(),
        page: Joi.number(),
        limit: Joi.number(),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso(),
      }),
    }),
  )
  async retrieve(): Promise<void> {
    const { campaignId, sort, page, limit, title, dateStart, dateEnd, status, ownerId, q, categoryIds } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (campaignId) {
      const campaign = await this.campaignService.findById(campaignId);

      this.httpContext.response.json({ campaign });

      return;
    }

    let query: Query = {};

    if (ownerId) query = { ...query, ...{ owner: ownerId } };

    if (status) query = { ...query, ...{ status } };

    if (title) query = { ...query, ...{ user: title } };

    if (categoryIds) query = { ...query, ...{ category: { $in: categoryIds } } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const campaignPage = await this.campaignService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [{ path: 'owner' }, { path: 'category' }],
    });

    this.httpContext.response.json({ campaignPage });
  }

  @httpDelete(
    '/:campaignId',
    celebrate({
      params: Joi.object({
        campaignId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('campaignId') campaignId: string): Promise<void> {
    const campaign = await this.campaignService.delete(campaignId);

    this.httpContext.response.json({ campaign });
  }

  @httpGet(
    '/count',
    celebrate({
      query: Joi.object({
        ownerId: Joi.string(),
        status: Joi.string(),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso(),
      }),
    }),
  )
  async count(): Promise<void> {
    const { title, dateStart, dateEnd, status, ownerId } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    let query: Query = {};

    if (ownerId) query = { ...query, ...{ owner: ownerId } };

    if (status) query = { ...query, ...{ status } };

    if (title) query = { ...query, ...{ user: title } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const campaignCount = await this.campaignService.count(query);

    this.httpContext.response.json({ campaignCount });
  }
}
