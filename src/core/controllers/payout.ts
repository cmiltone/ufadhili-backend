import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import {
  controller,
  BaseHttpController,
  httpGet,
  httpDelete,
  requestParam,
  httpPost,
  httpPut,
} from 'inversify-express-utils';

import { PayoutService } from '../../services/payout';
import { Query } from '../../types/db';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/payout', AuthMiddleware)
export class PayoutController extends BaseHttpController {
  @inject(PayoutService)
  private payoutService: PayoutService;

  @httpPost(
    '/initiate',
    celebrate({
      body: Joi.object({
        campaignId: Joi.string().required(),
        amount: Joi.number().required(),
        currency: Joi.string().required(),
      }),
    }),
  )
  async initiate(): Promise<void> {
    const {
      request: {
        body: { campaignId, amount, currency },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.initiate({ campaignId, amount, currency });

    response.json({ payout });
  }

  @httpPost(
    '/',
    celebrate({
      body: Joi.object({
        campaignId: Joi.string().required(),
        amount: Joi.number().required(),
        currency: Joi.string().required(),
        ref: Joi.date().iso().required(),
        status: Joi.string().allow('pending', 'paid'),
        paymentMethod: Joi.string().required().allow('mobile_money', 'card'),
      }),
    }),
  )
  async create(): Promise<void> {
    const {
      request: {
        body: { campaignId, ref, amount, currency, status, paymentMethod },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.create({ campaign: campaignId, ref, amount, currency, status, paymentMethod });

    response.json({ payout });
  }

  @httpPut(
    '/:payoutId',
    celebrate({
      body: Joi.object({
        campaignId: Joi.string(),
        amount: Joi.string(),
        currency: Joi.string(),
        ref: Joi.string(),
        status: Joi.string().allow('pending', 'paid'),
        paymentMethod: Joi.string().required().allow('mobile_money', 'card'),
      }),
    }),
  )
  async update(): Promise<void> {
    const {
      request: {
        body: { campaignId, amount, currency, ref, status, paymentMethod },
        params: { payoutId },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.update(payoutId, { campaign: campaignId, amount, currency, status, ref, paymentMethod });

    response.json({ payout });
  }
  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        payoutId: Joi.string(),
        campaignId: Joi.string(),
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
    const { payoutId, sort, page, limit, dateStart, dateEnd, status, campaignId, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (payoutId) {
      const payout = await this.payoutService.findById(payoutId);

      this.httpContext.response.json({ payout });

      return;
    }

    let query: Query = {};

    if (campaignId) query = { ...query, ...{ campaign: campaignId } };

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

    const payoutPage = await this.payoutService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [
        { path: 'campaign', }
      ],
    });

    this.httpContext.response.json({ payoutPage });
  }

  @httpDelete(
    '/:payoutId',
    AuthAdminMiddleware,
    celebrate({
      params: Joi.object({
        payoutId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('payoutId') payoutId: string): Promise<void> {
    const payout = await this.payoutService.delete(payoutId);

    this.httpContext.response.json({ payout });
  }
}
