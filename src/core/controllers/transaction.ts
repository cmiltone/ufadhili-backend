import { inject } from 'inversify';
import { celebrate, Joi } from 'celebrate';
import {
  controller,
  BaseHttpController,
  httpGet,
  httpDelete,
  requestParam,
} from 'inversify-express-utils';

import { TransactionService } from '../../services/transaction';
import { Query } from '../../types/db';
import { AuthAdminMiddleware, AuthMiddleware } from '../middlewares/auth';

@controller('/v1/transaction', AuthMiddleware)
export class TransactionController extends BaseHttpController {
  @inject(TransactionService)
  private transactionService: TransactionService;

  @httpGet(
    '/',
    AuthMiddleware,
    celebrate({
      query: Joi.object({
        transactionId: Joi.string(),
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
    const { transactionId, sort, page, limit, dateStart, dateEnd, status, campaignId, q } = this.httpContext.request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query as any;

    if (transactionId) {
      const transaction = await this.transactionService.findById(transactionId);

      this.httpContext.response.json({ transaction });

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

    const transactionPage = await this.transactionService.page(query, {
      sort,
      page,
      limit,
      q,
      populate: [
        { path: 'campaign', },
        { path: 'payment', populate: [{ path: 'campaign' }, { path: 'user'}]},
        { path: 'payout' },
      ],
    });

    this.httpContext.response.json({ transactionPage });
  }

  @httpDelete(
    '/:transactionId',
    AuthAdminMiddleware,
    celebrate({
      params: Joi.object({
        transactionId: Joi.string().required(),
      }),
    }),
  )
  async remove(@requestParam('transactionId') transactionId: string): Promise<void> {
    const transaction = await this.transactionService.delete(transactionId);

    this.httpContext.response.json({ transaction });
  }
}
