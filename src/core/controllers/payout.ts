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
        userId: Joi.string().required(),
        amount: Joi.number().required(),
        currency: Joi.string().required(),
      }),
    }),
  )
  async initiate(): Promise<void> {
    const {
      request: {
        body: { userId, amount, currency },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.initiate({ userId, amount, currency });

    response.json({ payout });
  }

  @httpPost(
    '/',
    celebrate({
      body: Joi.object({
        userId: Joi.string().required(),
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
        body: { userId, ref, amount, currency, status, paymentMethod },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.create({ user: userId, ref, amount, currency, status, paymentMethod });

    response.json({ payout });
  }

  @httpPut(
    '/:payoutId',
    celebrate({
      body: Joi.object({
        userId: Joi.string(),
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
        body: { userId, amount, currency, ref, status, paymentMethod },
        params: { payoutId },
      },
      response,
    } = this.httpContext;

    const payout = await this.payoutService.update(payoutId, { user: userId, amount, currency, status, ref, paymentMethod });

    response.json({ payout });
  }
  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        payoutId: Joi.string(),
        userId: Joi.string(),
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
    const { payoutId, sort, page, limit, dateStart, dateEnd, status, userId, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (payoutId) {
      const payout = await this.payoutService.findById(payoutId);

      this.httpContext.response.json({ payout });

      return;
    }

    let query: Query = {};

    if (userId) query = { ...query, ...{ user: userId } };

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
        { path: 'user', }
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
