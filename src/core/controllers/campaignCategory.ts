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

import { CampaignCategoryService } from '../../services/campaignCategory';
import { Query } from '../../types/db';
import { AuthMiddleware } from '../middlewares/auth';

@controller('/v1/campaign-category', AuthMiddleware)
export class CampaignCategoryController extends BaseHttpController {
  @inject(CampaignCategoryService)
  private campaignCategoryService: CampaignCategoryService;

  @httpPost(
    '/',
    celebrate({
      body: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
      }),
    }),
  )
  async create(): Promise<void> {
    const {
      request: {
        body: { title, description },
      },
      response,
    } = this.httpContext;

    const campaignCategory = await this.campaignCategoryService.create({ title, description });

    response.json({ campaignCategory });
  }

  @httpPut(
    '/:campaignCategoryId',
    celebrate({
      body: Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        status: Joi.string().allow('active', 'inactive'),
      }),
    }),
  )
  async update(): Promise<void> {
    const {
      request: {
        body: { title, description, status },
        params: { campaignCategoryId },
      },
      response,
    } = this.httpContext;

    const campaignCategory = await this.campaignCategoryService.update(campaignCategoryId, { title, description, status });

    response.json({ campaignCategory });
  }

  @httpGet(
    '/',
    celebrate({
      query: Joi.object({
        campaignCategoryId: Joi.string(),
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
    const { campaignCategoryId, sort, page, limit, dateStart, dateEnd, status, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (campaignCategoryId) {
      const campaignCategory = await this.campaignCategoryService.findById(campaignCategoryId);

      this.httpContext.response.json({ campaignCategory });

      return;
    }

    let query: Query = {};

    if (status) query = { ...query, ...{ status } };

    if (dateStart) query = { ...query, ...{ createdAt: { $gte: dateStart } } };

    if (dateEnd) query = { ...query, ...{ createdAt: { $lt: dateEnd } } };

    if (dateStart && dateEnd)
      query = {
        ...query,
        ...{
          $and: [{ createdAt: { $gte: dateStart } }, { createdAt: { $lt: dateEnd } }],
        },
      };

    const campaignCategoryPage = await this.campaignCategoryService.page(query, {
      sort,
      page,
      limit,
      q,
    });

    this.httpContext.response.json({ campaignCategoryPage });
  }

  @httpDelete(
    '/:campaignCategoryId',
    celebrate({
      params: Joi.object({
        campaignCategoryId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('campaignCategoryId') campaignCategoryId: string): Promise<void> {
    const campaignCategory = await this.campaignCategoryService.delete(campaignCategoryId);

    this.httpContext.response.json({ campaignCategory });
  }
}
