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

import { PaymentService } from '../../services/payment';
import { Query } from '../../types/db';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/payment', AuthMiddleware)
export class PaymentController extends BaseHttpController {
  @inject(PaymentService)
  private paymentService: PaymentService;

  @httpPost(
    '/',
    AuthMiddleware,
    celebrate({
      body: Joi.object({
        campaignId: Joi.string().required(),
        ref: Joi.string().required(),
        paystackRef: Joi.string().required(),
      }),
    }),
  )
  async create(): Promise<void> {
    const {
      request: {
        body: { campaignId, ref, paystackRef },
      },
      response,
    } = this.httpContext;

    const payment = await this.paymentService.create({ campaign: campaignId, ref, paystackRef });

    response.json({ payment });
  }

  @httpPost(
    '/pay-by-mobile-money',
    AuthMiddleware,
    celebrate({
      body: Joi.object({
        campaignId: Joi.string().required(),
        phone: Joi.string().required(),
        provider: Joi.string().equal('mpesa').required(),
        amout: Joi.number().required(),
      }),
    }),
  )
  async payByMobileMoney(): Promise<void> {
    const {
      request: {
        body: { campaignId, phone, provider, amount },
      },
      response,
    } = this.httpContext;

    const payment = await this.paymentService.payByMoileMoney({ campaign: campaignId, phone, provider, amount });

    response.json({ payment });
  }

  @httpPost(
    '/pay-by-card',
    AuthMiddleware,
    celebrate({
      body: Joi.object({
        campaignId: Joi.string().required(),
        reference: Joi.string().required(),
        amout: Joi.number().required(),
      }),
    }),
  )
  async payByCard(): Promise<void> {
    const {
      request: {
        body: { campaignId, reference, amount },
      },
      response,
    } = this.httpContext;

    const payment = await this.paymentService.payByCard({ campaign: campaignId, reference, amount });

    response.json({ payment });
  }

  @httpPut(
    '/:paymentId',
    AuthAdminMiddleware,
    celebrate({
      body: Joi.object({
        campaignId: Joi.string(),
        ref: Joi.string(),
        amount: Joi.string(),
        currency: Joi.string(),
        paystackRef: Joi.string(),
        techFee: Joi.number(),
        status: Joi.string().allow('paid', 'pending'),
      }),
    }),
  )
  async update(): Promise<void> {
    const {
      request: {
        body: { campaignId, amount, paystackRef, status, techFee, currency },
        params: { paymentId },
      },
      response,
    } = this.httpContext;

    const payment = await this.paymentService.update(
      paymentId,
      { campaign: campaignId, amount, paystackRef, status, techFee, currency },
    );

    response.json({ payment });
  }

  @httpGet(
    '/convert',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        amount: Joi.number().required(),
        from: Joi.string().required(),
        to: Joi.string().required(),
      }),
    }),
  )
  async convert(): Promise<void> {
    const { amount, from, to } = this.httpContext.request.query as any;

    const converted = await this.paymentService.convert({ amount, from, to});

    this.httpContext.response.json({ amount: converted });
  }

  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        paymentId: Joi.string(),
        ref: Joi.string(),
        campaignId: Joi.string(),
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
    const { paymentId, sort, page, limit, ref, dateStart, dateEnd, status, campaignId, userId, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (paymentId) {
      const payment = await this.paymentService.findById(paymentId);

      this.httpContext.response.json({ payment });

      return;
    }

    if (ref) {
      const payment = await this.paymentService.findByRef(ref);

      this.httpContext.response.json({ payment });

      return;
    }

    let query: Query = {};

    if (campaignId) query = { ...query, ...{ campaign: campaignId } };

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

    const paymentPage = await this.paymentService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [
        {
          path: 'campaign',
          populate: [
            { path: 'owner' },
          ]
        },
        { path: 'user' },
      ],
    });

    this.httpContext.response.json({ paymentPage });
  }

  @httpDelete(
    '/:paymentId',
    AuthAdminMiddleware,
    celebrate({
      params: Joi.object({
        paymentId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('paymentId') paymentId: string): Promise<void> {
    const payment = await this.paymentService.delete(paymentId);

    this.httpContext.response.json({ payment });
  }
}
